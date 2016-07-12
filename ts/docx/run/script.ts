import {XmlComponent, Attributes} from "../xml-components";

abstract class VerticalAlign extends XmlComponent {

    constructor(type: string) {
        super("w:vertAlign");
        this.root.push(new Attributes({
            val: "superscript"
        }));
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