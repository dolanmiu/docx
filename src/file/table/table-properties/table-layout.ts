import { BuilderElement, XmlComponent } from "@file/xml-components";

// <xsd:simpleType name="ST_TblLayoutType">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="fixed"/>
//         <xsd:enumeration value="autofit"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const TableLayoutType = {
    AUTOFIT: "autofit",
    FIXED: "fixed",
} as const;

// <xsd:complexType name="CT_TblLayoutType">
//     <xsd:attribute name="type" type="ST_TblLayoutType"/>
// </xsd:complexType>
export const createTableLayout = (type: (typeof TableLayoutType)[keyof typeof TableLayoutType]): XmlComponent =>
    new BuilderElement<{ readonly type: (typeof TableLayoutType)[keyof typeof TableLayoutType] }>({
        name: "w:tblLayout",
        attributes: {
            type: { key: "w:type", value: type },
        },
    });
