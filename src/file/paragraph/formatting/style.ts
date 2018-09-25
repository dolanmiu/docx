import { Attributes, XmlComponent } from "file/xml-components";

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
