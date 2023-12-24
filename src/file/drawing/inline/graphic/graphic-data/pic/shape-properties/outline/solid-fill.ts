import { BuilderElement, XmlComponent } from "index";
import { SchemeColor } from "./scheme-color";

type SolidRgbColorOptions = {
    readonly value: string;
};

// <xsd:complexType name="CT_SRgbColor">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
//     <xsd:attribute name="val" type="s:ST_HexColorRGB" use="required"/>
// </xsd:complexType>
const createSolidRgbColor = (options: SolidRgbColorOptions): XmlComponent =>
    new BuilderElement<SolidRgbColorOptions>({
        name: "a:srgbClr",
        attributes: {
            value: {
                key: "val",
                value: options.value,
            },
        },
    });

export const createSolidFill = (options: { readonly rgbColor: string; readonly schemeColor?: typeof SchemeColor }): XmlComponent =>
    new BuilderElement({
        name: "a:solidFill",
        children: [createSolidRgbColor({ value: options.rgbColor })],
    });
