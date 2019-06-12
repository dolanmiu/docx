import { Attributes, XmlComponent } from "file/xml-components";

export enum HeadingLevel {
    HEADING_1 = "Heading1",
    HEADING_2 = "Heading2",
    HEADING_3 = "Heading3",
    HEADING_4 = "Heading4",
    HEADING_5 = "Heading5",
    HEADING_6 = "Heading6",
    TITLE = "Title",
}

export class Style extends XmlComponent {
    public readonly styleId: string;

    constructor(styleId: string) {
        super("w:pStyle");
        this.styleId = styleId;
        this.root.push(
            new Attributes({
                val: styleId,
            }),
        );
    }
}
