import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

// <xsd:simpleType name="ST_TblLayoutType">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="fixed"/>
//         <xsd:enumeration value="autofit"/>
//     </xsd:restriction>
// </xsd:simpleType>
export enum TableLayoutType {
    AUTOFIT = "autofit",
    FIXED = "fixed",
}

class TableLayoutAttributes extends XmlAttributeComponent<{ readonly type: TableLayoutType }> {
    protected readonly xmlKeys = { type: "w:type" };
}

// <xsd:complexType name="CT_TblLayoutType">
//     <xsd:attribute name="type" type="ST_TblLayoutType"/>
// </xsd:complexType>
export class TableLayout extends XmlComponent {
    public constructor(type: TableLayoutType) {
        super("w:tblLayout");
        this.root.push(new TableLayoutAttributes({ type }));
    }
}
