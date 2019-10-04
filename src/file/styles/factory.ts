import { DocumentAttributes } from "../document/document-attributes";
import { IStylesOptions } from "./styles";

import { DocumentDefaults } from "./defaults";
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
    ListParagraph,
    TitleStyle,
} from "./style";

export class DefaultStylesFactory {
    public newInstance(): IStylesOptions {
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
                new DocumentDefaults(),
                new TitleStyle({
                    run: {
                        size: 56,
                    },
                }),
                new Heading1Style({
                    run: {
                        color: "2E74B5",
                        size: 32,
                    },
                }),
                new Heading2Style({
                    run: {
                        color: "2E74B5",
                        size: 26,
                    },
                }),
                new Heading3Style({
                    run: {
                        color: "1F4D78",
                        size: 24,
                    },
                }),
                new Heading4Style({
                    run: {
                        color: "2E74B5",
                        italics: true,
                    },
                }),
                new Heading5Style({
                    run: {
                        color: "2E74B5",
                    },
                }),
                new Heading6Style({
                    run: {
                        color: "1F4D78",
                    },
                }),
                new ListParagraph({}),
                new HyperlinkStyle({}),
                new FootnoteReferenceStyle({}),
                new FootnoteText({}),
                new FootnoteTextChar({}),
            ],
        };
    }
}
