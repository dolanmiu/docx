import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

class StyleAttributes extends XmlAttributeComponent<{ readonly val: string }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class Style extends XmlComponent {
    constructor(styleId: string) {
        super("w:rStyle");
        this.root.push(new StyleAttributes({ val: styleId }));
    }
}
