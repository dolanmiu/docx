export declare class StyleLevel {
    readonly styleName: string;
    readonly level: number;
    constructor(styleName: string, level: number);
}
export interface ITableOfContentsOptions {
    readonly captionLabel?: string;
    readonly entriesFromBookmark?: string;
    readonly captionLabelIncludingNumbers?: string;
    readonly sequenceAndPageNumbersSeparator?: string;
    readonly tcFieldIdentifier?: string;
    readonly hyperlink?: boolean;
    readonly tcFieldLevelRange?: string;
    readonly pageNumbersEntryLevelsRange?: string;
    readonly headingStyleRange?: string;
    readonly entryAndPageNumberSeparator?: string;
    readonly seqFieldIdentifierForPrefix?: string;
    readonly stylesWithLevels?: StyleLevel[];
    readonly useAppliedParagraphOutlineLevel?: boolean;
    readonly preserveTabInEntries?: boolean;
    readonly preserveNewLineInEntries?: boolean;
    readonly hideTabAndPageNumbersInWebView?: boolean;
}
