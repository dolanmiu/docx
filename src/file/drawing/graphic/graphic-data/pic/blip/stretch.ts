import { XmlComponent } from "file/xml-components";

class FillRectangle extends XmlComponent {
    constructor() {
        super("a:fillRect");
    }
}

export class Stretch extends XmlComponent {
    constructor() {
        super("a:stretch");
        this.root.push(new FillRectangle());
    }
}
