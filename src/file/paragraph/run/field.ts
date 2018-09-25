import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

class FidCharAttrs extends XmlAttributeComponent<{ type: "begin" | "end" | "separate"; dirty?: boolean }> {
    protected xmlKeys = { type: "w:fldCharType", dirty: "w:dirty" };
}

export class Begin extends XmlComponent {
    constructor(dirty?: boolean) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: "begin", dirty }));
    }
}

export class Separate extends XmlComponent {
    constructor(dirty?: boolean) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: "separate", dirty }));
    }
}

export class End extends XmlComponent {
    constructor(dirty?: boolean) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: "end", dirty }));
    }
}
