/**
 * Writes citations and bibliographies with a style of citation, as Word does when it updates a document's fields: it
 * works out what each source cited needs to be told apart from the others, and gives the style each source of a
 * citation in turn.
 *
 * @module
 */
import { type FormattedText, join, mergeRuns, readAsWord } from "./styles/formatted-text";
import type { CitedSource, FormattedBibliography, StyleDefinition } from "./styles/style";
import { type Role, type WordPerson, type WordSource, type WordSourceType } from "./word-source";

/**
 * A source a citation cites, and how: the pages or volume it cites, text before or after it, and what it leaves out.
 *
 * @publicApi
 */
export type CitedSourceOptions = {
    /** The tag of the source cited, such as "Dic06" */
    readonly source: string;
    /** The pages cited, such as "50" or "50-62", which most styles write as "p. 50" or "pp. 50-62" */
    readonly pages?: string;
    /** The volume cited, such as "2" */
    readonly volume?: string;
    /** Text before the source, such as "see " */
    readonly prefix?: string;
    /** Text after the source, such as ", emphasis added" */
    readonly suffix?: string;
    /** Leaves out the source's authors, such as when they're named in the text */
    readonly hideAuthor?: boolean;
    /** Leaves out the source's year */
    readonly hideYear?: boolean;
    /** Leaves out the source's title, for the styles that write it */
    readonly hideTitle?: boolean;
};

// The roles whose people a style names a source by, in the order it looks for them, by type of source: Word's
// MainContributors. Word compares the people of these roles to tell sources apart
const MAIN_ROLES: Readonly<Record<WordSourceType, readonly Role[]>> = {
    Book: ["Author", "Editor"],
    BookSection: ["Author"],
    JournalArticle: ["Author", "Editor"],
    ArticleInAPeriodical: ["Author", "Editor"],
    ConferenceProceedings: ["Author", "Editor"],
    Report: ["Author"],
    SoundRecording: ["Composer", "Performer", "Conductor"],
    Performance: ["Writer", "Director", "Performer"],
    Art: ["Artist"],
    DocumentFromInternetSite: ["Author", "Editor"],
    InternetSite: ["Author", "Editor"],
    Film: ["ProducerName", "Writer", "Director"],
    Interview: ["Interviewee", "Editor", "Translator"],
    Patent: ["Inventor"],
    ElectronicSource: ["Author", "Editor"],
    Case: [],
    Misc: ["Author", "Editor"],
};

/** The people a source is named by, or none when it is named by an organization or has no one in those roles */
const mainPeopleOf = (source: WordSource): readonly WordPerson[] => {
    for (const role of MAIN_ROLES[source.type]) {
        const names = source.names[role];
        if (names) {
            return "people" in names ? names.people : [];
        }
    }
    return [];
};

const isSamePerson = (a: WordPerson, b: WordPerson): boolean => a.last === b.last && a.first === b.first && a.middle === b.middle;

/** How many of their first people two lists of people have in common */
const commonPeople = (a: readonly WordPerson[], b: readonly WordPerson[]): number => {
    let count = 0;
    while (count < a.length && count < b.length && isSamePerson(a[count], b[count])) {
        count++;
    }
    return count;
};

/**
 * What Word works out from a document's sources to tell a source apart in its citations: whether another source has
 * the same first author, or the same first three when it has more than three, whether another source's first author
 * has the same last name but is someone else, and how many of its authors tell it apart. Sources named by an
 * organization, or by nobody, aren't compared.
 */
const flagsOf = (
    source: WordSource,
    sources: readonly WordSource[],
): Pick<CitedSource, "repeatedAuthor" | "nonUniqueLastName" | "minAuthors"> => {
    const people = mainPeopleOf(source);
    if (people.length === 0) {
        return { repeatedAuthor: false, nonUniqueLastName: false, minAuthors: 1 };
    }
    const others = sources
        .filter((other) => other !== source)
        .map(mainPeopleOf)
        .filter((other) => other.length > 0);
    const compared = people.length > 3 ? 3 : 1;
    const repeatedAuthor = others.some((other) => other.length >= compared && commonPeople(people, other) >= compared);
    const nonUniqueLastName = others.some((other) => other[0].last === people[0].last && !isSamePerson(other[0], people[0]));
    // A source whose authors don't tell it apart has its title in the citation, and two of its authors in Chicago's
    const minAuthors = repeatedAuthor ? 2 : Math.max(1, ...others.map((other) => commonPeople(people, other) + 1));
    return { repeatedAuthor, nonUniqueLastName, minAuthors };
};

/**
 * Where each source is in the order the document cites them in, from 1, as Word numbers them (`b:RefOrder`): the
 * sources cited, in the order they're first cited, then the others in the order they're listed in.
 *
 * @param tags - The tags of the sources the document cites, in the order it cites them
 */
export const citationOrderOf = (sourceTags: readonly string[], citedTags: readonly string[]): ReadonlyMap<string, number> => {
    const order = new Map<string, number>();
    for (const tag of [...citedTags, ...sourceTags]) {
        if (!order.has(tag) && sourceTags.includes(tag)) {
            // eslint-disable-next-line functional/immutable-data
            order.set(tag, order.size + 1);
        }
    }
    return order;
};

/**
 * A citation of one or more sources, as the style writes it: each source in turn, each read as Word reads a style's
 * HTML.
 *
 * @throws If a source cited isn't one of the sources
 */
export const formatCitation = (
    style: StyleDefinition,
    sources: readonly WordSource[],
    cited: readonly CitedSourceOptions[],
): FormattedText =>
    mergeRuns(
        join(
            ...cited.map((options, index) => {
                const source = sources.find((candidate) => candidate.tag === options.source);
                if (!source) {
                    throw new Error(
                        `A citation cites the source "${options.source}", which isn't one of the bibliography's sources. Its sources' tags are ${sources
                            .map(({ tag }) => `"${tag}"`)
                            .join(", ")}`,
                    );
                }
                return readAsWord(
                    style.citation({
                        source,
                        first: index === 0,
                        last: index === cited.length - 1,
                        ...flagsOf(source, sources),
                        hideAuthor: !!options.hideAuthor,
                        hideYear: !!options.hideYear,
                        hideTitle: !!options.hideTitle,
                        pages: options.pages ?? "",
                        volume: options.volume ?? "",
                        prefix: options.prefix,
                        suffix: options.suffix,
                    }),
                );
            }),
        ),
    );

/** A bibliography of the sources, as the style writes it, with each paragraph and cell read as Word reads a style's HTML */
export const formatBibliography = (style: StyleDefinition, sources: readonly WordSource[]): FormattedBibliography => {
    const bibliography = style.bibliography(sources);
    return "rows" in bibliography
        ? { rows: bibliography.rows.map(([label, entry]) => [readAsWord(label), readAsWord(entry)] as const) }
        : { paragraphs: bibliography.paragraphs.map(readAsWord), hangingIndent: bibliography.hangingIndent };
};
