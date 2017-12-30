import { Attributes, XmlComponent } from "file/xml-components";

export class Columns extends XmlComponent {

    constructor() {
        super("w:cols");
        this.root.push(new Attributes({
            space: "708",
        }));
    }
}
