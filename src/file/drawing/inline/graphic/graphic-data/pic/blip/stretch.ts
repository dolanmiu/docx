import { XmlComponent } from "@file/xml-components";

class FillRectangle extends XmlComponent {
    public constructor() {
        super("a:fillRect");
    }
}

export class Stretch extends XmlComponent {
    public constructor() {
        super("a:stretch");
        this.root.push(new FillRectangle());
    }
}
