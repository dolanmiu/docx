import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

class TextAttributes extends XmlAttributeComponent<{ space: "default" | "preserve" }> {
    protected xmlKeys = { space: "xml:space" };
}

export class Page extends XmlComponent {
    constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: "preserve" }));
        this.root.push("PAGE");
    }
}
