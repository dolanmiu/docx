/**
 * Column module for WordprocessingML section properties.
 *
 * Defines individual column properties within multi-column layouts.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Column">
 *   <xsd:attribute name="w" type="s:ST_TwipsMeasure" use="optional" />
 *   <xsd:attribute name="space" type="s:ST_TwipsMeasure" use="optional" default="0" />
 * </xsd:complexType>
 * ```
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

/**
 * Options for configuring individual column properties.
 *
 * @property width - Column width in twips or universal measure
 * @property space - Space after column in twips or universal measure (default: 0)
 */
export type IColumnAttributes = {
    /** Column width in twips or universal measure */
    readonly width: number | PositiveUniversalMeasure;
    /** Space after column in twips or universal measure (default: 0) */
    readonly space?: number | PositiveUniversalMeasure;
};

class ColumnAttributes extends XmlAttributeComponent<{
    readonly width?: number | PositiveUniversalMeasure;
    readonly space?: number | PositiveUniversalMeasure;
}> {
    protected readonly xmlKeys = {
        width: "w:w",
        space: "w:space",
    };
}

/**
 * Represents a column definition (col) for a multi-column section layout.
 *
 * This element defines the width and spacing for an individual column when
 * using unequal column widths in a section.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Create a column with specific width and spacing
 * new Column({
 *   width: 3000,
 *   space: 720
 * });
 * ```
 */
export class Column extends XmlComponent {
    public constructor(options: IColumnAttributes) {
        super("w:col");

        this.root.push(
            new ColumnAttributes({
                width: twipsMeasureValue(options.width),
                space: options.space === undefined ? undefined : twipsMeasureValue(options.space),
            }),
        );
    }
}
