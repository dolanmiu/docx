import type { DocumentBibliography } from 'docx';
import { FileChild } from 'docx';
import { IContext } from 'docx';
import { IXmlableObject } from 'docx';
import { Run } from 'docx';
import { XmlComponent } from 'docx';

/**
 * A bibliography: the list of the document's sources, in the style of its citations, as Word's References >
 * Bibliography inserts it. It lists every source of the document's bibliography, cited or not, and Word writes it again
 * when it updates the document's fields, or when the style is changed.
 *
 * The document needs its sources: give it `bibliography: createBibliography({ sources })`.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // As Word's built-in "References" bibliography: a heading, then the list
 * new Bibliography({ title: "References" });
 * ```
 */
export declare class Bibliography extends FileChild {
    private readonly options;
    constructor(options?: BibliographyOptions);
    /**
     * With a title, written as Word's built-in bibliographies are, in a content control of Word's Bibliographies gallery,
     * with the title as a Heading 1 before the bibliography's own content control. Without one, it is that content
     * control alone
     */
    prepForXml(context: IContext): IXmlableObject | undefined;
}

/**
 * Options for a {@link Bibliography}.
 *
 * @publicApi
 */
export declare type BibliographyOptions = {
    /**
     * A heading above the list, such as "References" or "Works Cited", in the Heading 1 style, as Word's built-in
     * bibliographies have. Without one, the bibliography is the list alone, as Word's Insert Bibliography inserts it
     */
    readonly title?: string;
};

/**
 * A citation of one or more of the document's sources, by their tags, such as "(Baker, 2010)" in APA, as Word's
 * References > Insert Citation inserts it. It is written in the style of the document's bibliography, and Word writes
 * it again when it updates the document's fields, or when the style is changed.
 *
 * The document needs its sources: give it `bibliography: createBibliography({ sources })`.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new Paragraph({ children: [new TextRun("Pizza is older than you think "), new Citation("Bak10")] });
 *
 * // Pages, and text before the citation
 * new Citation({ source: "Bak10", pages: "50", prefix: "see " });
 *
 * // Two sources, as one citation: "(Baker, 2010; Evans, 2019, p. 20)"
 * new Citation(["Bak10", { source: "Eva19", pages: "20" }]);
 * ```
 */
export declare class Citation extends Run {
    private readonly cited;
    /**
     * @param cited - The source cited, by its tag, or with how it is cited, or several sources, cited together
     * @throws If no source is cited
     */
    constructor(cited: string | CitedSourceOptions | readonly (string | CitedSourceOptions)[]);
    /** Written as Word's citation content control, in place of a run */
    get writtenAs(): readonly XmlComponent[];
}

/**
 * The styles of citation Word has, as Word lists them in References > Style. Each is written as Word writes it, and its
 * citation of a book by Anna Baker from 2010 is in its description.
 *
 * @publicApi
 */
export declare const CitationStyle: {
    /** APA, sixth edition: "(Baker, 2010)" */
    readonly APA: "apa";
    /** Chicago, sixteenth edition, author-date: "(Baker 2010)" */
    readonly CHICAGO: "chicago";
    /** GB7714, China's national standard: "(Baker, 2010)" */
    readonly GB7714: "gb7714";
    /** GOST, Russia's national standard, with the bibliography sorted by name: "(Baker, 2010)" */
    readonly GOST_NAME_SORT: "gostNameSort";
    /** GOST, Russia's national standard, with the bibliography sorted by title: "(Baker, 2010)" */
    readonly GOST_TITLE_SORT: "gostTitleSort";
    /** Harvard, as Anglia Ruskin University writes it: "(Baker, 2010)" */
    readonly HARVARD_ANGLIA: "harvardAnglia";
    /** IEEE, with the sources numbered in the order they're cited: "[1]" */
    readonly IEEE: "ieee";
    /** ISO 690, with the first element and the date: "(Baker, 2010)" */
    readonly ISO_690_FIRST_ELEMENT_AND_DATE: "iso690FirstElementAndDate";
    /** ISO 690, with the sources numbered in the order they're cited: "(1)" */
    readonly ISO_690_NUMERICAL_REFERENCE: "iso690NumericalReference";
    /** MLA, seventh edition: "(Baker)" */
    readonly MLA: "mla";
    /** SIST02, Japan's standard, in full-width punctuation: "（Baker，2010）" */
    readonly SIST02: "sist02";
    /** Turabian, sixth edition: "(Baker 2010)" */
    readonly TURABIAN: "turabian";
};

/**
 * A source a citation cites, and how: the pages or volume it cites, text before or after it, and what it leaves out.
 *
 * @publicApi
 */
export declare type CitedSourceOptions = {
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

/**
 * A document's bibliography, for the document's `bibliography`: the sources its citations and bibliographies refer to,
 * and the style they're written in, as Word's References > Manage Sources and Style keep them.
 *
 * Every source is in the document's bibliographies, cited or not, as Word's are, and Word lists every source in its
 * Source Manager.
 *
 * @publicApi
 *
 * @throws If two sources have the same tag, a source has none, a source's type isn't one of {@link SourceType}'s, or the
 * style isn't one of {@link CitationStyle}'s
 *
 * @example
 * ```typescript
 * const doc = new Document({
 *   bibliography: createBibliography({
 *     style: CitationStyle.APA,
 *     sources: [
 *       {
 *         tag: "Bak10",
 *         type: SourceType.BOOK,
 *         authors: [{ lastName: "Baker", firstName: "Anna" }],
 *         title: "The Art of Pizza",
 *         year: 2010,
 *         city: "Naples",
 *         publisher: "Oven Press",
 *       },
 *     ],
 *   }),
 *   sections: [{ children: [new Paragraph({ children: [new Citation("Bak10")] }), new Bibliography({ title: "References" })] }],
 * });
 * ```
 */
export declare const createBibliography: ({ style, sources }: DocumentBibliographyOptions) => DocumentBibliography;

/**
 * Options for {@link createBibliography}.
 *
 * @publicApi
 */
export declare type DocumentBibliographyOptions = {
    /** The style the citations and bibliographies are written in, such as APA, Word's own default, which it is if not given */
    readonly style?: (typeof CitationStyle)[keyof typeof CitationStyle];
    /** The sources, such as books and websites, which Word lists in its Source Manager */
    readonly sources: readonly Source[];
};

/**
 * A person who made a source, such as one of its authors, by their names as Word's Edit Name dialog has them.
 *
 * @publicApi
 */
export declare type Person = {
    /** The person's last name, such as "Dickens". Initials are written from the first letter of each part of a name */
    readonly lastName: string;
    /** The person's first name, such as "Charles" */
    readonly firstName?: string;
    /** The person's middle name or names, such as "John" */
    readonly middleName?: string;
};

/**
 * A source, such as a book or a website, that a document's citations and bibliographies refer to. Its `tag` is how a
 * `Citation` names it.
 *
 * Every field is text as Word keeps it, and each style of citation writes it as it's given: a month such as "March",
 * pages such as "50-62", and an edition such as "2nd". Which fields a style writes depends on the type of the source, and
 * each field's description says which types of source Word asks for it with.
 *
 * @publicApi
 */
export declare type Source = {
    /**
     * The name that citations refer to the source by, which Word calls its tag name, such as "Dic06". It is unique among
     * the document's sources
     */
    readonly tag: string;
    /** The kind of source, such as a book or a website */
    readonly type: (typeof SourceType)[keyof typeof SourceType];
    /** The authors, in order. A book or an article written by an organization has a `corporateAuthor` instead */
    readonly authors?: readonly Person[];
    /** An organization that wrote the source, such as "World Health Organization", in place of its `authors` */
    readonly corporateAuthor?: string;
    /** The editors */
    readonly editors?: readonly Person[];
    /** The translators */
    readonly translators?: readonly Person[];
    /** The authors of the book that a book section is in */
    readonly bookAuthors?: readonly Person[];
    /** The compilers, of an interview or a miscellaneous source */
    readonly compilers?: readonly Person[];
    /** The artists, of a work of art or a sound recording */
    readonly artists?: readonly Person[];
    /** The composers, of a sound recording */
    readonly composers?: readonly Person[];
    /** The conductors, of a sound recording */
    readonly conductors?: readonly Person[];
    /** The performers, of a sound recording, a performance or a film */
    readonly performers?: readonly Person[];
    /** A band or another group that performed a sound recording, in place of its `performers` */
    readonly corporatePerformer?: string;
    /** The writers, of a performance or a film */
    readonly writers?: readonly Person[];
    /** The directors, of a performance or a film */
    readonly directors?: readonly Person[];
    /** The producers, of a website, an electronic source, a sound recording, a performance or a film */
    readonly producers?: readonly Person[];
    /** The people interviewed, in an interview */
    readonly interviewees?: readonly Person[];
    /** The interviewers, of an interview */
    readonly interviewers?: readonly Person[];
    /** The inventors, of a patent */
    readonly inventors?: readonly Person[];
    /** The counsel, in a court case */
    readonly counsel?: readonly Person[];
    /** The source's title, or the name of a web page, such as "How to Write Bibliographies" */
    readonly title?: string;
    /** A shorter title, which some styles cite the source by, such as "Bibliographies" */
    readonly shortTitle?: string;
    /** The title of the book that a book section is in */
    readonly bookTitle?: string;
    /** The name of the journal that a journal article is in */
    readonly journalName?: string;
    /** The title of the magazine or newspaper that an article in a periodical is in */
    readonly periodicalTitle?: string;
    /** The name of the conference's publication, for a paper in conference proceedings */
    readonly conferenceName?: string;
    /** The name of the website a page or a document is on, such as "Pizza School" */
    readonly websiteName?: string;
    /** The title of the publication that an electronic source, a work of art or a miscellaneous source is in */
    readonly publicationTitle?: string;
    /** The title of the album that a sound recording is on */
    readonly albumTitle?: string;
    /** The title of the broadcast that an interview was on */
    readonly broadcastTitle?: string;
    /** The year the source was published, such as "2006" */
    readonly year?: string | number;
    /** The month the source was published, such as "March" */
    readonly month?: string;
    /** The day of the month the source was published */
    readonly day?: string | number;
    /** The year a website or a document on one was read */
    readonly yearAccessed?: string | number;
    /** The month a website or a document on one was read, such as "March" */
    readonly monthAccessed?: string;
    /** The day of the month a website or a document on one was read */
    readonly dayAccessed?: string | number;
    /** The city it was published in, or for a court case, where the case was published */
    readonly city?: string;
    /** The state or province it was published in, such as "Illinois" */
    readonly stateOrProvince?: string;
    /** The country or region it was published in, or for a patent, the country it was granted in */
    readonly countryOrRegion?: string;
    /** The publisher, such as "Adventure Works Press" */
    readonly publisher?: string;
    /** The company that produced a website, an electronic source, a sound recording, a performance or a film */
    readonly productionCompany?: string;
    /** The company that distributed a film */
    readonly distributor?: string;
    /** The institution a report or a work of art is from */
    readonly institution?: string;
    /** The department of the institution a report is from */
    readonly department?: string;
    /** The kind of report, such as "Technical report" or "PhD thesis" */
    readonly reportType?: string;
    /** The edition, such as "2nd" */
    readonly edition?: string;
    /** The volume, such as "III" */
    readonly volume?: string | number;
    /** How many volumes there are, such as "4" */
    readonly numberOfVolumes?: string | number;
    /** The issue of a journal or a periodical */
    readonly issue?: string | number;
    /** The pages, such as "50-62" */
    readonly pages?: string;
    /** The medium, such as "CD-ROM", "DVD" or "Manuscript" */
    readonly medium?: string;
    /** The version of a website or a document on one */
    readonly version?: string;
    /** A standard number, such as an ISBN or an ISSN */
    readonly standardNumber?: string;
    /** The address of a website or a document on one */
    readonly url?: string;
    /** The number a sound recording was released under */
    readonly recordingNumber?: string;
    /** The theater a performance was at */
    readonly theater?: string;
    /** The broadcaster an interview was on */
    readonly broadcaster?: string;
    /** The station an interview was broadcast on */
    readonly station?: string;
    /** The kind of patent, such as "Utility patent" */
    readonly patentType?: string;
    /** The patent's number */
    readonly patentNumber?: string;
    /** The number of a court case */
    readonly caseNumber?: string;
    /** The abbreviated number of a court case, such as "567 U.S. 1" */
    readonly abbreviatedCaseNumber?: string;
    /** The court that heard a case */
    readonly court?: string;
    /** The reporter a court case is published in, such as "U.S. Reports" */
    readonly reporter?: string;
    /** Comments, which some styles write at the end of the source's entry */
    readonly comments?: string;
};

/**
 * The kinds of source Word's Create Source dialog has. Each has the fields Word asks for when it's chosen, though any
 * source can have any field. Word's own name for each, as it writes it in the document, is in brackets.
 *
 * @publicApi
 */
export declare const SourceType: {
    /** A book (`Book`) */
    readonly BOOK: "book";
    /** A chapter or other part of a book, with its own title and authors (`BookSection`) */
    readonly BOOK_SECTION: "bookSection";
    /** An article in a journal (`JournalArticle`) */
    readonly JOURNAL_ARTICLE: "journalArticle";
    /** An article in a magazine or a newspaper (`ArticleInAPeriodical`) */
    readonly ARTICLE_IN_A_PERIODICAL: "articleInAPeriodical";
    /** A paper in the proceedings of a conference (`ConferenceProceedings`) */
    readonly CONFERENCE_PROCEEDINGS: "conferenceProceedings";
    /** A report or a thesis (`Report`) */
    readonly REPORT: "report";
    /** A page of a website (`InternetSite`) */
    readonly WEBSITE: "website";
    /** A document on a website, such as a PDF (`DocumentFromInternetSite`) */
    readonly DOCUMENT_FROM_WEBSITE: "documentFromWebsite";
    /** A source on a medium other than paper, such as a CD-ROM or a database (`ElectronicSource`) */
    readonly ELECTRONIC_SOURCE: "electronicSource";
    /** A work of art (`Art`) */
    readonly ART: "art";
    /** A recording of music or of speech (`SoundRecording`) */
    readonly SOUND_RECORDING: "soundRecording";
    /** A play, a concert or another performance (`Performance`) */
    readonly PERFORMANCE: "performance";
    /** A film (`Film`) */
    readonly FILM: "film";
    /** An interview (`Interview`) */
    readonly INTERVIEW: "interview";
    /** A patent (`Patent`) */
    readonly PATENT: "patent";
    /** A court case (`Case`) */
    readonly CASE: "case";
    /** Any other source (`Misc`) */
    readonly MISCELLANEOUS: "miscellaneous";
};

export { }
