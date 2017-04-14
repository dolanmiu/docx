import { XmlAttributeComponent, XmlComponent } from "../../xml-components";

class TextAttributes extends XmlAttributeComponent<{space: "default" | "preserve"}> {
    protected xmlKeys = {space: "xml:space"};
}

export class Text extends XmlComponent {
    constructor(text: string) {
        super("w:t");
        this.root.push(new TextAttributes({space: "preserve"}));
        if (text) {
            this.root.push(text);
        }
    }
}
