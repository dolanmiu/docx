import { BuilderElement, XmlComponent } from "@file/xml-components";

type SchemeColorOptions = {
    readonly value: (typeof SchemeColor)[keyof typeof SchemeColor];
};

// <xsd:simpleType name="ST_SchemeColorVal">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="bg1"/>
//         <xsd:enumeration value="tx1"/>
//         <xsd:enumeration value="bg2"/>
//         <xsd:enumeration value="tx2"/>
//         <xsd:enumeration value="accent1"/>
//         <xsd:enumeration value="accent2"/>
//         <xsd:enumeration value="accent3"/>
//         <xsd:enumeration value="accent4"/>
//         <xsd:enumeration value="accent5"/>
//         <xsd:enumeration value="accent6"/>
//         <xsd:enumeration value="hlink"/>
//         <xsd:enumeration value="folHlink"/>
//         <xsd:enumeration value="dk1"/>
//         <xsd:enumeration value="lt1"/>
//         <xsd:enumeration value="dk2"/>
//         <xsd:enumeration value="lt2"/>
//         <xsd:enumeration value="phClr"/>
//     </xsd:restriction>
// </xsd:simpleType>

// cspell:ignore folHlink, phClr, hlink
export const SchemeColor = {
    BG1: "bg1",
    TX1: "tx1",
    BG2: "bg2",
    TX2: "tx2",
    ACCENT1: "accent1",
    ACCENT2: "accent2",
    ACCENT3: "accent3",
    ACCENT4: "accent4",
    ACCENT5: "accent5",
    ACCENT6: "accent6",
    HLINK: "hlink",
    FOLHLINK: "folHlink",
    DK1: "dk1",
    LT1: "lt1",
    DK2: "dk2",
    LT2: "lt2",
    PHCLR: "phClr",
} as const;

// <xsd:complexType name="CT_SchemeColor">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
//     <xsd:attribute name="val" type="ST_SchemeColorVal" use="required"/>
// </xsd:complexType>
export const createSchemeColor = (options: SchemeColorOptions): XmlComponent =>
    new BuilderElement<SchemeColorOptions>({
        name: "a:schemeClr",
        attributes: {
            value: {
                key: "val",
                value: options.value,
            },
        },
    });
