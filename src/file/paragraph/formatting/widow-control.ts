// http://www.datypic.com/sc/ooxml/e-w_widowControl-1.html
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class WidowControlAttributes extends XmlAttributeComponent<{ readonly val: boolean }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class WidowControl extends XmlComponent {
    constructor(value: boolean) {
        super("w:widowControl");
        this.root.push(new WidowControlAttributes({ val: value }));
    }
}
