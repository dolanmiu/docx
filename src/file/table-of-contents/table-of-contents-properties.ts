export class StyleLevel {
    public styleName: string;
    public level: number;

    constructor(styleName: string, level: number) {
        this.styleName = styleName;
        this.level = level;
    }
}

/**
 * Options according to this docs:
 * https://www.ecma-international.org/publications/standards/Ecma-376.htm
 * Part 1 - Page 1251
 *
 * Short Guide:
 * http://officeopenxml.com/WPtableOfContents.php
 */
export interface ITableOfContentsOptions {
    /**
     * \a option - Includes captioned items, but omits caption labels and numbers.
     * The identifier designated by text in this switch's field-argument corresponds to the caption label.
     * Use captionLabelIncludingNumbers (\c) to build a table of captions with labels and numbers.
     */
    captionLabel?: string;

    /**
     * \b option - Includes entries only from the portion of the document marked by
     * the bookmark named by text in this switch's field-argument.
     */
    entriesFromBookmark?: string;

    /**
     * \c option -  Includes figures, tables, charts, and other items that are numbered
     * by a SEQ field (§17.16.5.56). The sequence identifier designated by text in this switch's
     * field-argument, which corresponds to the caption label, shall match the identifier in the
     * corresponding SEQ field.
     */
    captionLabelIncludingNumbers?: string;

    /**
     * \d option - When used with \s, the text in this switch's field-argument defines
     * the separator between sequence and page numbers. The default separator is a hyphen (-).
     */
    sequenceAndPageNumbersSeparator?: string;

    /**
     * \f option - Includes only those TC fields whose identifier exactly matches the
     * text in this switch's field-argument (which is typically a letter).
     */
    tcFieldIdentifier?: string;

    /**
     * \h option - Makes the table of contents entries hyperlinks.
     */
    hyperlink?: boolean;

    /**
     * \l option - Includes TC fields that assign entries to one of the levels specified
     * by text in this switch's field-argument as a range having the form startLevel-endLevel,
     * where startLevel and endLevel are integers, and startLevel has a value equal-to or less-than endLevel.
     * TC fields that assign entries to lower levels are skipped.
     */
    tcFieldLevelRange?: string;

    /**
     * \n option - Without field-argument, omits page numbers from the table of contents.
     * Page numbers are omitted from all levels unless a range of entry levels is specified by
     * text in this switch's field-argument. A range is specified as for \l.
     */
    pageNumbersEntryLevelsRange?: string;

    /**
     * \o option -  Uses paragraphs formatted with all or the specified range of builtin
     * heading styles. Headings in a style range are specified by text in this switch's
     * field-argument using the notation specified as for \l, where each integer corresponds
     * to the style with a style ID of HeadingX (e.g. 1 corresponds to Heading1).
     * If no heading range is specified, all heading levels used in the document are listed.
     */
    headingStyleRange?: string;

    /**
     * \p option - Text in this switch's field-argument specifies a sequence of characters
     * that separate an entry and its page number. The default is a tab with leader dots.
     */
    entryAndPageNumberSeparator?: string;

    /**
     * \s option - For entries numbered with a SEQ field (§17.16.5.56), adds a prefix to the page number.
     * The prefix depends on the type of entry. text in this switch's field-argument shall match the
     * identifier in the SEQ field.
     */
    seqFieldIdentifierForPrefix?: string;

    /**
     * \t field-argument Uses paragraphs formatted with styles other than the built-in heading styles.
     * Text in this switch's field-argument specifies those styles as a set of comma-separated doublets,
     * with each doublet being a comma-separated set of style name and table of content level.
     * \t can be combined with \o.
     */
    stylesWithLevels?: StyleLevel[];

    /**
     * \u Uses the applied paragraph outline level.
     */
    useAppliedParagraphOutlineLevel?: boolean;

    /**
     * \w Preserves tab entries within table entries.
     */
    preserveTabInEntries?: boolean;

    /**
     * \x Preserves newline characters within table entries.
     */
    preserveNewLineInEntries?: boolean;

    /**
     * \z Hides tab leader and page numbers in web page view (§17.18.102).
     */
    hideTabAndPageNumbersInWebView?: boolean;
}
