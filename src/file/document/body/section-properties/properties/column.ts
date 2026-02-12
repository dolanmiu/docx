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
import { BuilderElement, XmlComponent } from "@file/xml-components";
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

/**
 * Creates a column definition (col) for a multi-column section layout.
 *
 * This element defines the width and spacing for an individual column when
 * using unequal column widths in a section.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * @example
 * ```typescript
 * // Create a column with specific width and spacing
 * createColumn({
 *   width: 3000,
 *   space: 720
 * });
 * ```
 */
export const createColumn = ({ width, space }: IColumnAttributes): XmlComponent =>
    new BuilderElement<IColumnAttributes>({
        name: "w:col",
        attributes: {
            width: { key: "w:w", value: twipsMeasureValue(width) },
            space: { key: "w:space", value: space === undefined ? undefined : twipsMeasureValue(space) },
        },
    });
