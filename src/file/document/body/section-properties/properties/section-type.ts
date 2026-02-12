// http://officeopenxml.com/WPsection.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

// <xsd:simpleType name="ST_SectionMark">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="nextPage"/>
//   <xsd:enumeration value="nextColumn"/>
//   <xsd:enumeration value="continuous"/>
//   <xsd:enumeration value="evenPage"/>
//   <xsd:enumeration value="oddPage"/>
// </xsd:restriction>
// </xsd:simpleType>

export const SectionType = {
    NEXT_PAGE: "nextPage",
    NEXT_COLUMN: "nextColumn",
    CONTINUOUS: "continuous",
    EVEN_PAGE: "evenPage",
    ODD_PAGE: "oddPage",
} as const;

type ISectionTypeAttributes = {
    readonly val: (typeof SectionType)[keyof typeof SectionType];
};

// <xsd:complexType name="CT_SectType">
//     <xsd:attribute name="val" type="ST_SectionMark"/>
// </xsd:complexType>
export const createSectionType = (value: (typeof SectionType)[keyof typeof SectionType]): XmlComponent =>
    new BuilderElement<ISectionTypeAttributes>({
        name: "w:type",
        attributes: {
            val: { key: "w:val", value: value },
        },
    });
