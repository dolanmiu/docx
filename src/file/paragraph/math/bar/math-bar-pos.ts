// https://www.datypic.com/sc/ooxml/e-m_pos-1.html
import { Attributes, XmlComponent } from "@file/xml-components";

export class MathBarPos extends XmlComponent {
    public constructor(attributes: any) {
        super("m:pos");
        this.root.push(new Attributes(attributes));

    }
}