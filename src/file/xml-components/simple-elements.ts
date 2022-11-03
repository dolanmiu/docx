import { Attributes, XmlComponent } from "@file/xml-components";

import { hpsMeasureValue } from "@util/values";

// This represents element type CT_OnOff, which indicate a boolean value.
//
// A value of 1 or true specifies that the property shall be explicitly applied.
// This is the default value for this attribute, and is implied when the parent
// element is present, but  this attribute is omitted.
// A value of 0 or false specifies that the property shall be explicitly turned off.
//
// <xsd:complexType name="CT_OnOff">
//     <xsd:attribute name="val" type="s:ST_OnOff"/>
// </xsd:complexType>
export class OnOffElement extends XmlComponent {
    public constructor(name: string, val: boolean | undefined = true) {
        super(name);
        if (val !== true) {
            this.root.push(new Attributes({ val }));
        }
    }
}

// This represents element type CT_HpsMeasure, which indicate an unsigned int or a measurement with unit.
//
// <xsd:complexType name="CT_HpsMeasure">
//     <xsd:attribute name="val" type="ST_HpsMeasure" use="required"/>
// </xsd:complexType>
export class HpsMeasureElement extends XmlComponent {
    public constructor(name: string, val: number | string) {
        super(name);
        this.root.push(new Attributes({ val: hpsMeasureValue(val) }));
    }
}

// This represents element type CT_String, which indicate a string value.
//
// <xsd:complexType name="CT_String">
//     <xsd:attribute name="val" type="s:ST_String" use="required"/>
// </xsd:complexType>
export class StringValueElement extends XmlComponent {
    public constructor(name: string, val: string) {
        super(name);
        this.root.push(new Attributes({ val }));
    }
}

// This represents various number element types.
export class NumberValueElement extends XmlComponent {
    public constructor(name: string, val: number) {
        super(name);
        this.root.push(new Attributes({ val }));
    }
}

export class StringEnumValueElement<T extends string> extends XmlComponent {
    public constructor(name: string, val: T) {
        super(name);
        this.root.push(new Attributes({ val }));
    }
}

// Simple nodes containing text.
//
// new StringContainer("hello", "world")
// <hello>world</hello>
export class StringContainer extends XmlComponent {
    public constructor(name: string, val: string) {
        super(name);
        this.root.push(val);
    }
}
