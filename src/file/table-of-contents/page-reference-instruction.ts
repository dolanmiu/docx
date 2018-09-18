import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

class TextAttributes extends XmlAttributeComponent<{ space: "default" | "preserve" }> {
    protected xmlKeys = { space: "xml:space" };
}

export class PageReferenceInstruction extends XmlComponent {
    constructor(bookmarkId: string) {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: "preserve" }));
        this.root.push(`PAGEREF ${bookmarkId} \h`);
    }
}
