import { BuilderElement, XmlComponent } from "@file/xml-components";

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

export const createVerticalAlign = (value: (typeof VerticalAlign)[keyof typeof VerticalAlign]): XmlComponent =>
    new BuilderElement<{ readonly verticalAlign: (typeof VerticalAlign)[keyof typeof VerticalAlign] }>({
        name: "w:vAlign",
        attributes: {
            verticalAlign: { key: "w:val", value },
        },
    });
