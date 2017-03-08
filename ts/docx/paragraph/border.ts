import { Attributes, XmlComponent } from "../xml-components";

class Border extends XmlComponent {

    constructor() {
        super("w:bottom");
        this.root.push(new Attributes({
            color: "auto",
            space: "1",
            val: "single",
            sz: "6",
        }));
    }
}

export class ThematicBreak extends XmlComponent {

    constructor() {
        super("w:pBdr");
        this.root.push(new Border());
    }
}
