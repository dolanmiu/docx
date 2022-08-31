// http://www.datypic.com/sc/ooxml/e-m_endChr-1.html
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

class MathEndingCharacterAttributes extends XmlAttributeComponent<{ readonly character: string }> {
    protected readonly xmlKeys = { character: "m:val" };
}

export class MathEndingCharacter extends XmlComponent {
    public constructor(character: string) {
        super("m:endChr");

        this.root.push(new MathEndingCharacterAttributes({ character }));
    }
}
