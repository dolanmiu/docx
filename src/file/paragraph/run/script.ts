import { Attributes, XmlComponent } from "file/xml-components";

export abstract class VerticalAlign extends XmlComponent {
    constructor(type: string) {
        super("w:vertAlign");
        this.root.push(
            new Attributes({
                val: type,
            }),
        );
    }
}

export class SuperScript extends VerticalAlign {
    constructor() {
        super("superscript");
    }
}

export class SubScript extends VerticalAlign {
    constructor() {
        super("subscript");
    }
}
