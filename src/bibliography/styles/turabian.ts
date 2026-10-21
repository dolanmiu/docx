/**
 * Turabian, the style of Kate Turabian's manual for writers of papers (6th edition), written from Word's own
 * (TURABIAN.XSL).
 *
 * Its citations are Chicago's, and its bibliography is sorted as Chicago's is, but its entries end with where and when
 * the source was published, rather than having the year after the authors.
 *
 * Each function follows the XSL template its description names, including where that doesn't do what it looks like it
 * should, so citations and bibliographies are written as Word writes them when it updates a document's fields.
 *
 * @module
 */
// The names of the XSL's templates and variables, which the functions and variables here keep, such as templateCPY for
// the city, the publisher and the year, and its spellings of "sufix" and "Seperator"
// cspell:words Turabian TURABIAN CPDMY DACURL RICPY VIYP sufix Sufix Seperator Forno
import {
    bibliographyOf,
    citation,
    countOf,
    formatIf,
    getYear,
    normalizeSpace,
    prefixed,
    printSpaceAndList,
    quoted,
    spaceIf,
    suffixed,
    templateA,
    templateANoDot,
    templateC,
    templateCP,
    templateCityStateProvince,
    templateE,
    volumeFormatOf,
    when,
} from "./chicago-family";
import { type FormattedRun, type FormattedText, join, textOf } from "./formatted-text";
import { LOCALS } from "./locals";
import type { FormattedBibliography, StyleDefinition } from "./style";
import { applyItalic, xslTemplates } from "./xsl";
import { type Field, type Role, type WordNames, type WordSource, type WordSourceType, fieldOf } from "../word-source";

const { General, Strings, Chicago, APA } = LOCALS;
const xsl = xslTemplates(General);

/**
 * What comes after a person in a list of a source's authors: a comma, ", and", or "et al." after the first of seven or
 * more (`formatPersonSeperator`, where English has a comma before "and")
 */
const formatPersonSeperator = (position: number, count: number): string => {
    if (count > 6) {
        return position === 1 ? General.ListSeparator + Strings.AndOthersUnCap : "";
    }
    return position === count
        ? ""
        : position === count - 1
          ? General.ListSeparator + Strings.AndUnCap + General.Space
          : General.ListSeparator;
};

/**
 * What comes after a person in a list of other contributors, such as editors: a comma, ", &" with APA's word before the
 * last author, or "et al." after the first of seven or more (`formatPersonSeperator2`)
 */
const formatPersonSeperator2 = (position: number, count: number): string => {
    if (count > 6) {
        return position === 1 ? General.ListSeparator + Strings.AndOthersUnCap : "";
    }
    return position === count
        ? ""
        : position === count - 1
          ? General.AuthorsSeparator + APA.BeforeLastAuthor + General.Space
          : General.ListSeparator;
};

/**
 * People as a source's authors are listed: the first last name first, the others first name first, and only the first
 * of seven or more; or the organization (`formatPersonsAuthor`)
 */
const formatPersonsAuthor = (names: WordNames | undefined): string => {
    if (names === undefined) {
        return "";
    }
    if ("corporate" in names) {
        return names.corporate;
    }
    const count = names.people.length;
    return names.people
        .map((person, index) => {
            const position = index + 1;
            const name =
                position === 1
                    ? xsl.formatName(person, Chicago.MainAuthor)
                    : count <= 6
                      ? xsl.formatName(person, Chicago.OtherAuthors)
                      : "";
            return name + formatPersonSeperator(position, count);
        })
        .join("");
};

/**
 * People as a source's other contributors are listed, such as its editors, first name first, and only the first of seven
 * or more (`formatPersons`)
 */
const formatPersons = (names: WordNames | undefined): string => {
    if (names === undefined) {
        return "";
    }
    if ("corporate" in names) {
        return names.corporate;
    }
    const count = names.people.length;
    return names.people
        .map((person, index) => {
            const position = index + 1;
            return (
                (count <= 6 || position === 1 ? xsl.formatName(person, Chicago.SecondaryAuthors) : "") +
                formatPersonSeperator2(position, count)
            );
        })
        .join("");
};

/** The date, such as "4 May 2001", or "n.d." when the source has no year (`formatDate`, with `formatDateCore`) */
const formatDate = (source: WordSource): string => {
    const year = fieldOf(source, "Year");
    return year ? xsl.formatDatePrivate(fieldOf(source, "Day"), fieldOf(source, "Month"), year, Chicago.Date) : Strings.NoDateShortUnCap;
};

/** The date a source was read, such as "May 4, 2022", or nothing when it has no year (`formatDateAccessed`) */
const formatDateAccessed = (source: WordSource): string =>
    xsl.formatDatePrivate(
        fieldOf(source, "DayAccessed"),
        fieldOf(source, "MonthAccessed"),
        fieldOf(source, "YearAccessed"),
        APA.DateAccessed,
    );

/** The city, the publisher and the year, such as "Naples: Forno Press, 2010" (`templateCPYNoDot`) */
const templateCPYNoDot = (source: WordSource): string =>
    templateANoDot(templateCityStateProvince(source), fieldOf(source, "Publisher"), getYear(source));

/** The city, the publisher and the year, with a dot after them (`templateCPY`) */
const templateCPY = (source: WordSource): string =>
    templateA(templateCityStateProvince(source), fieldOf(source, "Publisher"), getYear(source));

/** The date, the edition and the pages, such as "4 May 2001, 3rd ed.: 10-20." (`templateDEP`) */
const templateDEP = (source: WordSource): string =>
    templateE(formatDate(source), formatIf(Strings.EditionShortUnCap, fieldOf(source, "Edition")), fieldOf(source, "Pages"));

/**
 * The recording number, the year and the medium, each with a dot after it, such as "KR-101. 2005. CD." (`templateRYM`).
 * The year is never empty, as it is "n.d." when the source has none
 */
const templateRYM = (source: WordSource): string => {
    const recordingNumber = fieldOf(source, "RecordingNumber");
    const medium = fieldOf(source, "Medium");
    return (
        xsl.appendDot(recordingNumber) +
        (recordingNumber ? General.Space : "") +
        xsl.appendDot(getYear(source)) +
        (medium ? General.Space : "") +
        xsl.appendDot(medium)
    );
};

/**
 * The court, the city and the date, in brackets, such as "(Supreme Court, Washington 28 June 2001)." (`templateCCD`).
 * The date is never empty, as it is "n.d." when the source has no year, so the brackets are always written
 */
const templateCCD = (source: WordSource): string => {
    const court = fieldOf(source, "Court");
    const city = fieldOf(source, "City");
    return xsl.appendDot(
        General.OpenBracket +
            court +
            (court ? General.ListSeparator : "") +
            city +
            (city ? General.Space : "") +
            formatDate(source) +
            General.CloseBracket,
    );
};

/**
 * A journal's publisher, volume, issue, month and year, and pages, such as " 12, no. 4 (May 2010): 233-250."
 * (`templateVIYP`). It starts with a space or a comma when the journal has a name, which comes before it. The year is
 * never empty, as it is "n.d." when the source has none, so neither is this
 */
const templateVIYP = (source: WordSource): string => {
    const journalName = fieldOf(source, "JournalName");
    const publisher = fieldOf(source, "Publisher");
    const volume = fieldOf(source, "Volume");
    const issue = fieldOf(source, "Issue");
    const month = fieldOf(source, "Month");
    const pages = fieldOf(source, "Pages");
    const monthYear = (fieldOf(source, "Year") && month ? month + General.Space : "") + getYear(source);
    return xsl.appendDot(
        (publisher ? (journalName ? General.Space : "") + General.OpenBracket + publisher + General.CloseBracket : "") +
            (volume ? (journalName || publisher ? General.Space : "") + volume : "") +
            (((journalName || publisher || volume) && issue) || (!volume && !issue && journalName) ? General.ListSeparator : "") +
            formatIf(Strings.NumberShortUnCap, issue) +
            General.Space +
            (volume || issue ? General.OpenBracket + monthYear + General.CloseBracket : monthYear) +
            (pages ? General.EnumSeparator + pages : ""),
    );
};

/**
 * The city, the publisher, and the date in brackets with the pages after it, such as "Paris: Press, (4 May 2001): 10-20."
 * (`templateCPDMY`). The date is never empty, as it is "n.d." when the source has no year, so the template's pages
 * without a date are never written
 */
const templateCPDMY = (source: WordSource): string => {
    const pages = fieldOf(source, "Pages");
    return templateA(
        templateCityStateProvince(source),
        fieldOf(source, "Publisher"),
        General.OpenBracket + formatDate(source) + General.CloseBracket + (pages ? General.EnumSeparator + pages : ""),
    );
};

/** A website's address, and when it was read, such as "https://example.com (accessed May 4, 2022)" (`templateDACURL`) */
const templateDACURL = (source: WordSource): string => {
    const url = fieldOf(source, "URL");
    const date = formatDateAccessed(source);
    return (
        url +
        (url && date ? General.Space : "") +
        (date ? General.OpenBracket + formatIf(Strings.AccessedUnCap, date) + General.CloseBracket : "")
    );
};

/** A report's type, department, institution, city, publisher and year, and pages (`templateRICPY`) */
const templateRICPY = (source: WordSource): string =>
    textOf(
        xsl.printList([
            fieldOf(source, "ThesisType"),
            fieldOf(source, "Department"),
            fieldOf(source, "Institution"),
            templateCPYNoDot(source),
            fieldOf(source, "Pages"),
        ]),
    );

/**
 * A source's entry in the bibliography, as the style writes the paragraph (`b:Bibliography`)
 *
 * @param authorMain - Its authors, or a dash when they're the authors of the entry before it
 */
const bibliographyEntry = (source: WordSource, authorMain: string): FormattedText => {
    const field = (name: Field): string => fieldOf(source, name);
    const names = (role: Role): WordNames | undefined => source.names[role];
    const cEditors = countOf(names("Editor"));
    const cTranslators = countOf(names("Translator"));
    const cComposers = countOf(names("Composer"));
    const cCompilers = countOf(names("Compiler"));
    const cProducers = countOf(names("ProducerName"));
    const cConductors = countOf(names("Conductor"));

    const author = formatPersonsAuthor(names("Author"));
    const compiler = formatPersons(names("Compiler"));
    const compilerLF = formatPersonsAuthor(names("Compiler"));
    const editor = formatPersons(names("Editor"));
    const editorLF = formatPersonsAuthor(names("Editor"));
    const translator = formatPersons(names("Translator"));
    const translatorLF = formatPersonsAuthor(names("Translator"));
    const performer = formatPersons(names("Performer"));
    const intervieweeLF = formatPersonsAuthor(names("Interviewee"));
    const producerName = formatPersons(names("ProducerName"));
    const interviewer = formatPersons(names("Interviewer"));
    const writer = formatPersons(names("Writer"));
    const writerLF = formatPersonsAuthor(names("Writer"));
    const director = formatPersons(names("Director"));
    const inventorLF = formatPersonsAuthor(names("Inventor"));
    const bookAuthor = formatPersons(names("BookAuthor"));
    const performerLF = formatPersonsAuthor(names("Performer"));
    const conductorLF = formatPersonsAuthor(names("Conductor"));
    const conductor = formatPersons(names("Conductor"));
    const composerLF = formatPersonsAuthor(names("Composer"));
    const composer = formatPersons(names("Composer"));
    const artist = formatPersonsAuthor(names("Artist"));

    // The year is "n.d." when a source has none, so the date, and the parts of an entry with the year, such as the city,
    // the publisher and the year, are never empty: they are written with no test, and with a space before what follows
    // them
    const writerLFDot = xsl.appendDot(writerLF);
    const dateDot = xsl.appendDot(formatDate(source));
    const tempCPY = templateCPY(source);
    const tempRICPY = templateRICPY(source);
    const tempCPDMY = templateCPDMY(source);
    const tempDEP = templateDEP(source);
    const tempRYM = templateRYM(source);
    const tempTC = templateC(field("Theater"), field("City"));
    const tempIC = templateC(field("Institution"), field("City"));
    const tempDY = templateC(field("Distributor"), getYear(source));
    const tempCPD = templateA(templateCityStateProvince(source), field("Publisher"), formatDate(source));
    const tempSC = templateC(field("Station"), field("City"));
    const tempCP = templateCP(source);
    const tempCCD = templateCCD(source);
    const tempVIYP = templateVIYP(source);
    const tempDaU = xsl.appendDot(templateDACURL(source));

    const titleDot = xsl.appendDot(field("Title"));
    const albumTitleDot = xsl.appendDot(field("AlbumTitle"));
    const pagesDot = xsl.appendDot(field("Pages"));
    const bookTitle = field("BookTitle");
    const bookTitleDot = xsl.appendDot(bookTitle);
    const conferenceNameDot = xsl.appendDot(field("ConferenceName"));
    const broadcasterDot = xsl.appendDot(field("Broadcaster"));
    const interviewTitle = field("Title");
    const publisher = field("Publisher");
    const publicationTitle = field("PublicationTitle");
    const publicationTitleDot = xsl.appendDot(publicationTitle);
    const institutionDot = xsl.appendDot(field("Institution"));
    const journalName = field("JournalName");
    const internetSiteTitleDot = xsl.appendDot(field("InternetSiteTitle"));
    const mediumDot = xsl.appendDot(field("Medium"));
    const issueDot = xsl.appendDot(field("Issue"));
    const numberVolumesDot = xsl.appendDot(formatIf(Strings.VolumesAfterShortUnCap, field("NumberVolumes")));
    const noIssueDot = xsl.appendDot(formatIf(Strings.NumberShortUnCap, field("Issue")));
    const editionDot = xsl.appendDot(field("Edition"));
    const broadcastTitle = field("BroadcastTitle");
    const versionDot = xsl.appendDot(field("Version"));
    const broadcastTitleDot = xsl.appendDot(broadcastTitle);
    const periodicalTitle = field("PeriodicalTitle");
    const periodicalTitleDot = xsl.appendDot(periodicalTitle);
    const productionCompany = field("ProductionCompany");
    const volume = field("Volume");
    const caseNoDot = field("CaseNumber");

    const prefixVersionDot = versionDot ? Strings.VersionShortCap + General.Space + versionDot : "";
    const prefixEditorDot = prefixed(editor, cEditors, Strings.EditorShortCap, Strings.EditorShortCap);
    const prefixTranslatorDot = prefixed(translator, cTranslators, Strings.TranslatorShortCap, Strings.TranslatorsShortCap);
    const sufixEditorLFDot = suffixed(editorLF, cEditors, Strings.EditorShortUnCap, Strings.EditorsShortUnCap);
    const prefixConductorDot = prefixed(conductor, cConductors, Strings.ConductorShortCap, Strings.ConductorsShortCap);
    const prefixComposerDot = prefixed(composer, cComposers, Strings.ComposerShortCap, Strings.ComposersShortCap);
    const prefixCompilerDot = prefixed(compiler, cCompilers, Strings.CompilerShortCap, Strings.CompilersShortCap);
    const sufixCompilerLFDot = suffixed(compilerLF, cCompilers, Strings.CompilerShortUnCap, Strings.CompilersShortUnCap);
    const sufixTranslatorLFDot = suffixed(translatorLF, cTranslators, Strings.TranslatorShortUnCap, Strings.TranslatorsShortUnCap);

    const prefixVolume = formatIf(volumeFormatOf(volume, Strings.VolumeShortCap, Strings.VolumesShortCap), volume);
    const prefixVolumeDot = xsl.appendDot(prefixVolume);
    // The volume, and "in" the book's title in italics, which is written with its formatting
    const inBook = bookTitleDot !== "" && prefixVolumeDot !== "";
    const volumeBookTitle = join(
        prefixVolume,
        inBook ? General.ListSeparator : "",
        bookTitle ? xsl.stringFormat(inBook ? Strings.InNameUnCap : Strings.InNameCap, applyItalic(bookTitle)) : "",
    );
    const theCapShortPrefixVolumeDot = prefixVolumeDot;

    const prod = producerName || productionCompany;
    const prodDot = xsl.appendDot(prod);
    const prefixProdDot = prod
        ? (cProducers > 1 ? Strings.ProducersShortCap + General.Space : cProducers === 1 ? Strings.ProducerShortCap + General.Space : "") +
          prodDot
        : "";

    const authorDot = xsl.appendDot(author);
    const sectionAuthorDot = authorDot;
    const bookAuthorDot = xsl.appendDot(bookAuthor);
    const performerLFDot = xsl.appendDot(performerLF);
    const artistDot = xsl.appendDot(artist);
    const interviewerDot = xsl.appendDot(interviewer);
    const intervieweeLFDot = xsl.appendDot(intervieweeLF);
    const conductorLFDot = xsl.appendDot(conductorLF);
    const inventorLFDot = xsl.appendDot(inventorLF);
    const writerDot = xsl.appendDot(writer);
    const composerLFDot = xsl.appendDot(composerLF);

    const theAuthorSufixDot = xsl.appendDot(
        author
            ? authorMain
            : editorLF &&
                ["Book", "Misc", "ArticleInAPeriodical", "ConferenceProceedings", "InternetSite", "DocumentFromInternetSite"].includes(
                    source.type,
                )
              ? suffixed(editorLF, cEditors, Strings.EditorShortUnCap, Strings.EditorsShortUnCap)
              : compilerLF && source.type === "Misc"
                ? suffixed(compilerLF, cCompilers, Strings.CompilerShortUnCap, Strings.CompilersShortUnCap)
                : translatorLF && (source.type === "Book" || source.type === "Misc")
                  ? suffixed(translatorLF, cTranslators, Strings.TranslatorShortUnCap, Strings.TranslatorsShortUnCap)
                  : "",
    );

    const theUnCapLongByAuthor = formatIf(Strings.ByUnCap, bookAuthor);
    const theCapLongByAuthor = formatIf(Strings.ByCap, bookAuthor);
    const theCapLongPrefixEditorDot = xsl.appendDot(author ? formatIf(Strings.EditedByCap, editor) : "");
    const theCapLongPrefixCompilerDot = xsl.appendDot(author || editor ? formatIf(Strings.CompiledByCap, compiler) : "");
    const theCapLongPrefixTranslatorDot = xsl.appendDot(author || editor || compiler ? formatIf(Strings.TranslatedByCap, translator) : "");
    const theCapLongPrefixEditedBy = formatIf(Strings.EditedByCap, editor);
    const theCapLongPrefixEditedByDot = xsl.appendDot(theCapLongPrefixEditedBy);
    const theUnCapLongPrefixEditedBy = formatIf(Strings.EditedByUnCap, editor);
    const theUnCapLongPrefixEditedByDot = xsl.appendDot(theUnCapLongPrefixEditedBy);
    const theCapLongPrefixTranslatedBy = formatIf(Strings.TranslatedByCap, translator);
    const theCapLongPrefixTranslatedByDot = xsl.appendDot(theCapLongPrefixTranslatedBy);
    const theUnCapLongPrefixTranslatedBy = formatIf(Strings.TranslatedByUnCap, translator);
    const theUnCapLongPrefixTranslatedByDot = xsl.appendDot(theUnCapLongPrefixTranslatedBy);

    const theCPAuthorSufixDot = xsl.appendDot(
        author ? authorMain : suffixed(editorLF, cEditors, Strings.EditorShortUnCap, Strings.EditorsShortUnCap),
    );
    // The style writes the editors of conference proceedings, and of others, with the same variable as a book's
    const theCPCapLongPrefixEditorDot = theCapLongPrefixEditorDot;
    const theCapLongPrefixDirectedByDot = xsl.appendDot(formatIf(Strings.DirectedByCap, director));
    const theCapLongPrefixPerformedByDot = xsl.appendDot(formatIf(Strings.PerformedByCap, performer));
    const theCapLongPrefixProducedByDot = xsl.appendDot(formatIf(Strings.ProducedByCap, prod));

    const entries: Readonly<Record<WordSourceType, () => FormattedText>> = {
        Book: () =>
            join(
                theAuthorSufixDot,
                when(titleDot, spaceIf(theAuthorSufixDot), applyItalic(titleDot)),
                when(editionDot, spaceIf(theAuthorSufixDot, titleDot), editionDot),
                when(theCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, titleDot, editionDot), theCapLongPrefixEditorDot),
                when(
                    theCapLongPrefixTranslatorDot,
                    spaceIf(theAuthorSufixDot, titleDot, theCapLongPrefixEditorDot, editionDot),
                    theCapLongPrefixTranslatorDot,
                ),
                when(
                    theCapShortPrefixVolumeDot,
                    spaceIf(theAuthorSufixDot, titleDot, theCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, editionDot),
                    theCapShortPrefixVolumeDot,
                ),
                when(
                    numberVolumesDot,
                    spaceIf(
                        theAuthorSufixDot,
                        titleDot,
                        theCapLongPrefixEditorDot,
                        theCapLongPrefixTranslatorDot,
                        theCapShortPrefixVolumeDot,
                        editionDot,
                    ),
                    numberVolumesDot,
                ),
                spaceIf(
                    theAuthorSufixDot,
                    titleDot,
                    theCapLongPrefixEditorDot,
                    theCapLongPrefixTranslatorDot,
                    theCapShortPrefixVolumeDot,
                    editionDot,
                    numberVolumesDot,
                ),
                tempCPY,
            ),
        ConferenceProceedings: () =>
            join(
                theCPAuthorSufixDot,
                when(titleDot, spaceIf(theCPAuthorSufixDot), quoted(titleDot)),
                when(theCPCapLongPrefixEditorDot, spaceIf(theCPAuthorSufixDot, titleDot), theCPCapLongPrefixEditorDot),
                when(
                    conferenceNameDot,
                    spaceIf(theCPAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot),
                    applyItalic(conferenceNameDot),
                ),
                spaceIf(theCPAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot, conferenceNameDot),
                tempCPY,
                when(pagesDot, General.Space, pagesDot),
            ),
        BookSection: () =>
            join(
                sectionAuthorDot,
                volume
                    ? when(titleDot, spaceIf(sectionAuthorDot), applyItalic(titleDot), General.Space)
                    : join(when(titleDot, spaceIf(sectionAuthorDot), quoted(titleDot)), spaceIf(sectionAuthorDot, titleDot, bookAuthorDot)),
                printSpaceAndList([
                    volume ? volumeBookTitle : bookTitle ? xsl.stringFormat(Strings.InNameCap, applyItalic(bookTitle)) : "",
                    !volume && !bookTitleDot ? theCapLongByAuthor : theUnCapLongByAuthor,
                    !volume && !bookTitleDot && !theCapLongByAuthor ? theCapLongPrefixEditedBy : theUnCapLongPrefixEditedBy,
                    theUnCapLongPrefixTranslatedBy,
                    field("Pages"),
                ]),
                spaceIf(sectionAuthorDot, titleDot, bookAuthorDot, bookTitleDot, prefixEditorDot, prefixTranslatorDot, volume),
                tempCPY,
            ),
        // The journal's volume, issue, date and pages are never empty, so its name has no dot after it, and they follow
        // it with no space, as they start with one, or with a comma
        JournalArticle: () =>
            join(
                authorDot || sufixEditorLFDot,
                when(titleDot, spaceIf(authorDot, sufixEditorLFDot), quoted(titleDot)),
                when(theCPCapLongPrefixEditorDot && authorDot, General.Space, theCPCapLongPrefixEditorDot),
                when(journalName, spaceIf(authorDot, titleDot, sufixEditorLFDot), applyItalic(journalName)),
                journalName ? "" : spaceIf(authorDot, titleDot, sufixEditorLFDot),
                tempVIYP,
            ),
        Report: () =>
            join(
                authorDot,
                when(titleDot, spaceIf(authorDot), publisher ? applyItalic(titleDot) : quoted(titleDot)),
                spaceIf(authorDot, titleDot),
                tempRICPY,
            ),
        SoundRecording: () => {
            const titles = (titleSpace: string, albumSpace: string): FormattedText =>
                join(
                    when(titleDot && albumTitleDot, titleSpace, quoted(titleDot)),
                    when(titleDot && !albumTitleDot, titleSpace, applyItalic(titleDot)),
                    when(albumTitleDot, albumSpace, applyItalic(albumTitleDot)),
                );
            if (performerLF) {
                return join(
                    performerLFDot,
                    titles(General.Space, General.Space),
                    when(prefixConductorDot, General.Space, prefixConductorDot),
                    when(prefixComposerDot, General.Space, prefixComposerDot),
                    General.Space,
                    tempRYM,
                );
            }
            return conductorLFDot
                ? join(
                      conductorLFDot,
                      titles(General.Space, General.Space),
                      when(prefixComposerDot, General.Space, prefixComposerDot),
                      General.Space,
                      tempRYM,
                  )
                : join(
                      composerLFDot,
                      titles(spaceIf(composerLFDot), spaceIf(composerLFDot, titleDot)),
                      spaceIf(composerLFDot, titleDot, albumTitleDot),
                      tempRYM,
                  );
        },
        // The style writes a space before the writers, at the start of the paragraph, which Word doesn't show
        Performance: () =>
            join(
                when(writerLFDot, General.Space, writerLFDot),
                when(titleDot, spaceIf(writerLFDot), applyItalic(titleDot)),
                when(theCapLongPrefixDirectedByDot, spaceIf(titleDot, writerDot), theCapLongPrefixDirectedByDot),
                when(
                    theCapLongPrefixPerformedByDot,
                    spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot),
                    theCapLongPrefixPerformedByDot,
                ),
                when(tempTC, spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot, theCapLongPrefixPerformedByDot), tempTC),
                spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot, theCapLongPrefixPerformedByDot, tempTC),
                dateDot,
            ),
        Art: () =>
            publicationTitle
                ? join(
                      normalizeSpace(artistDot),
                      when(titleDot, spaceIf(artistDot), quoted(titleDot)),
                      when(institutionDot, spaceIf(artistDot, titleDot), institutionDot),
                      spaceIf(artistDot, titleDot, institutionDot),
                      applyItalic(publicationTitleDot),
                      General.Space,
                      tempCPY,
                  )
                : join(
                      normalizeSpace(artistDot),
                      when(titleDot, spaceIf(artistDot), applyItalic(titleDot)),
                      when(tempIC, spaceIf(artistDot, titleDot), tempIC),
                  ),
        DocumentFromInternetSite: () =>
            join(
                theAuthorSufixDot,
                when(titleDot, spaceIf(theAuthorSufixDot), quoted(titleDot)),
                when(prefixVersionDot, spaceIf(theAuthorSufixDot, titleDot), prefixVersionDot),
                when(internetSiteTitleDot, spaceIf(theAuthorSufixDot, titleDot, versionDot), applyItalic(internetSiteTitleDot)),
                when(
                    theCPCapLongPrefixEditorDot,
                    spaceIf(theAuthorSufixDot, titleDot, versionDot, internetSiteTitleDot),
                    theCPCapLongPrefixEditorDot,
                ),
                when(prodDot, spaceIf(theAuthorSufixDot, titleDot, versionDot, internetSiteTitleDot, theCPCapLongPrefixEditorDot), prodDot),
                spaceIf(theAuthorSufixDot, titleDot, versionDot, internetSiteTitleDot, theCPCapLongPrefixEditorDot, prodDot),
                dateDot,
                when(tempDaU, General.Space, tempDaU),
            ),
        InternetSite: () =>
            join(
                theAuthorSufixDot,
                when(titleDot, spaceIf(theAuthorSufixDot), applyItalic(titleDot)),
                when(theCPCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, titleDot), theCPCapLongPrefixEditorDot),
                when(prefixVersionDot, spaceIf(theAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot), prefixVersionDot),
                when(prodDot, spaceIf(theAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot, versionDot), prodDot),
                spaceIf(theAuthorSufixDot, titleDot, theCPCapLongPrefixEditorDot, versionDot, prodDot),
                dateDot,
                when(tempDaU, General.Space, tempDaU),
            ),
        Patent: () =>
            join(
                inventorLFDot,
                when(titleDot, spaceIf(inventorLFDot), titleDot),
                when(prefixEditorDot, spaceIf(inventorLFDot, titleDot), prefixEditorDot),
                when(prefixTranslatorDot, spaceIf(inventorLFDot, titleDot, prefixEditorDot), prefixTranslatorDot),
                when(tempCP, spaceIf(inventorLFDot, titleDot, prefixEditorDot, prefixTranslatorDot), tempCP),
                spaceIf(inventorLFDot, titleDot, prefixEditorDot, prefixTranslatorDot, tempCP),
                dateDot,
            ),
        Case: () => join(applyItalic(titleDot), when(caseNoDot, spaceIf(titleDot), caseNoDot), spaceIf(titleDot, caseNoDot), tempCCD),
        Misc: () =>
            join(
                theAuthorSufixDot,
                when(titleDot, spaceIf(theAuthorSufixDot), quoted(titleDot)),
                when(publicationTitleDot, spaceIf(theAuthorSufixDot, titleDot), applyItalic(publicationTitleDot)),
                when(prefixVolumeDot, spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot), prefixVolumeDot),
                when(noIssueDot, spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot, prefixVolumeDot), noIssueDot),
                when(
                    theCPCapLongPrefixEditorDot,
                    spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot),
                    theCPCapLongPrefixEditorDot,
                ),
                when(
                    theCapLongPrefixTranslatorDot,
                    spaceIf(theAuthorSufixDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot, theCPCapLongPrefixEditorDot),
                    theCapLongPrefixTranslatorDot,
                ),
                when(
                    theCapLongPrefixCompilerDot,
                    spaceIf(
                        theAuthorSufixDot,
                        titleDot,
                        publicationTitleDot,
                        prefixVolumeDot,
                        issueDot,
                        theCPCapLongPrefixEditorDot,
                        theCapLongPrefixTranslatorDot,
                    ),
                    theCapLongPrefixCompilerDot,
                ),
                spaceIf(
                    theAuthorSufixDot,
                    titleDot,
                    publicationTitleDot,
                    prefixVolumeDot,
                    issueDot,
                    theCPCapLongPrefixEditorDot,
                    theCapLongPrefixTranslatorDot,
                    theCapLongPrefixCompilerDot,
                ),
                tempCPD,
                when(pagesDot, General.Space, pagesDot),
            ),
        ElectronicSource: () => {
            // The authors, or else the editors, the translators or the compilers, last name first
            const lfAuthor = authorDot || sufixEditorLFDot || sufixTranslatorLFDot || sufixCompilerLFDot;
            const before = [lfAuthor, titleDot, publicationTitleDot, editionDot, prefixVolumeDot, mediumDot];
            return join(
                lfAuthor,
                when(titleDot && publicationTitleDot, spaceIf(lfAuthor), quoted(titleDot)),
                when(titleDot && !publicationTitleDot, spaceIf(lfAuthor), applyItalic(titleDot)),
                when(publicationTitleDot, spaceIf(lfAuthor, titleDot), applyItalic(publicationTitleDot)),
                when(editionDot, spaceIf(lfAuthor, titleDot, publicationTitleDot), editionDot),
                when(prefixVolumeDot, spaceIf(lfAuthor, titleDot, publicationTitleDot, editionDot), prefixVolumeDot),
                when(mediumDot, spaceIf(lfAuthor, titleDot, publicationTitleDot, editionDot, prefixVolumeDot), mediumDot),
                when(authorDot && theCPCapLongPrefixEditorDot, spaceIf(...before), theCPCapLongPrefixEditorDot),
                when(theCapLongPrefixTranslatorDot && (authorDot || sufixEditorLFDot), spaceIf(...before), theCapLongPrefixTranslatorDot),
                when(prefixCompilerDot && (authorDot || sufixEditorLFDot || sufixTranslatorLFDot), spaceIf(...before), prefixCompilerDot),
                when(prefixProdDot, spaceIf(...before), prefixProdDot),
                spaceIf(...before, prefixProdDot),
                tempCPD,
            );
        },
        // An article's date, edition and pages are never empty, so the periodical's title has no dot after it when it
        // follows the authors, and they follow a periodical's title that starts the entry with no space
        ArticleInAPeriodical: () =>
            join(
                theAuthorSufixDot,
                when(periodicalTitle && !theAuthorSufixDot, applyItalic(periodicalTitleDot)),
                when(titleDot, spaceIf(theAuthorSufixDot, periodicalTitle), quoted(titleDot)),
                when(periodicalTitle && theAuthorSufixDot, General.Space, applyItalic(periodicalTitle)),
                theAuthorSufixDot && periodicalTitle ? General.ListSeparator : spaceIf(theAuthorSufixDot, titleDot),
                tempDEP,
            ),
        Film: () =>
            join(
                when(writerDot, writerLFDot),
                when(titleDot, spaceIf(writerDot), applyItalic(titleDot)),
                when(mediumDot, spaceIf(titleDot, writerDot), mediumDot),
                when(theCapLongPrefixDirectedByDot, spaceIf(titleDot, writerDot, mediumDot), theCapLongPrefixDirectedByDot),
                when(
                    theCapLongPrefixProducedByDot,
                    spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot, mediumDot),
                    theCapLongPrefixProducedByDot,
                ),
                when(
                    theCapLongPrefixPerformedByDot,
                    spaceIf(titleDot, writerDot, theCapLongPrefixDirectedByDot, theCapLongPrefixProducedByDot, mediumDot),
                    theCapLongPrefixPerformedByDot,
                ),
                spaceIf(
                    titleDot,
                    writerDot,
                    theCapLongPrefixDirectedByDot,
                    theCapLongPrefixProducedByDot,
                    theCapLongPrefixPerformedByDot,
                    mediumDot,
                ),
                tempDY,
            ),
        Interview: () => {
            const interviewTitleDot = titleDot;
            const start = join(
                when(intervieweeLFDot, interviewerDot ? intervieweeLF : intervieweeLFDot),
                when(
                    interviewerDot,
                    intervieweeLFDot ? General.ListSeparator : "",
                    xsl.stringFormatDot(intervieweeLFDot ? Strings.InterviewByUnCap : Strings.InterviewByCap, interviewer),
                ),
                when(
                    interviewTitle,
                    spaceIf(interviewerDot, intervieweeLFDot),
                    broadcastTitleDot
                        ? join(intervieweeLFDot ? General.Space : "", quoted(interviewTitleDot))
                        : join(spaceIf(intervieweeLFDot), applyItalic(interviewTitle)),
                ),
            );
            if (field("Broadcaster")) {
                return join(
                    start,
                    when(broadcastTitleDot, spaceIf(interviewerDot, intervieweeLFDot, interviewTitle), applyItalic(broadcastTitleDot)),
                    spaceIf(interviewerDot, intervieweeLFDot, interviewTitle, broadcastTitleDot),
                    broadcasterDot,
                    when(tempSC, General.Space, tempSC),
                    General.Space,
                    dateDot,
                );
            }
            return join(
                start,
                when(
                    broadcastTitleDot,
                    spaceIf(interviewerDot, intervieweeLFDot, interviewTitle),
                    applyItalic(editor || translator ? broadcastTitle : broadcastTitleDot),
                ),
                when(
                    theCapLongPrefixEditedByDot,
                    broadcastTitleDot
                        ? join(
                              General.ListSeparator,
                              theCapLongPrefixTranslatedByDot ? theUnCapLongPrefixEditedBy : theUnCapLongPrefixEditedByDot,
                          )
                        : theCapLongPrefixTranslatedByDot
                          ? theCapLongPrefixEditedBy
                          : theCapLongPrefixEditedByDot,
                ),
                when(
                    theCapLongPrefixTranslatedByDot,
                    broadcastTitleDot || theCapLongPrefixEditedByDot
                        ? join(General.ListSeparator, theUnCapLongPrefixTranslatedByDot)
                        : theCapLongPrefixTranslatedByDot,
                ),
                spaceIf(
                    interviewerDot,
                    intervieweeLFDot,
                    interviewTitle,
                    broadcastTitleDot,
                    theCapLongPrefixTranslatedByDot,
                    theCapLongPrefixEditedByDot,
                ),
                tempCPDMY,
            );
        },
    };

    const entry = entries[source.type]();
    // Word's XSLT writes a line break after the entry, which Word reads as a space, when the entry ends with an element,
    // such as an artwork's title in italics when it has no institution or city
    const last = entry[entry.length - 1] as FormattedRun | undefined;
    return last?.italics ? join(entry, General.Space) : entry;
};

/**
 * Turabian, the style of Kate Turabian's manual for writers of papers, as Word writes it: citations such as
 * "(Baker 2010, 50)", and a bibliography of entries such as "Baker, Anna. *The Art of Pizza.* Naples: Forno Press, 2010.",
 * with a dash for the authors of an entry with the same authors as the one before it.
 */
export const turabian: StyleDefinition = {
    name: "Turabian",
    file: "TURABIAN.XSL",
    version: "6",
    citation,
    bibliography: (sources: readonly WordSource[]): FormattedBibliography =>
        bibliographyOf(sources, formatPersonsAuthor, bibliographyEntry),
};
