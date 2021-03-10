import { DocumentAttributes } from "../document/document-attributes";
import { IStylesOptions } from "./styles";

import { DocumentDefaults, IDocumentDefaultsOptions } from "./defaults";
import {
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
    IBaseCharacterStyleOptions,
    IBaseParagraphStyleOptions,
    ListParagraph,
    StrongStyle,
    TitleStyle,
} from "./style";

export interface IDefaultStylesOptions {
    readonly document?: IDocumentDefaultsOptions;
    readonly title?: IBaseParagraphStyleOptions;
    readonly heading1?: IBaseParagraphStyleOptions;
    readonly heading2?: IBaseParagraphStyleOptions;
    readonly heading3?: IBaseParagraphStyleOptions;
    readonly heading4?: IBaseParagraphStyleOptions;
    readonly heading5?: IBaseParagraphStyleOptions;
    readonly heading6?: IBaseParagraphStyleOptions;
    readonly strong?: IBaseParagraphStyleOptions;
    readonly listParagraph?: IBaseParagraphStyleOptions;
    readonly hyperlink?: IBaseCharacterStyleOptions;
    readonly footnoteReference?: IBaseCharacterStyleOptions;
    readonly footnoteText?: IBaseParagraphStyleOptions;
    readonly footnoteTextChar?: IBaseCharacterStyleOptions;
}

export class DefaultStylesFactory {
    public newInstance(options: IDefaultStylesOptions = {}): IStylesOptions {
        const documentAttributes = new DocumentAttributes({
            mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
            r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            w15: "http://schemas.microsoft.com/office/word/2012/wordml",
            Ignorable: "w14 w15",
        });
        return {
            initialStyles: documentAttributes,
            importedStyles: [
                new DocumentDefaults(options.document ?? {}),
                new TitleStyle({
                    run: {
                        size: 56,
                    },
                    ...options.title,
                }),
                new Heading1Style({
                    run: {
                        color: "2E74B5",
                        size: 32,
                    },
                    ...options.heading1,
                }),
                new Heading2Style({
                    run: {
                        color: "2E74B5",
                        size: 26,
                    },
                    ...options.heading2,
                }),
                new Heading3Style({
                    run: {
                        color: "1F4D78",
                        size: 24,
                    },
                    ...options.heading3,
                }),
                new Heading4Style({
                    run: {
                        color: "2E74B5",
                        italics: true,
                    },
                    ...options.heading4,
                }),
                new Heading5Style({
                    run: {
                        color: "2E74B5",
                    },
                    ...options.heading5,
                }),
                new Heading6Style({
                    run: {
                        color: "1F4D78",
                    },
                    ...options.heading6,
                }),
                new StrongStyle({
                    run: {
                        bold: true,
                    },
                    ...options.strong,
                }),
                new ListParagraph(options.listParagraph || {}),
                new HyperlinkStyle(options.hyperlink || {}),
                new FootnoteReferenceStyle(options.footnoteReference || {}),
                new FootnoteText(options.footnoteText || {}),
                new FootnoteTextChar(options.footnoteTextChar || {}),
            ],
        };
    }
}
