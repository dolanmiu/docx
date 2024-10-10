import { BuilderElement, XmlComponent } from "@file/xml-components";

export type EffectExtentAttributes = {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
};

// <xsd:complexType name="CT_EffectExtent">
//     <xsd:attribute name="l" type="a:ST_Coordinate" use="required"/>
//     <xsd:attribute name="t" type="a:ST_Coordinate" use="required"/>
//     <xsd:attribute name="r" type="a:ST_Coordinate" use="required"/>
//     <xsd:attribute name="b" type="a:ST_Coordinate" use="required"/>
// </xsd:complexType>
export const createEffectExtent = ({ top, right, bottom, left }: EffectExtentAttributes): XmlComponent =>
    new BuilderElement<EffectExtentAttributes>({
        name: "wp:effectExtent",
        attributes: {
            top: {
                key: "t",
                value: top,
            },
            right: {
                key: "r",
                value: right,
            },
            bottom: {
                key: "b",
                value: bottom,
            },
            left: {
                key: "l",
                value: left,
            },
        },
    });
