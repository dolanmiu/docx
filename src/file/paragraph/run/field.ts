import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

class FidCharAttrs extends XmlAttributeComponent<{ type: "begin" | "end" | "separate" }> {
    protected xmlKeys = { type: "w:fldCharType" };
}

export class Begin extends XmlComponent {
    constructor() {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: "begin" }));
    }
}

export class Separate extends XmlComponent {
    constructor() {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: "separate" }));
    }
}

export class End extends XmlComponent {
    constructor() {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: "end" }));
    }
}
