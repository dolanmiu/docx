import { XmlAttributeComponent, XmlComponent } from "../xml-components";

class StyleAttributes extends XmlAttributeComponent<{val: string}> {
    protected xmlKeys = {val: "w:val"};
}

export class Style extends XmlComponent {

    constructor(styleId: string) {
        super("w:rStyle");
        this.root.push(new StyleAttributes({val: styleId}));
    }
}
