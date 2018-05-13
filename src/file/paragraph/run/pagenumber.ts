import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

class fidCharAttrs extends XmlAttributeComponent<{ type: "begin" | "end" | "separate" }> {
    protected xmlKeys = { type: "w:fldCharType" };
}

class TextAttributes extends XmlAttributeComponent<{ space: "default" | "preserve" }> {
    protected xmlKeys = { space: "xml:space" };
}

export class Begin extends XmlComponent {
    constructor() {
        super("w:fldChar");
        this.root.push(new fidCharAttrs({ type: "begin" }));
    }
}

export class Page extends XmlComponent {
    constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: "preserve" }));
        this.root.push("PAGE");
    }
}

export class Separate extends XmlComponent {
    constructor() {
        super("w:fldChar");
        this.root.push(new fidCharAttrs({ type: "separate" }));
    }
}

export class End extends XmlComponent {
    constructor() {
        super("w:fldChar");
        this.root.push(new fidCharAttrs({ type: "end" }));
    }
}