import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

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

class TableLayoutAttributes extends XmlAttributeComponent<{
    readonly type: (typeof TableLayoutType)[keyof typeof TableLayoutType];
}> {
    protected readonly xmlKeys = { type: "w:type" };
}

// <xsd:complexType name="CT_TblLayoutType">
//     <xsd:attribute name="type" type="ST_TblLayoutType"/>
// </xsd:complexType>
export class TableLayout extends XmlComponent {
    public constructor(type: (typeof TableLayoutType)[keyof typeof TableLayoutType]) {
        super("w:tblLayout");
        this.root.push(new TableLayoutAttributes({ type }));
    }
}
