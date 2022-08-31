import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

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

export enum DocumentGridType {
    DEFAULT = "default",
    LINES = "lines",
    LINES_AND_CHARS = "linesAndChars",
    SNAP_TO_CHARS = "snapToChars",
}
export interface IDocGridAttributesProperties {
    readonly type?: DocumentGridType;
    readonly linePitch?: number;
    readonly charSpace?: number;
}

export class DocGridAttributes extends XmlAttributeComponent<IDocGridAttributesProperties> {
    protected readonly xmlKeys = {
        type: "w:type",
        linePitch: "w:linePitch",
        charSpace: "w:charSpace",
    };
}

export class DocumentGrid extends XmlComponent {
    public constructor(linePitch: number, charSpace?: number, type?: DocumentGridType) {
        super("w:docGrid");

        this.root.push(
            new DocGridAttributes({
                type: type,
                linePitch: decimalNumber(linePitch),
                charSpace: charSpace ? decimalNumber(charSpace) : undefined,
            }),
        );
    }
}
