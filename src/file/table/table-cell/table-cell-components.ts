/**
 * Table cell components module for WordprocessingML documents.
 *
 * This module provides XML components for table cell properties including borders,
 * grid span (column span), vertical merge, and text direction.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * @module
 */
import { BorderElement, IBorderOptions } from "@file/border";
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

/**
 * Options for configuring table cell borders.
 *
 * Defines border settings for individual edges of a table cell. Border settings
 * can be specified for top, bottom, left, right, start, and end edges.
 *
 * @see {@link TableCellBorders}
 */
export type ITableCellBorders = {
    /** Border for the top edge of the cell */
    readonly top?: IBorderOptions;
    /** Border for the start edge (left in LTR, right in RTL) */
    readonly start?: IBorderOptions;
    /** Border for the left edge of the cell */
    readonly left?: IBorderOptions;
    /** Border for the bottom edge of the cell */
    readonly bottom?: IBorderOptions;
    /** Border for the end edge (right in LTR, left in RTL) */
    readonly end?: IBorderOptions;
    /** Border for the right edge of the cell */
    readonly right?: IBorderOptions;
};

/**
 * Represents table cell borders (tcBorders) in a WordprocessingML document.
 *
 * The tcBorders element specifies the borders for a single table cell. Each border
 * can be configured independently with different styles, colors, and widths.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TcBorders">
 *   <xsd:sequence>
 *     <xsd:element name="top" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="start" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="left" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="bottom" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="end" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="right" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="insideH" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="insideV" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="tl2br" type="CT_Border" minOccurs="0"/>
 *     <xsd:element name="tr2bl" type="CT_Border" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableCellBorders({
 *   top: { style: BorderStyle.SINGLE, size: 6, color: "FF0000" },
 *   bottom: { style: BorderStyle.SINGLE, size: 6, color: "0000FF" },
 * });
 * ```
 */
export class TableCellBorders extends IgnoreIfEmptyXmlComponent {
    public constructor(options: ITableCellBorders) {
        super("w:tcBorders");

        if (options.top) {
            this.root.push(new BorderElement("w:top", options.top));
        }
        if (options.start) {
            this.root.push(new BorderElement("w:start", options.start));
        }
        if (options.left) {
            this.root.push(new BorderElement("w:left", options.left));
        }
        if (options.bottom) {
            this.root.push(new BorderElement("w:bottom", options.bottom));
        }
        if (options.end) {
            this.root.push(new BorderElement("w:end", options.end));
        }
        if (options.right) {
            this.root.push(new BorderElement("w:right", options.right));
        }
    }
}

/**
 * Attributes for the GridSpan element.
 */
class GridSpanAttributes extends XmlAttributeComponent<{ readonly val: number }> {
    protected readonly xmlKeys = { val: "w:val" };
}

/**
 * Represents a grid span (gridSpan) element in a WordprocessingML document.
 *
 * The gridSpan element specifies the number of logical columns this cell spans
 * in the table grid. This is used to merge cells horizontally (column span).
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DecimalNumber">
 *   <xsd:attribute name="val" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Cell spanning 3 columns
 * new GridSpan(3);
 * ```
 */
export class GridSpan extends XmlComponent {
    public constructor(value: number) {
        super("w:gridSpan");

        this.root.push(
            new GridSpanAttributes({
                val: decimalNumber(value),
            }),
        );
    }
}

/**
 * Vertical merge types for table cells.
 *
 * Defines the merge behavior for vertically merged cells (row span).
 */
export const VerticalMergeType = {
    /**
     * Cell that is merged with upper one.
     * This cell continues a vertical merge started by a cell above it.
     */
    CONTINUE: "continue",
    /**
     * Cell that is starting the vertical merge.
     * This cell begins a new vertical merge region.
     */
    RESTART: "restart",
} as const;

/**
 * Attributes for the VerticalMerge element.
 */
class VerticalMergeAttributes extends XmlAttributeComponent<{
    readonly val: (typeof VerticalMergeType)[keyof typeof VerticalMergeType];
}> {
    protected readonly xmlKeys = { val: "w:val" };
}

/**
 * Represents a vertical merge (vMerge) element in a WordprocessingML document.
 *
 * The vMerge element specifies that this cell is part of a vertically merged region.
 * Cells can either restart a new merge region or continue an existing one from above.
 * This is used to create row spans in tables.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_VMerge">
 *   <xsd:attribute name="val" type="ST_Merge"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // First cell in a vertical merge
 * new VerticalMerge(VerticalMergeType.RESTART);
 *
 * // Subsequent cells that continue the merge
 * new VerticalMerge(VerticalMergeType.CONTINUE);
 * ```
 */
export class VerticalMerge extends XmlComponent {
    public constructor(value: (typeof VerticalMergeType)[keyof typeof VerticalMergeType]) {
        super("w:vMerge");

        this.root.push(
            new VerticalMergeAttributes({
                val: value,
            }),
        );
    }
}

/**
 * Text direction values for table cells.
 *
 * Specifies the direction in which text flows within a table cell.
 */
export const TextDirection = {
    /** Text flows from bottom to top, left to right */
    BOTTOM_TO_TOP_LEFT_TO_RIGHT: "btLr",
    /** Text flows from left to right, top to bottom (default) */
    LEFT_TO_RIGHT_TOP_TO_BOTTOM: "lrTb",
    /** Text flows from top to bottom, right to left */
    TOP_TO_BOTTOM_RIGHT_TO_LEFT: "tbRl",
} as const;

/**
 * Attributes for the TDirection element.
 */
class TDirectionAttributes extends XmlAttributeComponent<{
    readonly val: (typeof TextDirection)[keyof typeof TextDirection];
}> {
    protected readonly xmlKeys = { val: "w:val" };
}

/**
 * Represents a text direction (textDirection) element in a WordprocessingML document.
 *
 * The textDirection element specifies the flow of text within a table cell. This is
 * useful for creating rotated text or supporting different writing systems.
 *
 * Reference: http://officeopenxml.com/WPtableCell.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TextDirection">
 *   <xsd:attribute name="val" type="ST_TextDirection" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Vertical text flowing from top to bottom
 * new TDirection(TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT);
 * ```
 */
export class TDirection extends XmlComponent {
    public constructor(value: (typeof TextDirection)[keyof typeof TextDirection]) {
        super("w:textDirection");

        this.root.push(
            new TDirectionAttributes({
                val: value,
            }),
        );
    }
}
