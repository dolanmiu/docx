// This represents element type CT_SdtCheckboxSymbol element
// <xsd:complexType name="CT_SdtCheckboxSymbol">
//   <xsd:attribute name="font" type="w:ST_String"/>
//    <xsd:attribute name="val" type="w:ST_ShortHexNumber"/>
// </xsd:complexType>

import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { shortHexNumber } from "@util/values";

class CheckboxSymbolAttributes extends XmlAttributeComponent<{
    readonly val?: string | number | boolean;
    readonly symbolfont?: string;
}> {
    protected readonly xmlKeys = {
        val: "w14:val",
        symbolfont: "w14:font",
    };
}

export class CheckBoxSymbolElement extends XmlComponent {
    public constructor(name: string, val: string, font?: string) {
        super(name);
        if (font) {
            this.root.push(new CheckboxSymbolAttributes({ val: shortHexNumber(val), symbolfont: font }));
        } else {
            this.root.push(new CheckboxSymbolAttributes({ val }));
        }
    }
}
