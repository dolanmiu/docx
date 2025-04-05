// https://www.datypic.com/sc/ooxml/e-m_pos-1.html
import { Attributes, XmlComponent } from "@file/xml-components";

export class MathBarPos extends XmlComponent {
    // TODO: Use correct types rather than any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public constructor(attributes: any) {
        super("m:pos");
        this.root.push(new Attributes(attributes));
    }
}
