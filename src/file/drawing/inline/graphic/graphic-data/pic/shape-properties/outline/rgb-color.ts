import { BuilderElement, XmlComponent } from "@file/xml-components";

type SolidRgbColorOptions = {
    readonly value: string;
};

// <xsd:complexType name="CT_SRgbColor">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
//     <xsd:attribute name="val" type="s:ST_HexColorRGB" use="required"/>
// </xsd:complexType>
export const createSolidRgbColor = (options: SolidRgbColorOptions): XmlComponent =>
    new BuilderElement<SolidRgbColorOptions>({
        name: "a:srgbClr",
        attributes: {
            value: {
                key: "val",
                value: options.value,
            },
        },
    });
