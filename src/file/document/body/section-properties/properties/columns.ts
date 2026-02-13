/**
 * Columns module for WordprocessingML section properties.
 *
 * Defines multi-column layouts within document sections.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * @module
 */
import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, decimalNumber, twipsMeasureValue } from "@util/values";

import { Column } from "./column";

/**
 * Options for configuring column layout in a section.
 *
 * @property space - Spacing between columns in twips (default: 720)
 * @property count - Number of columns (default: 1)
 * @property separate - Whether to draw vertical separator lines between columns
 * @property equalWidth - Whether all columns have equal width
 * @property children - Individual column definitions (used when equalWidth is false)
 */
export type IColumnsAttributes = {
    /** Spacing between columns in twips (default: 720) */
    readonly space?: number | PositiveUniversalMeasure;
    /** Number of columns (default: 1) */
    readonly count?: number;
    /** Whether to draw vertical separator lines between columns */
    readonly separate?: boolean;
    /** Whether all columns have equal width */
    readonly equalWidth?: boolean;
    /** Individual column definitions (used when equalWidth is false, max: 45) */
    readonly children?: readonly Column[];
};

/**
 * Represents column layout settings (cols) for a document section.
 *
 * This element defines the multi-column layout properties for a section,
 * including column count, spacing, and whether columns have equal or custom widths.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Columns">
 *   <xsd:sequence minOccurs="0">
 *     <xsd:element name="col" type="CT_Column" maxOccurs="45"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="equalWidth" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="space" type="s:ST_TwipsMeasure" use="optional" default="720"/>
 *   <xsd:attribute name="num" type="ST_DecimalNumber" use="optional" default="1"/>
 *   <xsd:attribute name="sep" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Two equal-width columns with separator
 * new Columns({
 *   count: 2,
 *   space: 720,
 *   separate: true,
 *   equalWidth: true
 * });
 *
 * // Custom column widths
 * new Columns({
 *   equalWidth: false,
 *   children: [
 *     new Column({ width: 3000, space: 720 }),
 *     new Column({ width: 4000, space: 0 })
 *   ]
 * });
 * ```
 */
export class Columns extends XmlComponent {
    public constructor({ space, count, separate, equalWidth, children }: IColumnsAttributes) {
        super("w:cols");
        this.root.push(
            new NextAttributeComponent<Omit<IColumnsAttributes, "children">>({
                space: { key: "w:space", value: space === undefined ? undefined : twipsMeasureValue(space) },
                count: { key: "w:num", value: count === undefined ? undefined : decimalNumber(count) },
                separate: { key: "w:sep", value: separate },
                equalWidth: { key: "w:equalWidth", value: equalWidth },
            }),
        );

        if (!equalWidth && children) {
            children.forEach((column) => this.addChildElement(column));
        }
    }
}
