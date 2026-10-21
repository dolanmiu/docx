/**
 * The sources that a document's citations and bibliographies refer to, as Word's Create Source dialog describes them.
 *
 * Reference: ooxml-schemas/ISO-IEC29500-4_2016/shared-bibliography.xsd
 *
 * @module
 */

/**
 * The kinds of source Word's Create Source dialog has. Each has the fields Word asks for when it's chosen, though any
 * source can have any field. Word's own name for each, as it writes it in the document, is in brackets.
 *
 * @publicApi
 */
export const SourceType = {
    /** A book (`Book`) */
    BOOK: "book",
    /** A chapter or other part of a book, with its own title and authors (`BookSection`) */
    BOOK_SECTION: "bookSection",
    /** An article in a journal (`JournalArticle`) */
    JOURNAL_ARTICLE: "journalArticle",
    /** An article in a magazine or a newspaper (`ArticleInAPeriodical`) */
    ARTICLE_IN_A_PERIODICAL: "articleInAPeriodical",
    /** A paper in the proceedings of a conference (`ConferenceProceedings`) */
    CONFERENCE_PROCEEDINGS: "conferenceProceedings",
    /** A report or a thesis (`Report`) */
    REPORT: "report",
    /** A page of a website (`InternetSite`) */
    WEBSITE: "website",
    /** A document on a website, such as a PDF (`DocumentFromInternetSite`) */
    DOCUMENT_FROM_WEBSITE: "documentFromWebsite",
    /** A source on a medium other than paper, such as a CD-ROM or a database (`ElectronicSource`) */
    ELECTRONIC_SOURCE: "electronicSource",
    /** A work of art (`Art`) */
    ART: "art",
    /** A recording of music or of speech (`SoundRecording`) */
    SOUND_RECORDING: "soundRecording",
    /** A play, a concert or another performance (`Performance`) */
    PERFORMANCE: "performance",
    /** A film (`Film`) */
    FILM: "film",
    /** An interview (`Interview`) */
    INTERVIEW: "interview",
    /** A patent (`Patent`) */
    PATENT: "patent",
    /** A court case (`Case`) */
    CASE: "case",
    /** Any other source (`Misc`) */
    MISCELLANEOUS: "miscellaneous",
} as const;

/**
 * A person who made a source, such as one of its authors, by their names as Word's Edit Name dialog has them.
 *
 * @publicApi
 */
export type Person = {
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
export type Source = {
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
