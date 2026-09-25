/**
 * Factory module for creating default document styles.
 *
 * Provides a factory class that creates pre-configured styles for common document elements.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * @module
 */
import type { XmlComponent } from "@file/xml-components";

import { DocumentDefaults, type IDocumentDefaultsOptions } from "./defaults";
import {
    EndnoteReferenceStyle,
    EndnoteText,
    EndnoteTextChar,
    FootnoteReferenceStyle,
    FootnoteText,
    FootnoteTextChar,
    Heading1Style,
    Heading2Style,
    Heading3Style,
    Heading4Style,
    Heading5Style,
    Heading6Style,
    HyperlinkStyle,
    type IBaseCharacterStyleOptions,
    type IBaseParagraphStyleOptions,
    ListParagraph,
    StrongStyle,
    TitleStyle,
} from "./style";
import type { IStylesOptions } from "./styles";
import { DocumentAttributes } from "../document/document-attributes";

/**
 * Options for configuring default document styles.
 *
 * Allows customization of built-in styles for common document elements.
 *
 * @property document - Document-wide default formatting
 * @property title - Title paragraph style options
 * @property heading1 - Heading 1 paragraph style options
 * @property heading2 - Heading 2 paragraph style options
 * @property heading3 - Heading 3 paragraph style options
 * @property heading4 - Heading 4 paragraph style options
 * @property heading5 - Heading 5 paragraph style options
 * @property heading6 - Heading 6 paragraph style options
 * @property strong - Strong paragraph style options
 * @property listParagraph - List paragraph style options
 * @property hyperlink - Hyperlink character style options
 * @property footnoteReference - Footnote reference character style options
 * @property footnoteText - Footnote text paragraph style options
 * @property footnoteTextChar - Footnote text character style options
 */
export type IDefaultStylesOptions = {
    /** Document-wide default formatting */
    readonly document?: IDocumentDefaultsOptions;
    /** Title paragraph style options */
    readonly title?: IBaseParagraphStyleOptions;
    /** Heading 1 paragraph style options */
    readonly heading1?: IBaseParagraphStyleOptions;
    /** Heading 2 paragraph style options */
    readonly heading2?: IBaseParagraphStyleOptions;
    /** Heading 3 paragraph style options */
    readonly heading3?: IBaseParagraphStyleOptions;
    /** Heading 4 paragraph style options */
    readonly heading4?: IBaseParagraphStyleOptions;
    /** Heading 5 paragraph style options */
    readonly heading5?: IBaseParagraphStyleOptions;
    /** Heading 6 paragraph style options */
    readonly heading6?: IBaseParagraphStyleOptions;
    /** Strong paragraph style options */
    readonly strong?: IBaseParagraphStyleOptions;
    /** List paragraph style options */
    readonly listParagraph?: IBaseParagraphStyleOptions;
    /** Hyperlink character style options */
    readonly hyperlink?: IBaseCharacterStyleOptions;
    /** Footnote reference character style options */
    readonly footnoteReference?: IBaseCharacterStyleOptions;
    /** Footnote text paragraph style options */
    readonly footnoteText?: IBaseParagraphStyleOptions;
    /** Footnote text character style options */
    readonly footnoteTextChar?: IBaseCharacterStyleOptions;
    readonly endnoteReference?: IBaseCharacterStyleOptions;
    readonly endnoteText?: IBaseParagraphStyleOptions;
    readonly endnoteTextChar?: IBaseCharacterStyleOptions;
};

/**
 * docx's default styles, each under the option of `styles.default` that configures it.
 *
 * @internal
 */
export const createDefaultStyles = (
    options: IDefaultStylesOptions = {},
): { readonly [Key in keyof IDefaultStylesOptions]-?: XmlComponent } => ({
    document: new DocumentDefaults(options.document ?? {}),
    title: new TitleStyle({
        run: {
            size: 56,
        },
        ...options.title,
    }),
    heading1: new Heading1Style({
        run: {
            color: "2E74B5",
            size: 32,
        },
        ...options.heading1,
    }),
    heading2: new Heading2Style({
        run: {
            color: "2E74B5",
            size: 26,
        },
        ...options.heading2,
    }),
    heading3: new Heading3Style({
        run: {
            color: "1F4D78",
            size: 24,
        },
        ...options.heading3,
    }),
    heading4: new Heading4Style({
        run: {
            color: "2E74B5",
            italics: true,
        },
        ...options.heading4,
    }),
    heading5: new Heading5Style({
        run: {
            color: "2E74B5",
        },
        ...options.heading5,
    }),
    heading6: new Heading6Style({
        run: {
            color: "1F4D78",
        },
        ...options.heading6,
    }),
    strong: new StrongStyle({
        run: {
            bold: true,
        },
        ...options.strong,
    }),
    listParagraph: new ListParagraph(options.listParagraph || {}),
    hyperlink: new HyperlinkStyle(options.hyperlink || {}),
    footnoteReference: new FootnoteReferenceStyle(options.footnoteReference || {}),
    footnoteText: new FootnoteText(options.footnoteText || {}),
    footnoteTextChar: new FootnoteTextChar(options.footnoteTextChar || {}),
    endnoteReference: new EndnoteReferenceStyle(options.endnoteReference || {}),
    endnoteText: new EndnoteText(options.endnoteText || {}),
    endnoteTextChar: new EndnoteTextChar(options.endnoteTextChar || {}),
});

/**
 * Factory for creating default document styles.
 *
 * This factory creates a complete set of default styles for common document elements
 * such as headings, hyperlinks, and footnotes with sensible default formatting.
 *
 * @example
 * ```typescript
 * // Create default styles with custom heading colors
 * const factory = new DefaultStylesFactory();
 * const styles = factory.newInstance({
 *   heading1: {
 *     run: { color: "FF0000", size: 32 }
 *   },
 *   heading2: {
 *     run: { color: "00FF00", size: 26 }
 *   }
 * });
 * ```
 */
export class DefaultStylesFactory {
    public newInstance(options: IDefaultStylesOptions = {}): IStylesOptions {
        const documentAttributes = new DocumentAttributes(["mc", "r", "w", "w14", "w15"], "w14 w15");
        return {
            initialStyles: documentAttributes,
            importedStyles: Object.values(createDefaultStyles(options)),
        };
    }
}
