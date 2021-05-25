import { decimalNumber } from "file/values";
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

// not implemented
// <xsd:simpleType name="ST_DocGrid">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="default"/>
//   <xsd:enumeration value="lines"/>
//   <xsd:enumeration value="linesAndChars"/>
//   <xsd:enumeration value="snapToChars"/>
// </xsd:restriction>
// </xsd:simpleType>

// <xsd:complexType name="CT_DocGrid">
//     <xsd:attribute name="type" type="ST_DocGrid"/>
//     <xsd:attribute name="linePitch" type="ST_DecimalNumber"/>
//     <xsd:attribute name="charSpace" type="ST_DecimalNumber"/>
// </xsd:complexType>
export interface IDocGridAttributesProperties {
    readonly linePitch?: number;
}

export class DocGridAttributes extends XmlAttributeComponent<IDocGridAttributesProperties> {
    protected readonly xmlKeys = {
        linePitch: "w:linePitch",
    };
}

export class DocumentGrid extends XmlComponent {
    constructor(linePitch: number) {
        super("w:docGrid");
        this.root.push(
            new DocGridAttributes({
                linePitch: decimalNumber(linePitch),
            }),
        );
    }
}
