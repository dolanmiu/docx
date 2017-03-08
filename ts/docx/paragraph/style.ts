import { Attributes, XmlComponent } from "../xml-components";

export class Style extends XmlComponent {

    constructor(type: string) {
        super("w:pStyle");
        this.root.push(new Attributes({
            val: type,
        }));
    }
}
