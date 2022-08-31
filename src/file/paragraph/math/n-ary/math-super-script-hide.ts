// http://www.datypic.com/sc/ooxml/e-m_subHide-1.html
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

class MathSuperScriptHideAttributes extends XmlAttributeComponent<{ readonly hide: number }> {
    protected readonly xmlKeys = { hide: "m:val" };
}

export class MathSuperScriptHide extends XmlComponent {
    public constructor() {
        super("m:supHide");

        this.root.push(new MathSuperScriptHideAttributes({ hide: 1 }));
    }
}
