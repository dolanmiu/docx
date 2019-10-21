import { Attributes, XmlComponent } from "file/xml-components";

export class TableStyle extends XmlComponent {
    public readonly styleId: string;

    constructor(styleId: string) {
        super("w:tblStyle");
        this.styleId = styleId;
        this.root.push(
            new Attributes({
                val: styleId,
            }),
        );
    }
}
