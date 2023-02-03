// http://www.datypic.com/sc/ooxml/e-m_begChr-1.html
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

class MathBeginningCharacterAttributes extends XmlAttributeComponent<{ readonly character: string }> {
    protected readonly xmlKeys = { character: "m:val" };
}

export class MathBeginningCharacter extends XmlComponent {
    public constructor(character: string) {
        super("m:begChr");

        this.root.push(new MathBeginningCharacterAttributes({ character }));
    }
}
