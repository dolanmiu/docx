import { Attributes, XmlComponent } from "file/xml-components";

export class Style extends XmlComponent {
    constructor(type: string) {
        super("w:pStyle");
        this.root.push(
            new Attributes({
                val: type,
            }),
        );
    }
}
