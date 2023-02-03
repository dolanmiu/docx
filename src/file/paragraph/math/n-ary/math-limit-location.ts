// http://www.datypic.com/sc/ooxml/e-m_limLoc-1.html
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

class MathLimitLocationAttributes extends XmlAttributeComponent<{ readonly value: string }> {
    protected readonly xmlKeys = { value: "m:val" };
}

export class MathLimitLocation extends XmlComponent {
    public constructor() {
        super("m:limLoc");

        this.root.push(new MathLimitLocationAttributes({ value: "undOvr" }));
    }
}
