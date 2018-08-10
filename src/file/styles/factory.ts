import { DocumentAttributes } from "../document/document-attributes";
import { Color, Italics, Size } from "../paragraph/run/formatting";
import { Styles } from "./";

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
    public newInstance(): Styles {
        const documentAttributes = new DocumentAttributes({
            mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
            r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            w15: "http://schemas.microsoft.com/office/word/2012/wordml",
            Ignorable: "w14 w15",
        });
        const styles = new Styles(documentAttributes);
        styles.createDocumentDefaults();

        const titleStyle = new TitleStyle();
        titleStyle.addRunProperty(new Size(56));
        styles.push(titleStyle);

        const heading1Style = new Heading1Style();
        heading1Style.addRunProperty(new Color("2E74B5"));
        heading1Style.addRunProperty(new Size(32));
        styles.push(heading1Style);

        const heading2Style = new Heading2Style();
        heading2Style.addRunProperty(new Color("2E74B5"));
        heading2Style.addRunProperty(new Size(26));
        styles.push(heading2Style);

        const heading3Style = new Heading3Style();
        heading3Style.addRunProperty(new Color("1F4D78"));
        heading3Style.addRunProperty(new Size(24));
        styles.push(heading3Style);

        const heading4Style = new Heading4Style();
        heading4Style.addRunProperty(new Color("2E74B5"));
        heading4Style.addRunProperty(new Italics());
        styles.push(heading4Style);

        const heading5Style = new Heading5Style();
        heading5Style.addRunProperty(new Color("2E74B5"));
        styles.push(heading5Style);

        const heading6Style = new Heading6Style();
        heading6Style.addRunProperty(new Color("1F4D78"));
        styles.push(heading6Style);

        const listParagraph = new ListParagraph();
        // listParagraph.addParagraphProperty();
        styles.push(listParagraph);

        const hyperLinkStyle = new HyperlinkStyle();
        styles.push(hyperLinkStyle);

        const footnoteReferenceStyle = new FootnoteReferenceStyle();
        styles.push(footnoteReferenceStyle);

        const footnoteTextStyle = new FootnoteText();
        styles.push(footnoteTextStyle);

        const footnoteTextCharStyle = new FootnoteTextChar();
        styles.push(footnoteTextCharStyle);

        return styles;
    }
}
