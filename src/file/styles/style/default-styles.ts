/**
 * Default styles module for WordprocessingML documents.
 *
 * Provides pre-configured style classes for common document elements like headings,
 * hyperlinks, and footnotes.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * @module
 */
import { LineRuleType } from "@file/paragraph";
import { UnderlineType } from "@file/paragraph/run/underline";

import { IBaseCharacterStyleOptions, StyleForCharacter } from "./character-style";
import { IBaseParagraphStyleOptions, IParagraphStyleOptions, StyleForParagraph } from "./paragraph-style";

/**
 * Base class for heading styles.
 *
 * Provides common configuration for heading styles, including basedOn="Normal"
 * and quickFormat enabled.
 *
 * @example
 * ```typescript
 * // Typically extended by specific heading classes
 * new HeadingStyle({
 *   id: "CustomHeading",
 *   name: "Custom Heading",
 *   run: { bold: true, size: 28 }
 * });
 * ```
 */
export class HeadingStyle extends StyleForParagraph {
    public constructor(options: IParagraphStyleOptions) {
        super({
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            ...options,
        });
    }
}

/**
 * Represents the Title paragraph style.
 *
 * Used for document titles with larger font size and emphasis.
 *
 * @example
 * ```typescript
 * new TitleStyle({
 *   run: { size: 56, bold: true }
 * });
 * ```
 */
export class TitleStyle extends HeadingStyle {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "Title",
            name: "Title",
            ...options,
        });
    }
}

/**
 * Represents the Heading 1 paragraph style.
 *
 * First-level heading style for major document sections.
 *
 * @example
 * ```typescript
 * new Heading1Style({
 *   run: { size: 32, color: "2E74B5" }
 * });
 * ```
 */
export class Heading1Style extends HeadingStyle {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "Heading1",
            name: "Heading 1",
            ...options,
        });
    }
}

/**
 * Represents the Heading 2 paragraph style.
 *
 * Second-level heading style for subsections.
 */
export class Heading2Style extends HeadingStyle {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "Heading2",
            name: "Heading 2",
            ...options,
        });
    }
}

/**
 * Represents the Heading 3 paragraph style.
 *
 * Third-level heading style for sub-subsections.
 */
export class Heading3Style extends HeadingStyle {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "Heading3",
            name: "Heading 3",
            ...options,
        });
    }
}

/**
 * Represents the Heading 4 paragraph style.
 *
 * Fourth-level heading style for nested sections.
 */
export class Heading4Style extends HeadingStyle {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "Heading4",
            name: "Heading 4",
            ...options,
        });
    }
}

/**
 * Represents the Heading 5 paragraph style.
 *
 * Fifth-level heading style for deeply nested sections.
 */
export class Heading5Style extends HeadingStyle {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "Heading5",
            name: "Heading 5",
            ...options,
        });
    }
}

/**
 * Represents the Heading 6 paragraph style.
 *
 * Sixth-level heading style for the deepest nested sections.
 */
export class Heading6Style extends HeadingStyle {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "Heading6",
            name: "Heading 6",
            ...options,
        });
    }
}

/**
 * Represents the Strong paragraph style.
 *
 * Used for emphasizing important paragraphs with bold formatting.
 */
export class StrongStyle extends HeadingStyle {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "Strong",
            name: "Strong",
            ...options,
        });
    }
}

/**
 * Represents the List Paragraph style.
 *
 * Used for paragraphs within numbered or bulleted lists.
 */
export class ListParagraph extends StyleForParagraph {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "ListParagraph",
            name: "List Paragraph",
            basedOn: "Normal",
            quickFormat: true,
            ...options,
        });
    }
}

/**
 * Represents the Footnote Text paragraph style.
 *
 * Used for the text content of footnotes with smaller font size and tighter spacing.
 */
export class FootnoteText extends StyleForParagraph {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "FootnoteText",
            name: "footnote text",
            link: "FootnoteTextChar",
            basedOn: "Normal",
            uiPriority: 99,
            semiHidden: true,
            unhideWhenUsed: true,
            paragraph: {
                spacing: {
                    after: 0,
                    line: 240,
                    lineRule: LineRuleType.AUTO,
                },
            },
            run: {
                size: 20,
            },
            ...options,
        });
    }
}

/**
 * Represents the Footnote Reference character style.
 *
 * Used for footnote reference numbers in the main text, displayed as superscript.
 */
export class FootnoteReferenceStyle extends StyleForCharacter {
    public constructor(options: IBaseCharacterStyleOptions) {
        super({
            id: "FootnoteReference",
            name: "footnote reference",
            basedOn: "DefaultParagraphFont",
            semiHidden: true,
            run: {
                superScript: true,
            },
            ...options,
        });
    }
}

/**
 * Represents the Footnote Text Char character style.
 *
 * Character style linked to FootnoteText paragraph style for consistent formatting.
 */
export class FootnoteTextChar extends StyleForCharacter {
    public constructor(options: IBaseCharacterStyleOptions) {
        super({
            id: "FootnoteTextChar",
            name: "Footnote Text Char",
            basedOn: "DefaultParagraphFont",
            link: "FootnoteText",
            semiHidden: true,
            run: {
                size: 20,
            },
            ...options,
        });
    }
}

/**
 * Represents the Endnote Text paragraph style.
 *
 * Used for the text content of endnotes with smaller font size and tighter spacing.
 */
export class EndnoteText extends StyleForParagraph {
    public constructor(options: IBaseParagraphStyleOptions) {
        super({
            id: "EndnoteText",
            name: "endnote text",
            link: "EndnoteTextChar",
            basedOn: "Normal",
            uiPriority: 99,
            semiHidden: true,
            unhideWhenUsed: true,
            paragraph: {
                spacing: {
                    after: 0,
                    line: 240,
                    lineRule: LineRuleType.AUTO,
                },
            },
            run: {
                size: 20,
            },
            ...options,
        });
    }
}

/**
 * Represents the Endnote Reference character style.
 *
 * Used for endnote reference numbers in the main text, displayed as superscript.
 */
export class EndnoteReferenceStyle extends StyleForCharacter {
    public constructor(options: IBaseCharacterStyleOptions) {
        super({
            id: "EndnoteReference",
            name: "endnote reference",
            basedOn: "DefaultParagraphFont",
            semiHidden: true,
            run: {
                superScript: true,
            },
            ...options,
        });
    }
}

/**
 * Represents the Endnote Text Char character style.
 *
 * Character style linked to EndnoteText paragraph style for consistent formatting.
 */
export class EndnoteTextChar extends StyleForCharacter {
    public constructor(options: IBaseCharacterStyleOptions) {
        super({
            id: "EndnoteTextChar",
            name: "Endnote Text Char",
            basedOn: "DefaultParagraphFont",
            link: "EndnoteText",
            semiHidden: true,
            run: {
                size: 20,
            },
            ...options,
        });
    }
}

/**
 * Represents the Hyperlink character style.
 *
 * Used for hyperlinks with blue color and single underline formatting.
 */
export class HyperlinkStyle extends StyleForCharacter {
    public constructor(options: IBaseCharacterStyleOptions) {
        super({
            id: "Hyperlink",
            name: "Hyperlink",
            basedOn: "DefaultParagraphFont",
            run: {
                color: "0563C1",
                underline: {
                    type: UnderlineType.SINGLE,
                },
            },
            ...options,
        });
    }
}
