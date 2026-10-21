/**
 * MLA, seventh edition: citations such as "(Baker 50)", and a bibliography of the sources sorted by their authors, such
 * as "Baker, Anna. The Art of Pizza. Naples: Pizza Press, 2010.", each indented after its first line, with "—" in place
 * of the authors of the entry before when they are the same.
 *
 * Written from Word's style, MLASeventhEditionOfficeOnline.xsl, whose templates and variables each function names.
 *
 * @module
 */
import { type FormattedText, type TextLike, italic, join, textOf } from "./formatted-text";
import { LOCALS } from "./locals";
import type { CitedSource, FormattedBibliography, StyleDefinition } from "./style";
import { sortByKey, translate, xslTemplates } from "./xsl";
import { type Field, type Role, type WordNames, type WordSource, type WordSourceType, fieldOf } from "../word-source";

// Some of the style's names for its templates and variables, as it spells them
// cspell:words Seperator VIYP dups

const { General, Strings, MLA } = LOCALS;
const { appendDot, formatDatePrivate, formatName, needDot, stringFormat, stringFormatDot } = xslTemplates(General);
const SPACE = General.Space;
const LIST = General.ListSeparator;

/**
 * The roles whose people each type of source is named by, in the order the style looks for them. A film's last is its
 * producers, which the style looks for as `b:Producer`, which no source has
 */
const MAIN_ROLES: Readonly<Record<WordSourceType, readonly Role[]>> = {
    Book: ["Author", "Editor", "Translator"],
    BookSection: ["Author"],
    JournalArticle: ["Author"],
    ArticleInAPeriodical: ["Author"],
    ConferenceProceedings: ["Author", "Editor"],
    Report: ["Author"],
    SoundRecording: ["Performer", "Conductor", "Composer"],
    Performance: ["Writer", "Director", "Performer"],
    Art: ["Artist"],
    DocumentFromInternetSite: ["Author"],
    InternetSite: ["Author"],
    Film: ["Writer", "Director", "Performer"],
    Interview: ["Interviewee"],
    Patent: ["Inventor"],
    ElectronicSource: ["Author", "Editor", "Compiler", "Translator"],
    Case: [],
    Misc: ["Author"],
};

/** The text of the people with a role, or of the organization, as the style reads a role's string value */
const stringValueOf = (names: WordNames | undefined): string =>
    !names ? "" : "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");

/** The people a source is named by: those with the first of its main roles that has any (`MainContributors`) */
const mainContributorsOf = (source: WordSource): WordNames | undefined => {
    const role = MAIN_ROLES[source.type].find((candidate) => stringValueOf(source.names[candidate]) !== "");
    return role === undefined ? undefined : source.names[role];
};

/**
 * What comes after a person in a list of people: "et al." after the first of more than three, who is the only one
 * written, "and" before the last of two or three, and a list separator after the others (`formatPersonSeperator`)
 */
const personSeparator = (position: number, count: number): string =>
    count > 3
        ? position === 1
            ? LIST + Strings.AndOthersUnCap
            : ""
        : position === count - 1
          ? SPACE + Strings.AndUnCap + SPACE
          : position === count
            ? ""
            : LIST;

/**
 * The people who made a source, as an entry starts with them, such as "Baker, Anna, Ravi Patel and Mary Ann Jones", or
 * "Baker, Anna, et al." for more than three, or the organization (`formatPersonsAuthor`)
 */
const personsAuthor = (names: WordNames | undefined): string => {
    if (!names) {
        return "";
    }
    if ("corporate" in names) {
        return names.corporate;
    }
    const count = names.people.length;
    return names.people
        .map(
            (person, index) =>
                (index === 0 ? formatName(person, MLA.MainAuthor) : count <= 3 ? formatName(person, MLA.OtherAuthors) : "") +
                personSeparator(index + 1, count),
        )
        .join("");
};

/** People later in an entry, such as "Ravi Patel and Mary Ann Jones" as its editors, or the organization (`formatPersons`) */
const persons = (names: WordNames | undefined): string => {
    if (!names) {
        return "";
    }
    if ("corporate" in names) {
        return names.corporate;
    }
    const count = names.people.length;
    return names.people
        .map(
            (person, index) =>
                (count <= 3 || index === 0 ? formatName(person, MLA.SecondaryAuthors) : "") + personSeparator(index + 1, count),
        )
        .join("");
};

/** How many people have a role, which is none when an organization has it */
const countOf = (source: WordSource, role: Role): number => {
    const names = source.names[role];
    return names && "people" in names ? names.people.length : 0;
};

/** The word for several people, or for one, or nothing for an organization, as the style counts the people */
const wordFor = (count: number, one: string, many: string): string => (count > 1 ? many : count === 1 ? one : "");

/** The year, or "n.d." without one (`getYear`) */
const yearOf = (source: WordSource): string => fieldOf(source, "Year") || Strings.NoDateShortUnCap;

/** The date, such as "14 March 2018", or "n.d." without a year (`formatDate`) */
const dateOf = (source: WordSource): string => {
    const year = fieldOf(source, "Year");
    return year ? formatDatePrivate(fieldOf(source, "Day"), fieldOf(source, "Month"), year, MLA.Date) : Strings.NoDateShortUnCap;
};

/** The date the source was read, or nothing without a year (`formatDateAccessed`) */
const dateAccessedOf = (source: WordSource): string => {
    const year = fieldOf(source, "YearAccessed");
    return year ? formatDatePrivate(fieldOf(source, "DayAccessed"), fieldOf(source, "MonthAccessed"), year, MLA.Date) : "";
};

/** The text without the spaces, tabs and line feeds at its ends, and with each run of them in it as one space (`normalize-space`) */
const normalizeSpace = (text: string): string => text.replace(/[ \t\r\n]+/g, " ").replace(/^ | $/g, "");

/** Three fields, with a separator between the first two and another before the third, and a dot after them */
const fieldsDot = (first: string, second: string, third: string, firstSeparator: string, secondSeparator: string): string => {
    const firstTwo = first + (first && second ? firstSeparator : "") + second;
    return appendDot(firstTwo + (firstTwo && third ? secondSeparator : "") + third);
};

/** The first field, ": ", the second, ", " and the third, such as "Naples: Pizza Press, 2010." (`templateA`) */
const templateA = (first: string, second: string, third: string): string => fieldsDot(first, second, third, General.EnumSeparator, LIST);

/** The first field, ": " and the second, such as "Italy: Patent 123." (`templateB`) */
const templateB = (first: string, second: string): string => fieldsDot(first, second, "", General.EnumSeparator, "");

/** The first field, ", " and the second, such as "National Gallery, London." (`templateC`) */
const templateC = (first: string, second: string): string => fieldsDot(first, second, "", LIST, "");

/** The first field, ", ", the second, ": " and the third, such as "14 March 2018, late ed.: 12-14." (`templateE`) */
const templateE = (first: string, second: string, third: string): string => fieldsDot(first, second, third, LIST, General.EnumSeparator);

/** A journal's volume and issue, its year in brackets and the pages, such as "12.4 (2018): 233-250." (`templateVIYP`) */
const templateVIYP = (source: WordSource): string => {
    const volume = fieldOf(source, "Volume");
    const issue = fieldOf(source, "Issue");
    const pages = fieldOf(source, "Pages");
    // The year is "n.d." without one, so it is always written
    return appendDot(
        volume +
            (volume && issue ? General.Dot : "") +
            issue +
            SPACE +
            General.OpenBracket +
            yearOf(source) +
            General.CloseBracket +
            (pages ? General.EnumSeparator : "") +
            pages,
    );
};

/** The medium, the date the source was read and its address, such as "Web. 3 May 2019. <https://pizza.example>." (`templateMDaU`) */
const templateMDaU = (source: WordSource): string => {
    const medium = appendDot(fieldOf(source, "Medium"));
    const accessed = appendDot(dateAccessedOf(source));
    const url = fieldOf(source, "URL");
    const accessedUrl = appendDot(accessed + (accessed && url ? SPACE : "") + (url ? General.OpenLink + url + General.CloseLink : ""));
    return medium + (medium && accessedUrl ? SPACE : "") + accessedUrl;
};

/** The format of a volume, or of volumes when it has a comma or a hyphen in it, such as "2-3" */
const volumeFormatOf = (volume: string, one: string, many: string): string =>
    volume.includes(",") || translate(volume, General.Hyphens, "").length !== volume.length ? many : one;

/** A part of an entry: its name, its text, and the parts before it whose text puts a space before it, or all of them */
type Part = readonly [name: string, text: TextLike, after?: readonly string[]];

/** The parts of an entry that have text, each with a space before it when a part before it has text, as the style writes them */
const spaced = (...parts: readonly Part[]): FormattedText =>
    parts.reduce<{ readonly text: FormattedText; readonly written: readonly string[]; readonly names: readonly string[] }>(
        (entry, [name, text, after = entry.names]) => {
            const names = [...entry.names, name];
            if (textOf(text).length === 0) {
                return { ...entry, names };
            }
            const space = after.some((other) => entry.written.includes(other)) ? SPACE : "";
            return { text: join(entry.text, space, text), written: [...entry.written, name], names };
        },
        { text: [], written: [], names: [] },
    ).text;

/** A title in italics, and a dot after it unless it ends a sentence */
const italicDot = (title: string): FormattedText => join(italic(title), needDot(title));

/** A title and a dot after it, in quotes */
const quotedDot = (title: string): string => (title ? General.OpenQuote + appendDot(title) + General.CloseQuote : "");

/** People with a role and the word for it before them, such as "Ed. Ravi Patel.", or an organization with a space before it */
const prefixDot = (people: string, count: number, one: string, many: string): string =>
    people ? wordFor(count, one, many) + SPACE + appendDot(people) : "";

/** People named first and the word for their role, such as "Patel, Ravi, ed." */
const suffixLF = (people: string, count: number, one: string, many: string): string =>
    people ? people + LIST + wordFor(count, one, many) : "";

/** The variables the style writes each type of source from, by their names in the style */
type Variables = {
    readonly author: string;
    readonly authorDot: string;
    readonly sectionAuthorDot: string;
    readonly bookAuthorDot: string;
    readonly performerLF: string;
    readonly performerLFDot: string;
    readonly conductorLFDot: string;
    readonly composerLFDot: string;
    readonly artistDot: string;
    readonly intervieweeLFDot: string;
    readonly inventorLFDot: string;
    readonly interviewer: string;
    readonly interviewerDot: string;
    readonly writer: string;
    readonly composer: string;
    readonly editor: string;
    readonly translator: string;
    readonly suffixEditorLFDot: string;
    readonly suffixTranslatorLFDot: string;
    readonly suffixCompilerLFDot: string;
    readonly prefixEditorDot: string;
    readonly prefixTranslatorDot: string;
    readonly prefixDirectorDot: string;
    readonly prefixPerformerDot: string;
    readonly prefixConductorDot: string;
    readonly prefixCompilerDot: string;
    readonly prefixVersionDot: string;
    readonly prefixVolumeDot: string;
    readonly noVolumesSufDot: string;
    readonly prefixCaseNoDot: string;
    readonly prodDot: string;
    readonly prefixProdDot: string;
    readonly tempProdPr: string;
    readonly title: string;
    readonly titleDot: string;
    readonly dateDot: string;
    readonly editionDot: string;
    readonly pagesDot: string;
    readonly institutionDot: string;
    readonly tempCPY: string;
    readonly tempCPD: string;
};

/**
 * The variables of a source's entry, from its fields and people, and its author, which is "—" for the same people as
 * the entry before
 */
const variablesOf = (source: WordSource, author: string): Variables => {
    const field = (name: Field): string => fieldOf(source, name);
    const count = (role: Role): number => countOf(source, role);
    const editor = persons(source.names.Editor);
    const translator = persons(source.names.Translator);
    const producerName = persons(source.names.ProducerName);
    const productionCompany = field("ProductionCompany");
    const volume = field("Volume");
    const prodDot = producerName ? appendDot(producerName) : appendDot(productionCompany);
    return {
        author,
        authorDot: appendDot(author),
        sectionAuthorDot: appendDot(personsAuthor(source.names.Author)),
        bookAuthorDot: appendDot(personsAuthor(source.names.BookAuthor)),
        performerLF: personsAuthor(source.names.Performer),
        performerLFDot: appendDot(personsAuthor(source.names.Performer)),
        conductorLFDot: appendDot(personsAuthor(source.names.Conductor)),
        composerLFDot: appendDot(personsAuthor(source.names.Composer)),
        artistDot: appendDot(personsAuthor(source.names.Artist)),
        intervieweeLFDot: appendDot(personsAuthor(source.names.Interviewee)),
        inventorLFDot: appendDot(personsAuthor(source.names.Inventor)),
        interviewer: persons(source.names.Interviewer),
        interviewerDot: appendDot(persons(source.names.Interviewer)),
        writer: persons(source.names.Writer),
        composer: persons(source.names.Composer),
        editor,
        translator,
        suffixEditorLFDot: suffixLF(
            personsAuthor(source.names.Editor),
            count("Editor"),
            Strings.EditorShortUnCap,
            Strings.EditorsShortUnCap,
        ),
        suffixTranslatorLFDot: suffixLF(
            personsAuthor(source.names.Translator),
            count("Translator"),
            Strings.TranslatorShortUnCap,
            Strings.TranslatorsShortUnCap,
        ),
        suffixCompilerLFDot: suffixLF(
            personsAuthor(source.names.Compiler),
            count("Compiler"),
            Strings.CompilerShortUnCap,
            Strings.CompilersShortUnCap,
        ),
        // The style writes "Ed." and "Perf." before several editors or performers too
        prefixEditorDot: prefixDot(editor, count("Editor"), Strings.EditorShortCap, Strings.EditorShortCap),
        prefixTranslatorDot: prefixDot(translator, count("Translator"), Strings.TranslatorShortCap, Strings.TranslatorsShortCap),
        prefixDirectorDot: prefixDot(
            persons(source.names.Director),
            count("Director"),
            Strings.DirectorShortCap,
            Strings.DirectorsShortCap,
        ),
        prefixPerformerDot: prefixDot(
            persons(source.names.Performer),
            count("Performer"),
            Strings.PerformerShortCap,
            Strings.PerformerShortCap,
        ),
        prefixConductorDot: prefixDot(
            persons(source.names.Conductor),
            count("Conductor"),
            Strings.ConductorShortUnCap,
            Strings.ConductorsShortUnCap,
        ),
        prefixCompilerDot: prefixDot(
            persons(source.names.Compiler),
            count("Compiler"),
            Strings.CompilerShortCap,
            Strings.CompilersShortCap,
        ),
        prefixVersionDot: field("Version") ? Strings.VersionShortCap + SPACE + appendDot(field("Version")) : "",
        prefixVolumeDot: volume
            ? appendDot(textOf(stringFormat(volumeFormatOf(volume, Strings.VolumeShortCap, Strings.VolumesShortCap), volume)))
            : "",
        noVolumesSufDot: field("NumberVolumes")
            ? appendDot(textOf(stringFormat(Strings.VolumesAfterShortUnCap, field("NumberVolumes"))))
            : "",
        prefixCaseNoDot: field("CaseNumber") ? textOf(stringFormatDot(Strings.NumberShortCap, field("CaseNumber"))) : "",
        prodDot,
        prefixProdDot:
            producerName || productionCompany
                ? wordFor(count("ProducerName"), Strings.ProducerShortCap + SPACE, Strings.ProducersShortCap + SPACE) + prodDot
                : "",
        tempProdPr: producerName ? Strings.ProducerShortCap + SPACE + appendDot(producerName) : "",
        title: field("Title"),
        titleDot: appendDot(field("Title")),
        dateDot: appendDot(dateOf(source)),
        editionDot: appendDot(field("Edition")),
        pagesDot: appendDot(field("Pages")),
        institutionDot: appendDot(field("Institution")),
        tempCPY: templateA(field("City"), field("Publisher"), yearOf(source)),
        tempCPD: templateA(field("City"), field("Publisher"), dateOf(source)),
    };
};

/** A book's volume, or how many volumes it has, and how many after its publisher when it has both */
const volumesOf = (v: Variables): readonly [Part, Part] => [
    ["volume", v.prefixVolumeDot || v.noVolumesSufDot],
    ["volumes", v.prefixVolumeDot ? v.noVolumesSufDot : ""],
];

/** A book's entry, named by its editors, or else its translators, when it has no author */
const book = (v: Variables): FormattedText => {
    const [volume, volumes] = volumesOf(v);
    const place: Part = ["place", v.tempCPY];
    if (v.editor && !v.author) {
        return spaced(
            ["editor", v.suffixEditorLFDot],
            ["title", italicDot(v.title)],
            ["translator", v.prefixTranslatorDot],
            ["edition", v.editionDot],
            volume,
            place,
            volumes,
        );
    }
    return v.translator && !v.author
        ? spaced(["translator", v.suffixTranslatorLFDot], ["title", italicDot(v.title)], ["edition", v.editionDot], volume, place, volumes)
        : spaced(
              ["author", v.authorDot],
              ["title", italicDot(v.title)],
              ["editor", v.prefixEditorDot],
              ["translator", v.prefixTranslatorDot],
              ["edition", v.editionDot],
              volume,
              place,
              volumes,
          );
};

/** A book section's entry, named by its own authors even when the entry before has them */
const bookSection = (v: Variables, source: WordSource): FormattedText => {
    const [volume, volumes] = volumesOf(v);
    return spaced(
        ["author", v.sectionAuthorDot],
        ["title", quotedDot(v.title)],
        ["bookAuthor", v.bookAuthorDot],
        ["bookTitle", italicDot(fieldOf(source, "BookTitle"))],
        ["editor", v.prefixEditorDot],
        ["translator", v.prefixTranslatorDot],
        ["edition", v.editionDot],
        volume,
        ["place", v.tempCPY],
        volumes,
        ["pages", v.pagesDot],
    );
};

/** A conference paper's entry, named by its editors when it has no author */
const conferenceProceedings = (v: Variables, source: WordSource): FormattedText => {
    const title: Part = ["title", quotedDot(v.title)];
    const conference: Part = ["conference", italicDot(fieldOf(source, "ConferenceName"))];
    return v.editor && !v.author
        ? spaced(["editor", v.suffixEditorLFDot], title, conference, ["place", v.tempCPY], ["pages", v.pagesDot])
        : spaced(["author", v.authorDot], title, conference, ["editor", v.prefixEditorDot], ["place", v.tempCPY], ["pages", v.pagesDot]);
};

/** A report's entry: one with a city has its title in italics, and its publisher */
const report = (v: Variables, source: WordSource): FormattedText => {
    const type: Part = ["type", appendDot(fieldOf(source, "ThesisType"))];
    return fieldOf(source, "City")
        ? spaced(["author", v.authorDot], ["title", italicDot(v.title)], type, ["institution", v.institutionDot], ["place", v.tempCPY])
        : spaced(["author", v.authorDot], ["title", quotedDot(v.title)], type, [
              "institution",
              templateC(fieldOf(source, "Institution"), yearOf(source)),
          ]);
};

/** A sound recording's entry, named by its performers, or else its conductors, or else its composers */
const soundRecording = (v: Variables, source: WordSource): FormattedText => {
    const title: Part = ["title", quotedDot(v.title)];
    const album: Part = ["album", italicDot(fieldOf(source, "AlbumTitle"))];
    const composer: Part = ["composer", v.composer ? stringFormatDot(Strings.ByCap, v.composer) : ""];
    const place: Part = ["place", templateA(fieldOf(source, "City"), fieldOf(source, "ProductionCompany"), yearOf(source))];
    if (v.performerLF) {
        return spaced(
            ["performer", v.performerLFDot],
            title,
            album,
            ["conductor", v.prefixConductorDot],
            composer,
            ["producer", v.tempProdPr],
            place,
        );
    }
    // Named by its composers, it has no space between its album and its producer when it has neither composers nor a
    // title: the style doesn't look for the album there
    return v.conductorLFDot
        ? spaced(["conductor", v.conductorLFDot], title, album, composer, ["producer", v.tempProdPr], place)
        : spaced(["composer", v.composerLFDot], title, album, ["producer", v.tempProdPr, ["composer", "title"]], place);
};

/** A performance's or a film's title, writers, directors and performers */
const titleAndPeople = (v: Variables): readonly Part[] => [
    ["title", italicDot(v.title)],
    ["writer", v.writer ? stringFormatDot(Strings.ByCap, v.writer) : ""],
    ["director", v.prefixDirectorDot],
    ["performer", v.prefixPerformerDot],
];

/** A work of art's entry, with the publication it is in when it has one */
const art = (v: Variables, source: WordSource): FormattedText => {
    const artist: Part = ["artist", normalizeSpace(v.artistDot)];
    const title: Part = ["title", italicDot(v.title)];
    const publication = fieldOf(source, "PublicationTitle");
    return publication
        ? spaced(
              artist,
              title,
              ["institution", v.institutionDot],
              ["publication", italicDot(publication)],
              ["place", v.tempCPY],
              ["pages", v.pagesDot],
          )
        : spaced(artist, title, ["institution", templateC(fieldOf(source, "Institution"), fieldOf(source, "City"))], ["pages", v.pagesDot]);
};

/** An electronic source's entry, named by its authors, or else its editors, its compilers or its translators */
const electronicSource = (v: Variables, source: WordSource): FormattedText => {
    const publication = fieldOf(source, "PublicationTitle");
    // The style looks for the parts up to the volume before the people and the producers after them
    const before = ["author", "title", "publication", "edition", "volume"];
    return spaced(
        ["author", v.authorDot || v.suffixEditorLFDot || v.suffixCompilerLFDot || v.suffixTranslatorLFDot],
        ["title", publication ? quotedDot(v.title) : italicDot(v.title)],
        ["publication", italicDot(publication)],
        ["edition", v.editionDot],
        ["volume", v.prefixVolumeDot],
        ["editor", v.authorDot ? v.prefixEditorDot : "", before],
        ["compiler", v.authorDot || v.suffixEditorLFDot ? v.prefixCompilerDot : "", before],
        ["translator", v.authorDot || v.suffixEditorLFDot || v.suffixCompilerLFDot ? v.prefixTranslatorDot : "", before],
        ["producer", v.prefixProdDot, before],
        ["place", v.tempCPD, [...before, "producer"]],
    );
};

/** An interview's title, or "Interview" without one, and its interviewers with it when it is broadcast */
const interviewTitle = (v: Variables, source: WordSource): TextLike => {
    const broadcast = fieldOf(source, "BroadcastTitle");
    if (!fieldOf(source, "Broadcaster")) {
        return !v.title ? Strings.InterviewCap + General.Dot : broadcast ? quotedDot(v.title) : italic(v.title);
    }
    if (!v.title) {
        return v.interviewer ? stringFormatDot(Strings.InterviewWithCap, v.interviewer) : Strings.InterviewCap + General.Dot;
    }
    if (!v.interviewer) {
        return broadcast ? General.OpenQuote + v.title + General.CloseQuote : italicDot(v.title);
    }
    // The style's formats write the text of what they are given, so the title in italics is written without them
    return stringFormatDot(
        Strings.WithUnCap,
        broadcast ? General.OpenQuote + v.title + General.CloseQuote : appendDot(v.title),
        v.interviewerDot,
    );
};

/** An interview's entry, with a space before each part after its title, whatever is before it */
const interview = (v: Variables, source: WordSource): FormattedText => {
    const after = (text: TextLike): TextLike => (textOf(text) ? join(SPACE, text) : "");
    return join(
        v.intervieweeLFDot,
        v.intervieweeLFDot ? SPACE : "",
        interviewTitle(v, source),
        after(italic(appendDot(fieldOf(source, "BroadcastTitle")))),
        ...(fieldOf(source, "Broadcaster")
            ? [
                  after(appendDot(fieldOf(source, "Broadcaster"))),
                  after(templateC(fieldOf(source, "Station"), fieldOf(source, "City"))),
                  after(v.dateDot),
              ]
            : [after(v.interviewerDot), after(v.prefixEditorDot), after(v.prefixTranslatorDot), after(v.tempCPD), after(v.pagesDot)]),
    );
};

/** Each type of source's entry, before its medium, the date it was read and its address (the `source` variable) */
const ENTRIES: Readonly<Record<WordSourceType, (v: Variables, source: WordSource) => FormattedText>> = {
    Book: book,
    BookSection: bookSection,
    JournalArticle: (v, source) =>
        spaced(
            ["author", v.authorDot],
            ["title", quotedDot(v.title)],
            ["journal", italic(fieldOf(source, "JournalName"))],
            ["volume", templateVIYP(source)],
        ),
    ConferenceProceedings: conferenceProceedings,
    Report: report,
    SoundRecording: soundRecording,
    Performance: (v, source) =>
        spaced(...titleAndPeople(v), ["place", templateC(fieldOf(source, "Theater"), fieldOf(source, "City"))], ["date", v.dateDot]),
    Art: art,
    DocumentFromInternetSite: (v, source) =>
        spaced(
            ["author", v.authorDot],
            ["title", quotedDot(v.title)],
            ["version", v.prefixVersionDot],
            ["date", v.dateDot],
            ["site", italic(appendDot(fieldOf(source, "InternetSiteTitle")))],
            ["editor", v.prefixEditorDot],
            ["producer", v.prodDot],
        ),
    InternetSite: (v) =>
        spaced(
            ["author", v.authorDot],
            ["title", italicDot(v.title)],
            ["editor", v.prefixEditorDot],
            ["version", v.prefixVersionDot],
            ["date", v.dateDot],
            ["producer", v.prodDot],
        ),
    Patent: (v, source) => {
        const patentNumber = fieldOf(source, "PatentNumber");
        return spaced(
            ["inventor", v.inventorLFDot],
            ["title", v.titleDot],
            ["editor", v.prefixEditorDot],
            ["translator", v.prefixTranslatorDot],
            [
                "country",
                templateB(fieldOf(source, "CountryRegion"), patentNumber ? textOf(stringFormat(Strings.PatentCap, patentNumber)) : ""),
            ],
            ["date", v.dateDot],
        );
    },
    Case: (v, source) =>
        spaced(
            ["title", v.titleDot],
            ["number", v.prefixCaseNoDot],
            ["court", appendDot(fieldOf(source, "Court"))],
            ["place", templateB(fieldOf(source, "City"), dateOf(source))],
        ),
    Misc: (v, source) =>
        spaced(
            ["author", v.authorDot],
            ["title", quotedDot(v.title)],
            ["publication", italicDot(fieldOf(source, "PublicationTitle"))],
            ["volume", v.prefixVolumeDot],
            ["issue", appendDot(fieldOf(source, "Issue"))],
            ["editor", v.prefixEditorDot],
            ["translator", v.prefixTranslatorDot],
            ["compiler", v.prefixCompilerDot],
            ["place", v.tempCPD],
            ["pages", v.pagesDot],
        ),
    ElectronicSource: electronicSource,
    ArticleInAPeriodical: (v, source) => {
        const edition = fieldOf(source, "Edition");
        return spaced(
            ["author", v.authorDot],
            ["title", quotedDot(v.title)],
            ["periodical", italic(fieldOf(source, "PeriodicalTitle"))],
            // templateDEP
            [
                "date",
                templateE(
                    dateOf(source),
                    edition ? textOf(stringFormat(Strings.EditionShortUnCap, edition)) : "",
                    fieldOf(source, "Pages"),
                ),
            ],
        );
    },
    Film: (v, source) =>
        spaced(
            ...titleAndPeople(v),
            ["producer", v.prefixProdDot],
            ["distributor", templateC(fieldOf(source, "Distributor"), yearOf(source))],
        ),
    Interview: interview,
};

/** The title a type of source has in a citation when it has neither a short title nor a title */
const CITATION_TITLES: Readonly<Partial<Record<WordSourceType, Field>>> = {
    BookSection: "BookTitle",
    ArticleInAPeriodical: "PeriodicalTitle",
    InternetSite: "InternetSiteTitle",
    DocumentFromInternetSite: "InternetSiteTitle",
    ElectronicSource: "PublicationTitle",
    Art: "PublicationTitle",
    Misc: "PublicationTitle",
    SoundRecording: "AlbumTitle",
    Interview: "BroadcastTitle",
};

/** A source's title in a citation: its short title, or its title, or for most types another title it has (`populateMain`) */
const citationTitleOf = (source: WordSource): string => {
    const other = CITATION_TITLES[source.type];
    return fieldOf(source, "ShortTitle") || fieldOf(source, "Title") || (other ? fieldOf(source, other) : "");
};

/**
 * The people a source is named by in a citation: the last names of the first three, with their initials when another
 * source's first author has the same last name, or the organization
 */
const citationAuthorsOf = (names: WordNames | undefined, nonUniqueLastName: boolean): string => {
    if (!names) {
        return "";
    }
    if ("corporate" in names) {
        return names.corporate;
    }
    const count = names.people.length;
    return names.people
        .map((person, index) => {
            const position = index + 1;
            const name = position > 3 ? "" : formatName(person, nonUniqueLastName ? MLA.CitationLong : MLA.CitationShort);
            const separator =
                (count - 1 === position && (count === 2 || count === 3)) || (count > 3 && position === 2)
                    ? SPACE + Strings.AndUnCap + SPACE
                    : count > position && position < 3
                      ? General.AuthorsSeparator
                      : "";
            return name + separator;
        })
        .join("");
};

/**
 * A source of a citation, such as "(Baker 50)": its authors, its title when they don't tell it apart from another
 * source or it has none, and the volume and pages cited
 */
const citation = (cited: CitedSource): FormattedText => {
    const { source, volume, pages } = cited;
    const title0 = citationTitleOf(source);
    const author0 = citationAuthorsOf(mainContributorsOf(source), cited.nonUniqueLastName);
    const author = cited.hideAuthor ? "" : author0;
    const title = cited.hideTitle ? "" : title0;
    const displayTitle = !author || cited.repeatedAuthor ? title : "";
    const volVolume = volume
        ? textOf(stringFormat(volumeFormatOf(volume, Strings.VolumeShortUnCap, Strings.VolumesShortUnCap), volume))
        : "";
    return join(
        cited.first ? General.OpenBracket : "",
        cited.prefix ?? "",
        author,
        displayTitle ? (author ? LIST : "") + displayTitle : "",
        !author0 && !title0 ? source.tag : "",
        volume || pages
            ? (author || displayTitle ? SPACE : "") + (volume && pages ? volume + General.Enum + pages : volVolume || pages)
            : "",
        cited.suffix ?? "",
        cited.last ? General.CloseBracket : General.GroupSeparator,
    );
};

/** What the bibliography is sorted by: the source's authors and its title, or its title first for some types (`b:SortingString`) */
const sortingStringOf = (source: WordSource): string => {
    const author = personsAuthor(mainContributorsOf(source));
    const title = fieldOf(source, "Title");
    const titleFirst = source.type === "Performance" || source.type === "Case" || source.type === "Film";
    return (titleFirst && title ? SPACE + title : "") + (author ? SPACE + author : "") + (!titleFirst && title ? SPACE + title : "");
};

/**
 * A bibliography of the sources, sorted, each entry with its medium, the date it was read and its address after it, and
 * "—" for its author when the entry before is named by the same people
 */
const bibliography = (sources: readonly WordSource[]): FormattedBibliography => {
    const sorted = sortByKey(sources, sortingStringOf);
    // The people each source is named by, which the style keeps in its `dups` variable
    const mains = sorted.map((source) => personsAuthor(mainContributorsOf(source)));
    return {
        hangingIndent: true,
        paragraphs: sorted.map((source, index) => {
            const author =
                index > 0 && mains[index] !== "" && mains[index] === mains[index - 1] ? MLA.SameAuthor : personsAuthor(source.names.Author);
            const entry = ENTRIES[source.type](variablesOf(source, author), source);
            const after = templateMDaU(source);
            // Word's XSLT writes a line break after the copy of an entry, which Word reads as a space after one that ends
            // with italics, at the end of its paragraph
            const space = !after && entry[entry.length - 1]?.italics ? SPACE : "";
            return join(entry, textOf(entry) && after ? SPACE : "", after, space);
        }),
    };
};

/** MLA, as Word writes it with MLASeventhEditionOfficeOnline.xsl */
export const mla: StyleDefinition = {
    name: "MLA",
    file: "MLASeventhEditionOfficeOnline.xsl",
    version: "7",
    citation,
    bibliography,
};
