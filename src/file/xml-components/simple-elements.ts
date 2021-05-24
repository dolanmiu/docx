import { Attributes, XmlComponent } from "file/xml-components";

import { hpsMeasureValue } from "../values";

// This represents element type CT_OnOff, which indicate a boolean value.
//
// <xsd:complexType name="CT_OnOff">
//     <xsd:attribute name="val" type="s:ST_OnOff"/>
// </xsd:complexType>
export class OnOffElement extends XmlComponent {
    constructor(name: string, val: boolean | undefined = true) {
        super(name);
        this.root.push(new Attributes({ val }));
    }
}

// This represents element type CT_HpsMeasure, which indicate an unsigned int or a measurement with unit.
//
// <xsd:complexType name="CT_HpsMeasure">
//     <xsd:attribute name="val" type="ST_HpsMeasure" use="required"/>
// </xsd:complexType>
export class HpsMeasureElement extends XmlComponent {
    constructor(name: string, val: number | string) {
        super(name);
        this.root.push(new Attributes({ val: hpsMeasureValue(val) }));
    }
}
