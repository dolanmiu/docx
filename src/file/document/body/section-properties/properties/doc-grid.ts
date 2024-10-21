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

export const DocumentGridType = {
    DEFAULT: "default",
    LINES: "lines",
    LINES_AND_CHARS: "linesAndChars",
    SNAP_TO_CHARS: "snapToChars",
} as const;

export type IDocGridAttributesProperties = {
    readonly type?: (typeof DocumentGridType)[keyof typeof DocumentGridType];
    readonly linePitch?: number;
    readonly charSpace?: number;
};

export class DocGridAttributes extends XmlAttributeComponent<IDocGridAttributesProperties> {
    protected readonly xmlKeys = {
        type: "w:type",
        linePitch: "w:linePitch",
        charSpace: "w:charSpace",
    };
}

export class DocumentGrid extends XmlComponent {
    public constructor(linePitch: number, charSpace?: number, type?: (typeof DocumentGridType)[keyof typeof DocumentGridType]) {
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
