/**
 * Chicago, the author-date style of the Chicago Manual of Style (16th edition), written from Word's own (CHICAGO.XSL).
 *
 * Each function follows the XSL template its description names, including where that doesn't do what it looks like it
 * should, so citations and bibliographies are written as Word writes them when it updates a document's fields.
 *
 * @module
 */
// The names of the XSL's templates and variables, which the functions and variables here keep, such as templateMDEP for
// the month and day, edition and pages, and its spelling of "sufix"
// cspell:words CCMD CPMD CPMDP CSPP DAUD MDEP PVIP RICP sufix Sufix Forno
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
import { type FormattedText, join, textOf } from "./formatted-text";
import { LOCALS, type NamePatterns } from "./locals";
import type { FormattedBibliography, StyleDefinition } from "./style";
import { applyItalic, xslTemplates } from "./xsl";
import { type Field, type Role, type WordNames, type WordSource, type WordSourceType, fieldOf } from "../word-source";

const { General, Strings, Chicago, APA } = LOCALS;
const xsl = xslTemplates(General);

/** A format of a date, such as "%D %M", with each %D, %M and %Y replaced by the day, month and year (`StringFormatDate`) */
const stringFormatDate = (format: string, day: string, month: string, year: string): string =>
    format.replace(/%([DMY])/g, (_match, code: string) => (code === "D" ? day : code === "M" ? month : year));

/**
 * What comes after a person in a list of a source's authors: a comma, "and", or "et al." after the seventh of 11 or more
 * (`formatPersonSeparator`)
 */
const formatPersonSeparator = (position: number, count: number): string => {
    if (count < 11) {
        return position === count
            ? ""
            : position === count - 1
              ? General.ListSeparator + Strings.AndUnCap + General.Space
              : General.ListSeparator;
    }
    return position > 7 ? "" : position === 7 ? General.ListSeparator + Strings.AndOthersUnCap : General.ListSeparator;
};

/** What comes after a person in a list of other contributors, such as editors (`formatPersonSeparator2`) */
const formatPersonSeparator2 = (position: number, count: number): string => {
    if (count < 11) {
        return position === count ? "" : position === count - 1 ? General.Space + Strings.AndUnCap + General.Space : General.ListSeparator;
    }
    return position > 7 ? "" : position === 7 ? General.ListSeparator + Strings.AndOthersUnCap : General.ListSeparator;
};

/**
 * People as a source's authors are listed: the first last name first, the others first name first, and only the first
 * seven of 11 or more; or the organization (`formatPersonsAuthor`)
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
            const patterns: NamePatterns | undefined =
                position === 1 ? Chicago.MainAuthor : count < 11 || position < 8 ? Chicago.OtherAuthors : undefined;
            return (patterns === undefined ? "" : xsl.formatName(person, patterns)) + formatPersonSeparator(position, count);
        })
        .join("");
};

/** People as a source's other contributors are listed, such as its editors, first name first (`formatPersons`) */
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
                (count < 11 || position < 8 ? xsl.formatName(person, Chicago.SecondaryAuthors) : "") +
                formatPersonSeparator2(position, count)
            );
        })
        .join("");
};

/** The month and the day, such as "9 January", when the source has a year and a month (`getMonthDay`) */
const getMonthDay = (source: WordSource): string => {
    const month = fieldOf(source, "Month");
    if (!fieldOf(source, "Year") || !month) {
        return "";
    }
    const day = fieldOf(source, "Day");
    return stringFormatDate(day ? Chicago.Date.DM : General.SimpleDate.M, day, month, "");
};

/**
 * The date a source was read, such as "February 3, 2022", with the pattern for the parts it has (`formatDateAccessed`,
 * with Chicago's `formatDateCore` and `formatDateCorePrivate`, which write a month and a day without a year)
 */
const formatDateAccessed = (source: WordSource): string => {
    const day = fieldOf(source, "DayAccessed");
    const month = fieldOf(source, "MonthAccessed");
    const year = fieldOf(source, "YearAccessed");
    const patterns = APA.DateAccessed;
    const format = !year
        ? month
            ? day
                ? patterns.DM
                : General.SimpleDate.M
            : ""
        : !month
          ? General.SimpleDate.Y
          : !day
            ? patterns.MY
            : patterns.DMY;
    return stringFormatDate(format, day, month, year);
};

/** The month and day, the edition and the pages, such as "5 June, Late ed.: 10-12." (`templateMDEP`) */
const templateMDEP = (source: WordSource): string => {
    const edition = fieldOf(source, "Edition");
    return templateE(
        getMonthDay(source),
        edition ? textOf(xsl.stringFormat(Strings.EditionShortUnCap, edition)) : "",
        fieldOf(source, "Pages"),
    );
};

/** The recording number and the medium, each with a dot after it (`templateRM`) */
const templateRM = (source: WordSource): string => {
    const recordingNumber = fieldOf(source, "RecordingNumber");
    const medium = fieldOf(source, "Medium");
    return xsl.appendDot(recordingNumber) + (recordingNumber && medium ? General.Space : "") + xsl.appendDot(medium);
};

/** The court, the city and the month and day, in brackets, such as "(Supreme Court, Washington 28 June)." (`templateCCMD`) */
const templateCCMD = (source: WordSource): string => {
    const monthDay = getMonthDay(source);
    const court = fieldOf(source, "Court");
    const city = fieldOf(source, "City");
    return xsl.appendDot(
        court || city || monthDay
            ? General.OpenBracket +
                  court +
                  (court && (city || monthDay) ? General.ListSeparator : "") +
                  (city || monthDay ? city + (city && monthDay ? General.Space : "") + monthDay : "") +
                  General.CloseBracket
            : "",
    );
};

/** A journal's publisher, volume, issue and pages, such as "(Baking Society) 12 (4): 233-250." (`templatePVIP`) */
const templatePVIP = (source: WordSource): string => {
    const publisher = fieldOf(source, "Publisher");
    const volume = fieldOf(source, "Volume");
    const issue = fieldOf(source, "Issue");
    const pages = fieldOf(source, "Pages");
    return xsl.appendDot(
        (publisher ? General.OpenBracket + publisher + General.CloseBracket : "") +
            (volume ? (publisher ? General.Space : "") + volume : "") +
            (issue ? (publisher || volume ? General.Space : "") + General.OpenBracket + issue + General.CloseBracket : "") +
            ((volume || issue) && pages ? General.EnumSeparator : "") +
            (pages ? (publisher || volume || issue ? General.Space : "") + pages : ""),
    );
};

/** The city, the publisher, and the month and day in brackets, or the pages (`templateCPMDP`) */
const templateCPMDP = (source: WordSource): string => {
    const monthDay = getMonthDay(source);
    const pages = fieldOf(source, "Pages");
    const text = templateA(
        templateCityStateProvince(source),
        fieldOf(source, "Publisher"),
        (monthDay ? General.OpenBracket + monthDay + General.CloseBracket : "") + (pages && monthDay ? General.EnumSeparator + pages : ""),
    );
    return text + (pages && !monthDay ? (text ? General.Space : "") + xsl.appendDot(pages) : "");
};

/** When a website was read, and its address, such as "Accessed February 3, 2022. https://example.com." (`templateDAUD`) */
const templateDAUD = (source: WordSource): string => {
    const dateAccessed = formatDateAccessed(source);
    const url = fieldOf(source, "URL");
    return (
        (dateAccessed ? xsl.appendDot(textOf(xsl.stringFormat(Strings.AccessedCap, dateAccessed))) : "") +
        (url ? (dateAccessed ? General.Space : "") + xsl.appendDot(url) : "")
    );
};

/** A report's type, department, institution, city and publisher, and pages (`templateRICP`) */
const templateRICP = (source: WordSource): string =>
    textOf(
        xsl.printList([
            fieldOf(source, "ThesisType"),
            fieldOf(source, "Department"),
            fieldOf(source, "Institution"),
            templateANoDot(templateCityStateProvince(source), fieldOf(source, "Publisher"), ""),
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

    const writerLFDot = xsl.appendDot(writerLF);
    const monthDayDot = xsl.appendDot(getMonthDay(source));
    const yearDot = xsl.appendDot(getYear(source));
    const tempCSPP = templateA(templateCityStateProvince(source), field("Publisher"), "");
    const tempRICP = templateRICP(source);
    const tempCPMDP = templateCPMDP(source);
    const tempMDEP = templateMDEP(source);
    const tempRM = templateRM(source);
    const tempTC = templateC(field("Theater"), field("City"));
    const tempIC = templateC(field("Institution"), field("City"));
    const tempCPMD = templateA(templateCityStateProvince(source), field("Publisher"), getMonthDay(source));
    const tempSC = templateC(field("Station"), field("City"));
    const tempCP = templateCP(source);
    const tempCCMD = templateCCMD(source);
    const tempPVIP = templatePVIP(source);
    const tempDAUD = templateDAUD(source);

    const titleDot = xsl.appendDot(field("Title"));
    const albumTitleDot = xsl.appendDot(field("AlbumTitle"));
    const pagesDot = xsl.appendDot(field("Pages"));
    const bookTitleDot = xsl.appendDot(field("BookTitle"));
    const conferenceNameDot = xsl.appendDot(field("ConferenceName"));
    const broadcasterDot = xsl.appendDot(field("Broadcaster"));
    const interviewTitle = field("Title");
    const publisher = field("Publisher");
    const publicationTitle = field("PublicationTitle");
    const publicationTitleDot = xsl.appendDot(publicationTitle);
    const institutionDot = xsl.appendDot(field("Institution"));
    const journalName = field("JournalName");
    const journalNameDot = xsl.appendDot(journalName);
    const internetSiteTitleDot = xsl.appendDot(field("InternetSiteTitle"));
    const mediumDot = xsl.appendDot(field("Medium"));
    const issueDot = xsl.appendDot(field("Issue"));
    const distributorDot = xsl.appendDot(field("Distributor"));
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
    const bookTitle = field("BookTitle");
    const inBook = bookTitleDot !== "" && prefixVolumeDot !== "";
    const volumeBookTitle = join(
        prefixVolume,
        inBook ? General.ListSeparator : "",
        bookTitle ? xsl.stringFormat(inBook ? Strings.InNameUnCap : Strings.InNameCap, applyItalic(bookTitle)) : "",
    );
    const theCapShortPrefixVolumeDot = prefixVolumeDot;

    const prodDot = xsl.appendDot(producerName || productionCompany);
    const prod = producerName || productionCompany;
    const prefixProdDot =
        producerName || productionCompany
            ? (cProducers > 1
                  ? Strings.ProducersShortCap + General.Space
                  : cProducers === 1
                    ? Strings.ProducerShortCap + General.Space
                    : "") + prodDot
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
                when(yearDot, spaceIf(theAuthorSufixDot), yearDot),
                when(titleDot, spaceIf(theAuthorSufixDot, yearDot), applyItalic(titleDot)),
                when(editionDot, spaceIf(theAuthorSufixDot, yearDot, titleDot), editionDot),
                when(theCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, editionDot), theCapLongPrefixEditorDot),
                when(
                    theCapLongPrefixTranslatorDot,
                    spaceIf(theAuthorSufixDot, yearDot, titleDot, theCapLongPrefixEditorDot, editionDot),
                    theCapLongPrefixTranslatorDot,
                ),
                when(
                    theCapShortPrefixVolumeDot,
                    spaceIf(theAuthorSufixDot, yearDot, titleDot, theCapLongPrefixEditorDot, theCapLongPrefixTranslatorDot, editionDot),
                    theCapShortPrefixVolumeDot,
                ),
                when(
                    numberVolumesDot,
                    spaceIf(
                        theAuthorSufixDot,
                        yearDot,
                        titleDot,
                        theCapLongPrefixEditorDot,
                        theCapLongPrefixTranslatorDot,
                        theCapShortPrefixVolumeDot,
                        editionDot,
                    ),
                    numberVolumesDot,
                ),
                when(
                    tempCSPP,
                    spaceIf(
                        theAuthorSufixDot,
                        yearDot,
                        titleDot,
                        theCapLongPrefixEditorDot,
                        theCapLongPrefixTranslatorDot,
                        theCapShortPrefixVolumeDot,
                        editionDot,
                        numberVolumesDot,
                    ),
                    tempCSPP,
                ),
            ),
        ConferenceProceedings: () =>
            join(
                theCPAuthorSufixDot,
                when(yearDot, spaceIf(theCPAuthorSufixDot), yearDot),
                when(titleDot, spaceIf(theCPAuthorSufixDot, yearDot), quoted(titleDot)),
                when(theCPCapLongPrefixEditorDot, spaceIf(theCPAuthorSufixDot, yearDot, titleDot), theCPCapLongPrefixEditorDot),
                when(
                    conferenceNameDot,
                    spaceIf(theCPAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot),
                    applyItalic(conferenceNameDot),
                ),
                when(tempCSPP, spaceIf(theCPAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot, conferenceNameDot), tempCSPP),
                when(
                    pagesDot,
                    spaceIf(theCPAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot, conferenceNameDot, tempCSPP),
                    pagesDot,
                ),
            ),
        BookSection: () =>
            join(
                sectionAuthorDot,
                when(yearDot, spaceIf(sectionAuthorDot), yearDot),
                volume
                    ? when(
                          titleDot,
                          spaceIf(sectionAuthorDot, yearDot),
                          applyItalic(titleDot),
                          spaceIf(sectionAuthorDot, yearDot, titleDot, bookAuthorDot),
                      )
                    : join(
                          when(titleDot, spaceIf(sectionAuthorDot, yearDot), quoted(titleDot)),
                          spaceIf(sectionAuthorDot, yearDot, titleDot, bookAuthorDot),
                      ),
                printSpaceAndList([
                    volume
                        ? when(textOf(volumeBookTitle), volumeBookTitle)
                        : bookTitle
                          ? xsl.stringFormat(Strings.InNameCap, applyItalic(bookTitle))
                          : "",
                    !volume && !bookTitleDot ? theCapLongByAuthor : theUnCapLongByAuthor,
                    !volume && !bookTitleDot && !theCapLongByAuthor ? theCapLongPrefixEditedBy : theUnCapLongPrefixEditedBy,
                    theUnCapLongPrefixTranslatedBy,
                    field("Pages"),
                ]),
                when(
                    tempCSPP,
                    spaceIf(sectionAuthorDot, yearDot, titleDot, bookAuthorDot, bookTitleDot, prefixEditorDot, prefixTranslatorDot, volume),
                    tempCSPP,
                ),
            ),
        JournalArticle: () =>
            join(
                authorDot || sufixEditorLFDot,
                when(yearDot, spaceIf(authorDot, sufixEditorLFDot), yearDot),
                when(titleDot, spaceIf(authorDot, sufixEditorLFDot, yearDot), quoted(titleDot)),
                when(
                    theCPCapLongPrefixEditorDot && authorDot,
                    spaceIf(authorDot, sufixEditorLFDot, yearDot, titleDot),
                    theCPCapLongPrefixEditorDot,
                ),
                when(
                    journalName,
                    spaceIf(authorDot, sufixEditorLFDot, yearDot, titleDot),
                    applyItalic(tempPVIP ? journalName : journalNameDot),
                ),
                when(tempPVIP, spaceIf(authorDot, sufixEditorLFDot, yearDot, titleDot, journalName), tempPVIP),
            ),
        Report: () =>
            join(
                authorDot,
                when(yearDot, spaceIf(authorDot), yearDot),
                when(titleDot, spaceIf(authorDot, yearDot), publisher ? applyItalic(titleDot) : quoted(titleDot)),
                when(tempRICP, spaceIf(authorDot, yearDot, titleDot), tempRICP),
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
                    when(yearDot, General.Space, yearDot),
                    titles(General.Space, General.Space),
                    when(prefixConductorDot, General.Space, prefixConductorDot),
                    when(prefixComposerDot, General.Space, prefixComposerDot),
                    when(tempRM, General.Space, tempRM),
                );
            }
            return conductorLFDot
                ? join(
                      conductorLFDot,
                      when(yearDot, General.Space, yearDot),
                      titles(General.Space, General.Space),
                      when(prefixComposerDot, General.Space, prefixComposerDot),
                      when(tempRM, General.Space, tempRM),
                  )
                : join(
                      composerLFDot,
                      when(yearDot, spaceIf(composerLFDot), yearDot),
                      titles(spaceIf(composerLFDot), spaceIf(composerLFDot, yearDot, titleDot)),
                      when(tempRM, spaceIf(composerLFDot, yearDot, titleDot, albumTitleDot), tempRM),
                  );
        },
        Performance: () =>
            join(
                writerLFDot,
                when(yearDot, spaceIf(writerLFDot), yearDot),
                when(titleDot, spaceIf(writerLFDot, yearDot), applyItalic(titleDot)),
                when(theCapLongPrefixDirectedByDot, spaceIf(writerLFDot, yearDot, titleDot), theCapLongPrefixDirectedByDot),
                when(
                    theCapLongPrefixPerformedByDot,
                    spaceIf(writerLFDot, yearDot, titleDot, theCapLongPrefixDirectedByDot),
                    theCapLongPrefixPerformedByDot,
                ),
                when(
                    tempTC,
                    spaceIf(writerLFDot, yearDot, titleDot, theCapLongPrefixDirectedByDot, theCapLongPrefixPerformedByDot),
                    tempTC,
                ),
                when(
                    monthDayDot,
                    spaceIf(writerLFDot, yearDot, titleDot, theCapLongPrefixDirectedByDot, theCapLongPrefixPerformedByDot, tempTC),
                    monthDayDot,
                ),
            ),
        Art: () =>
            publicationTitle
                ? join(
                      normalizeSpace(artistDot),
                      when(yearDot, spaceIf(artistDot), yearDot),
                      when(titleDot, spaceIf(artistDot, yearDot), quoted(titleDot)),
                      when(institutionDot, spaceIf(artistDot, yearDot, titleDot), institutionDot),
                      when(publicationTitleDot, spaceIf(artistDot, yearDot, titleDot, institutionDot), applyItalic(publicationTitleDot)),
                      when(tempCSPP, spaceIf(artistDot, yearDot, titleDot, institutionDot, publicationTitle), tempCSPP),
                  )
                : join(
                      normalizeSpace(artistDot),
                      when(yearDot, spaceIf(artistDot), yearDot),
                      when(titleDot, spaceIf(artistDot, yearDot), applyItalic(titleDot)),
                      when(tempIC, spaceIf(artistDot, yearDot, titleDot), tempIC),
                  ),
        DocumentFromInternetSite: () =>
            join(
                theAuthorSufixDot,
                when(yearDot, spaceIf(theAuthorSufixDot), yearDot),
                when(titleDot, spaceIf(theAuthorSufixDot, yearDot), quoted(titleDot)),
                when(prefixVersionDot, spaceIf(theAuthorSufixDot, yearDot, titleDot), prefixVersionDot),
                when(internetSiteTitleDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, versionDot), applyItalic(internetSiteTitleDot)),
                when(
                    theCPCapLongPrefixEditorDot,
                    spaceIf(theAuthorSufixDot, yearDot, titleDot, versionDot, internetSiteTitleDot),
                    theCPCapLongPrefixEditorDot,
                ),
                when(
                    prodDot,
                    spaceIf(theAuthorSufixDot, yearDot, titleDot, versionDot, internetSiteTitleDot, theCPCapLongPrefixEditorDot),
                    prodDot,
                ),
                when(
                    monthDayDot,
                    spaceIf(theAuthorSufixDot, yearDot, titleDot, versionDot, internetSiteTitleDot, theCPCapLongPrefixEditorDot, prodDot),
                    monthDayDot,
                ),
            ),
        InternetSite: () =>
            join(
                theAuthorSufixDot,
                when(yearDot, spaceIf(theAuthorSufixDot), yearDot),
                when(titleDot, spaceIf(theAuthorSufixDot, yearDot), applyItalic(titleDot)),
                when(theCPCapLongPrefixEditorDot, spaceIf(theAuthorSufixDot, yearDot, titleDot), theCPCapLongPrefixEditorDot),
                when(prefixVersionDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot), prefixVersionDot),
                when(prodDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot, versionDot), prodDot),
                when(
                    monthDayDot,
                    spaceIf(theAuthorSufixDot, yearDot, titleDot, theCPCapLongPrefixEditorDot, versionDot, prodDot),
                    monthDayDot,
                ),
            ),
        Patent: () =>
            join(
                inventorLFDot,
                when(yearDot, spaceIf(inventorLFDot), yearDot),
                when(titleDot, spaceIf(inventorLFDot, yearDot), titleDot),
                when(prefixEditorDot, spaceIf(inventorLFDot, yearDot, titleDot), prefixEditorDot),
                when(prefixTranslatorDot, spaceIf(inventorLFDot, yearDot, titleDot, prefixEditorDot), prefixTranslatorDot),
                when(tempCP, spaceIf(inventorLFDot, yearDot, titleDot, prefixEditorDot, prefixTranslatorDot), tempCP),
                when(monthDayDot, spaceIf(inventorLFDot, yearDot, titleDot, prefixEditorDot, prefixTranslatorDot, tempCP), monthDayDot),
            ),
        Case: () =>
            join(
                when(titleDot, applyItalic(titleDot)),
                when(yearDot, spaceIf(titleDot), yearDot),
                when(field("CaseNumber"), spaceIf(titleDot, yearDot), field("CaseNumber")),
                when(tempCCMD, spaceIf(titleDot, yearDot, field("CaseNumber")), tempCCMD),
            ),
        Misc: () =>
            join(
                theAuthorSufixDot,
                when(yearDot, spaceIf(theAuthorSufixDot), yearDot),
                when(titleDot, spaceIf(theAuthorSufixDot, yearDot), quoted(titleDot)),
                when(publicationTitleDot, spaceIf(theAuthorSufixDot, yearDot, titleDot), applyItalic(publicationTitleDot)),
                when(prefixVolumeDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot), prefixVolumeDot),
                when(noIssueDot, spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot, prefixVolumeDot), noIssueDot),
                when(
                    theCPCapLongPrefixEditorDot,
                    spaceIf(theAuthorSufixDot, yearDot, titleDot, publicationTitleDot, prefixVolumeDot, issueDot),
                    theCPCapLongPrefixEditorDot,
                ),
                when(
                    theCapLongPrefixTranslatorDot,
                    spaceIf(
                        theAuthorSufixDot,
                        yearDot,
                        titleDot,
                        publicationTitleDot,
                        prefixVolumeDot,
                        issueDot,
                        theCPCapLongPrefixEditorDot,
                    ),
                    theCapLongPrefixTranslatorDot,
                ),
                when(
                    theCapLongPrefixCompilerDot,
                    spaceIf(
                        theAuthorSufixDot,
                        yearDot,
                        titleDot,
                        publicationTitleDot,
                        prefixVolumeDot,
                        issueDot,
                        theCPCapLongPrefixEditorDot,
                        theCapLongPrefixTranslatorDot,
                    ),
                    theCapLongPrefixCompilerDot,
                ),
                when(
                    tempCPMD,
                    spaceIf(
                        theAuthorSufixDot,
                        yearDot,
                        titleDot,
                        publicationTitleDot,
                        prefixVolumeDot,
                        issueDot,
                        theCPCapLongPrefixEditorDot,
                        theCapLongPrefixTranslatorDot,
                        theCapLongPrefixCompilerDot,
                    ),
                    tempCPMD,
                ),
                when(
                    pagesDot,
                    spaceIf(
                        theAuthorSufixDot,
                        yearDot,
                        titleDot,
                        publicationTitleDot,
                        prefixVolumeDot,
                        issueDot,
                        theCPCapLongPrefixEditorDot,
                        theCapLongPrefixTranslatorDot,
                        theCapLongPrefixCompilerDot,
                        tempCPMD,
                    ),
                    pagesDot,
                ),
            ),
        ElectronicSource: () => {
            // The authors, or else the editors, the translators or the compilers, last name first
            const lfAuthor = authorDot || sufixEditorLFDot || sufixTranslatorLFDot || sufixCompilerLFDot;
            const before = [lfAuthor, yearDot, titleDot, publicationTitleDot, editionDot, prefixVolumeDot, mediumDot];
            return join(
                lfAuthor,
                when(yearDot, spaceIf(lfAuthor), yearDot),
                when(titleDot && publicationTitleDot, spaceIf(lfAuthor, yearDot), quoted(titleDot)),
                when(titleDot && !publicationTitleDot, spaceIf(lfAuthor, yearDot), applyItalic(titleDot)),
                when(publicationTitleDot, spaceIf(lfAuthor, yearDot, titleDot), applyItalic(publicationTitleDot)),
                when(editionDot, spaceIf(lfAuthor, yearDot, titleDot, publicationTitleDot), editionDot),
                when(prefixVolumeDot, spaceIf(lfAuthor, yearDot, titleDot, publicationTitleDot, editionDot), prefixVolumeDot),
                when(mediumDot, spaceIf(lfAuthor, yearDot, titleDot, publicationTitleDot, editionDot, prefixVolumeDot), mediumDot),
                when(authorDot && theCPCapLongPrefixEditorDot, spaceIf(...before), theCPCapLongPrefixEditorDot),
                when(theCapLongPrefixTranslatorDot && (authorDot || sufixEditorLFDot), spaceIf(...before), theCapLongPrefixTranslatorDot),
                when(prefixCompilerDot && (authorDot || sufixEditorLFDot || sufixTranslatorLFDot), spaceIf(...before), prefixCompilerDot),
                when(prefixProdDot, spaceIf(...before), prefixProdDot),
                when(tempCPMD, spaceIf(...before, prefixProdDot), tempCPMD),
            );
        },
        ArticleInAPeriodical: () =>
            join(
                theAuthorSufixDot,
                when(periodicalTitle && !theAuthorSufixDot, applyItalic(periodicalTitleDot)),
                when(yearDot, spaceIf(theAuthorSufixDot, periodicalTitle), yearDot),
                when(titleDot, spaceIf(theAuthorSufixDot, periodicalTitle, yearDot), quoted(titleDot)),
                when(periodicalTitle && theAuthorSufixDot, General.Space, applyItalic(tempMDEP ? periodicalTitle : periodicalTitleDot)),
                // The style writes a space before them in every other case, as its other tests all ask for a year, which an
                // entry always has
                when(tempMDEP, theAuthorSufixDot && periodicalTitle ? General.ListSeparator : General.Space, tempMDEP),
            ),
        Film: () =>
            join(
                when(writerDot, writerLFDot),
                when(yearDot, spaceIf(writerLFDot), yearDot),
                when(titleDot, spaceIf(writerDot, yearDot), applyItalic(titleDot)),
                when(mediumDot, spaceIf(writerDot, yearDot, titleDot), mediumDot),
                when(theCapLongPrefixDirectedByDot, spaceIf(writerDot, yearDot, titleDot, mediumDot), theCapLongPrefixDirectedByDot),
                when(
                    theCapLongPrefixProducedByDot,
                    spaceIf(writerDot, yearDot, titleDot, theCapLongPrefixDirectedByDot, mediumDot),
                    theCapLongPrefixProducedByDot,
                ),
                when(
                    theCapLongPrefixPerformedByDot,
                    spaceIf(writerDot, yearDot, titleDot, theCapLongPrefixDirectedByDot, theCapLongPrefixProducedByDot, mediumDot),
                    theCapLongPrefixPerformedByDot,
                ),
                when(
                    distributorDot,
                    spaceIf(
                        writerDot,
                        yearDot,
                        titleDot,
                        theCapLongPrefixDirectedByDot,
                        theCapLongPrefixProducedByDot,
                        theCapLongPrefixPerformedByDot,
                        mediumDot,
                    ),
                    distributorDot,
                ),
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
                when(yearDot, spaceIf(interviewerDot, intervieweeLFDot), yearDot),
                when(
                    interviewTitle,
                    spaceIf(interviewerDot, intervieweeLFDot, yearDot),
                    broadcastTitleDot
                        ? join(intervieweeLFDot ? General.Space : "", quoted(interviewTitleDot))
                        : join(spaceIf(intervieweeLFDot, broadcastTitleDot), applyItalic(interviewTitle)),
                ),
            );
            if (field("Broadcaster")) {
                return join(
                    start,
                    when(
                        broadcastTitleDot,
                        spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle),
                        applyItalic(broadcastTitleDot),
                    ),
                    when(
                        broadcasterDot,
                        spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle, broadcastTitleDot),
                        broadcasterDot,
                    ),
                    when(
                        tempSC,
                        spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle, broadcastTitleDot, broadcasterDot),
                        tempSC,
                    ),
                    when(
                        monthDayDot,
                        spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle, broadcastTitleDot, broadcasterDot, tempSC),
                        monthDayDot,
                    ),
                );
            }
            return join(
                start,
                when(
                    broadcastTitleDot,
                    spaceIf(interviewerDot, intervieweeLFDot, yearDot, interviewTitle),
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
                when(
                    tempCPMDP,
                    spaceIf(
                        interviewerDot,
                        intervieweeLFDot,
                        yearDot,
                        interviewTitle,
                        broadcastTitleDot,
                        theCapLongPrefixTranslatedByDot,
                        theCapLongPrefixEditedByDot,
                    ),
                    tempCPMDP,
                ),
            );
        },
    };

    const entry = entries[source.type]();
    if (tempDAUD) {
        return join(entry, General.Space, tempDAUD);
    }
    // Word's XSLT writes a line break after the entry, which Word reads as a space, when the entry ends with an element,
    // such as a title in italics
    const last = entry[entry.length - 1];
    return last.italics ? join(entry, General.Space) : entry;
};

/**
 * Chicago, the author-date style of the Chicago Manual of Style, as Word writes it: citations such as "(Baker 2010, 50)",
 * and a bibliography of entries such as "Baker, Anna. 2010. *The Art of Pizza.* Naples: Forno Press.", with a dash for
 * the authors of an entry with the same authors as the one before it.
 */
export const chicago: StyleDefinition = {
    name: "Chicago",
    file: "CHICAGO.XSL",
    version: "16",
    citation,
    bibliography: (sources: readonly WordSource[]): FormattedBibliography =>
        bibliographyOf(sources, formatPersonsAuthor, bibliographyEntry),
};
