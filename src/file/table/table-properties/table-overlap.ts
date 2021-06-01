import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

// <xsd:simpleType name="ST_TblOverlap">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="never"/>
//         <xsd:enumeration value="overlap"/>
//     </xsd:restriction>
// </xsd:simpleType>
export enum OverlapType {
    NEVER = "never",
    OVERLAP = "overlap",
}

// <xsd:complexType name="CT_TblOverlap">
//     <xsd:attribute name="val" type="ST_TblOverlap" use="required"/>
// </xsd:complexType>
class TableOverlapAttributes extends XmlAttributeComponent<{ readonly val: OverlapType }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class TableOverlap extends XmlComponent {
    constructor(type: OverlapType) {
        super("w:tblOverlap");
        this.root.push(new TableOverlapAttributes({ val: type }));
    }
}
