// http://officeopenxml.com/WPsection.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

// <xsd:simpleType name="ST_SectionMark">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="nextPage"/>
//   <xsd:enumeration value="nextColumn"/>
//   <xsd:enumeration value="continuous"/>
//   <xsd:enumeration value="evenPage"/>
//   <xsd:enumeration value="oddPage"/>
// </xsd:restriction>
// </xsd:simpleType>
export enum SectionType {
    NEXT_PAGE = "nextPage",
    NEXT_COLUMN = "nextColumn",
    CONTINUOUS = "continuous",
    EVEN_PAGE = "evenPage",
    ODD_PAGE = "oddPage",
}

// <xsd:complexType name="CT_SectType">
//     <xsd:attribute name="val" type="ST_SectionMark"/>
// </xsd:complexType>
export class SectionTypeAttributes extends XmlAttributeComponent<{
    readonly val: SectionType;
}> {
    protected readonly xmlKeys = {
        val: "w:val",
    };
}

export class Type extends XmlComponent {
    public constructor(value: SectionType) {
        super("w:type");
        this.root.push(new SectionTypeAttributes({ val: value }));
    }
}
