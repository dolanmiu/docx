// http://www.datypic.com/sc/ooxml/e-m_degHide-1.html
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

class MathDegreeHideAttributes extends XmlAttributeComponent<{ readonly hide: number }> {
    protected readonly xmlKeys = { hide: "m:val" };
}

export class MathDegreeHide extends XmlComponent {
    public constructor() {
        super("m:degHide");

        this.root.push(new MathDegreeHideAttributes({ hide: 1 }));
    }
}
