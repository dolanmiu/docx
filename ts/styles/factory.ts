import { Color, Italics, Size } from "../docx/run/formatting";

import { Styles } from "./";
import { DocumentDefaults } from "./defaults";
import {
    Heading1Style, Heading2Style, Heading3Style, Heading4Style, Heading5Style, Heading6Style,
    ListParagraph, TitleStyle,
} from "./style";

export class DefaultStylesFactory {

    public newInstance(): Styles {
        const styles = new Styles();
        styles.push(new DocumentDefaults());

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

        return styles;
    }
}
