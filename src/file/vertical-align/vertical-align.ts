import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

// <xsd:complexType name="CT_VerticalJc">
//     <xsd:attribute name="val" type="ST_VerticalJc" use="required"/>
// </xsd:complexType>

// <xsd:simpleType name="ST_VerticalJc">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="both"/>
//   <xsd:enumeration value="top"/>
//   <xsd:enumeration value="center"/>
//   <xsd:enumeration value="bottom"/>
// </xsd:restriction>
// </xsd:simpleType>

/**
 * Enumeration for table-cell vertical alignment. Only `top`, `center`, `bottom`
 * are valid according to ECMA-376 (§17.18.87 ST_VerticalJc within <w:tcPr>).
 */
export const VerticalAlignTable = {
    TOP: "top",
    CENTER: "center",
    BOTTOM: "bottom",
} as const;

/**
 * Enumeration for section (<w:sectPr>) vertical alignment. Adds `both` on top of
 * the table-cell set (§17.18.87 ST_VerticalJc within <w:sectPr>).
 */
export const VerticalAlignSection = {
    ...VerticalAlignTable,
    BOTH: "both",
} as const;

/**
 * @deprecated Use {@link VerticalAlignTable} for table cells or
 * {@link VerticalAlignSection} for section properties. This alias remains for
 * backward-compatibility and will be removed in the next major release.
 */
export const VerticalAlign = VerticalAlignSection;

export type TableVerticalAlign = (typeof VerticalAlignTable)[keyof typeof VerticalAlignTable];

export type SectionVerticalAlign = (typeof VerticalAlignSection)[keyof typeof VerticalAlignSection];

export class VerticalAlignAttributes extends XmlAttributeComponent<{
    readonly verticalAlign?: (typeof VerticalAlign)[keyof typeof VerticalAlign];
}> {
    protected readonly xmlKeys = {
        verticalAlign: "w:val",
    };
}

export class VerticalAlignElement extends XmlComponent {
    public constructor(value: (typeof VerticalAlign)[keyof typeof VerticalAlign]) {
        super("w:vAlign");
        this.root.push(new VerticalAlignAttributes({ verticalAlign: value }));
    }
}
