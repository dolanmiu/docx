import { Attributes, XmlComponent } from "file/xml-components";

export class TableStyle extends XmlComponent {
    constructor(styleId: string) {
        super("w:tblStyle");

        this.root.push(
            new Attributes({
                val: styleId,
            }),
        );
    }
}
