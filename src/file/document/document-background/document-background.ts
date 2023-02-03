// http://officeopenxml.com/WPdocument.php
// http://www.datypic.com/sc/ooxml/e-w_background-1.html
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { hexColorValue, uCharHexNumber } from "@util/values";

// <xsd:simpleType name="ST_ThemeColor">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="dark1"/>
//   <xsd:enumeration value="light1"/>
//   <xsd:enumeration value="dark2"/>
//   <xsd:enumeration value="light2"/>
//   <xsd:enumeration value="accent1"/>
//   <xsd:enumeration value="accent2"/>
//   <xsd:enumeration value="accent3"/>
//   <xsd:enumeration value="accent4"/>
//   <xsd:enumeration value="accent5"/>
//   <xsd:enumeration value="accent6"/>
//   <xsd:enumeration value="hyperlink"/>
//   <xsd:enumeration value="followedHyperlink"/>
//   <xsd:enumeration value="none"/>
//   <xsd:enumeration value="background1"/>
//   <xsd:enumeration value="text1"/>
//   <xsd:enumeration value="background2"/>
//   <xsd:enumeration value="text2"/>
// </xsd:restriction>
// </xsd:simpleType>

export class DocumentBackgroundAttributes extends XmlAttributeComponent<{
    readonly color?: string;
    readonly themeColor?: string;
    readonly themeShade?: string;
    readonly themeTint?: string;
}> {
    protected readonly xmlKeys = {
        color: "w:color",
        themeColor: "w:themeColor",
        themeShade: "w:themeShade",
        themeTint: "w:themeTint",
    };
}

export interface IDocumentBackgroundOptions {
    readonly color?: string;
    readonly themeColor?: string;
    readonly themeShade?: string;
    readonly themeTint?: string;
}

// <xsd:complexType name="CT_Background">
//     <xsd:sequence>
//         <xsd:sequence maxOccurs="unbounded">
//             <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:vml" minOccurs="0"
//             maxOccurs="unbounded"/>
//             <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:office:office"
//             minOccurs="0" maxOccurs="unbounded"/>
//         </xsd:sequence>
//         <xsd:element name="drawing" type="CT_Drawing" minOccurs="0"/>
//     </xsd:sequence>
//     <xsd:attribute name="color" type="ST_HexColor" use="optional" default="auto"/>
//     <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
//     <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
//     <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
// </xsd:complexType>

export class DocumentBackground extends XmlComponent {
    public constructor(options: IDocumentBackgroundOptions) {
        super("w:background");

        this.root.push(
            new DocumentBackgroundAttributes({
                color: options.color === undefined ? undefined : hexColorValue(options.color),
                themeColor: options.themeColor,
                themeShade: options.themeShade === undefined ? undefined : uCharHexNumber(options.themeShade),
                themeTint: options.themeTint === undefined ? undefined : uCharHexNumber(options.themeTint),
            }),
        );
    }
}
