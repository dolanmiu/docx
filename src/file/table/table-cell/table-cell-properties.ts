/**
 * Table cell properties module for WordprocessingML documents.
 *
 * This module provides cell-level properties including width, borders,
 * shading, margins, and merge settings.
 *
 * Reference: http://officeopenxml.com/WPtableCellProperties.php
 *
 * @module
 */
import { CellMerge, DeletedTableCell, ICellMergeAttributes, InsertedTableCell } from "@file/track-revision";
import { ChangeAttributes, IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { TableVerticalAlign, createVerticalAlign } from "@file/vertical-align";
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "@file/xml-components";

import { IShadingAttributesProperties, createShading } from "../../shading";
import { ITableCellMarginOptions, createCellMargin } from "../table-properties/table-cell-margin";
import { ITableWidthProperties, createTableWidthElement } from "../table-width";
import {
    GridSpan,
    ITableCellBorders,
    TDirection,
    TableCellBorders,
    TextDirection,
    VerticalMerge,
    VerticalMergeType,
} from "./table-cell-components";

export type ITableCellPropertiesOptionsBase = {
    /** Shading (background color/pattern) for the cell */
    readonly shading?: IShadingAttributesProperties;
    /** Cell margins (padding) for the cell content */
    readonly margins?: ITableCellMarginOptions;
    /** Vertical alignment of content within the cell */
    readonly verticalAlign?: TableVerticalAlign;
    /** Text direction/flow within the cell */
    readonly textDirection?: (typeof TextDirection)[keyof typeof TextDirection];
    /** Vertical merge setting for the cell */
    readonly verticalMerge?: (typeof VerticalMergeType)[keyof typeof VerticalMergeType];
    /** Width specification for the cell */
    readonly width?: ITableWidthProperties;
    /** Number of columns this cell spans (horizontal merge) */
    readonly columnSpan?: number;
    /** Number of rows this cell spans (vertical merge) */
    readonly rowSpan?: number;
    /** Border settings for the cell edges */
    readonly borders?: ITableCellBorders;
    readonly insertion?: IChangedAttributesProperties;
    readonly deletion?: IChangedAttributesProperties;
    readonly cellMerge?: ICellMergeAttributes;
};

/**
 * Options for configuring table cell properties.
 *
 * @see {@link TableCellProperties}
 */
export type ITableCellPropertiesOptions = {
    readonly revision?: ITableCellPropertiesChangeOptions;
    readonly includeIfEmpty?: boolean;
} & ITableCellPropertiesOptionsBase;

export type ITableCellPropertiesChangeOptions = ITableCellPropertiesOptionsBase & IChangedAttributesProperties;

/**
 * Represents table cell properties (tcPr) in a WordprocessingML document.
 *
 * The tcPr element specifies properties for a table cell including width,
 * borders, shading, margins, text direction, vertical alignment, and merge settings.
 * These properties control the appearance and behavior of individual table cells.
 *
 * Reference: http://officeopenxml.com/WPtableCellProperties.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TcPr">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_TcPrInner">
 *       <xsd:sequence>
 *         <xsd:element name="tcPrChange" type="CT_TcPrChange" minOccurs="0"/>
 *       </xsd:sequence>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_TcPrInner">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_TcPrBase">
 *       <xsd:sequence>
 *         <xsd:group ref="EG_CellMarkupElements" minOccurs="0" maxOccurs="1"/>
 *       </xsd:sequence>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_TcPrBase">
 *   <xsd:sequence>
 *     <xsd:element name="cnfStyle" type="CT_Cnf" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tcW" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="gridSpan" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="hMerge" type="CT_HMerge" minOccurs="0"/>
 *     <xsd:element name="vMerge" type="CT_VMerge" minOccurs="0"/>
 *     <xsd:element name="tcBorders" type="CT_TcBorders" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="shd" type="CT_Shd" minOccurs="0"/>
 *     <xsd:element name="noWrap" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="tcMar" type="CT_TcMar" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="textDirection" type="CT_TextDirection" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tcFitText" type="CT_OnOff" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="vAlign" type="CT_VerticalJc" minOccurs="0"/>
 *     <xsd:element name="hideMark" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="headers" type="CT_Headers" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:group name="EG_CellMarkupElements">
 *   <xsd:choice>
 *     <xsd:element name="cellIns" type="CT_TrackChange" minOccurs="0"/>
 *     <xsd:element name="cellDel" type="CT_TrackChange" minOccurs="0"/>
 *     <xsd:element name="cellMerge" type="CT_CellMergeTrackChange" minOccurs="0"/>
 *   </xsd:choice>
 * </xsd:group>
 *
 * <xsd:complexType name="CT_TcPrChange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_TrackChange">
 *       <xsd:sequence>
 *         <xsd:element name="tcPr" type="CT_TcPrInner" minOccurs="1"/>
 *       </xsd:sequence>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableCellProperties({
 *   width: { size: 3000, type: WidthType.DXA },
 *   shading: { fill: "EEEEEE" },
 *   verticalAlign: VerticalAlign.CENTER,
 *   columnSpan: 2,
 * });
 * ```
 */
export class TableCellProperties extends IgnoreIfEmptyXmlComponent {
    public constructor(options: ITableCellPropertiesOptions) {
        super("w:tcPr", options.includeIfEmpty);

        if (options.width) {
            this.root.push(createTableWidthElement("w:tcW", options.width));
        }

        if (options.columnSpan) {
            this.root.push(new GridSpan(options.columnSpan));
        }

        if (options.verticalMerge) {
            this.root.push(new VerticalMerge(options.verticalMerge));
        } else if (options.rowSpan && options.rowSpan > 1) {
            // if cell already have a `verticalMerge`, don't handle `rowSpan`
            this.root.push(new VerticalMerge(VerticalMergeType.RESTART));
        }

        if (options.borders) {
            this.root.push(new TableCellBorders(options.borders));
        }

        if (options.shading) {
            this.root.push(createShading(options.shading));
        }

        if (options.margins) {
            const cellMargin = createCellMargin(options.margins);
            if (cellMargin) {
                this.root.push(cellMargin);
            }
        }

        if (options.textDirection) {
            this.root.push(new TDirection(options.textDirection));
        }

        if (options.verticalAlign) {
            this.root.push(createVerticalAlign(options.verticalAlign));
        }

        if (options.insertion) {
            this.root.push(new InsertedTableCell(options.insertion));
        }

        if (options.deletion) {
            this.root.push(new DeletedTableCell(options.deletion));
        }

        if (options.revision) {
            this.root.push(new TableCellPropertiesChange(options.revision));
        }

        if (options.cellMerge) {
            this.root.push(new CellMerge(options.cellMerge));
        }
    }
}

export class TableCellPropertiesChange extends XmlComponent {
    public constructor(options: ITableCellPropertiesChangeOptions) {
        super("w:tcPrChange");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        // tcPr is required (minOccurs="1") even if empty
        this.root.push(new TableCellProperties({ ...options, includeIfEmpty: true }));
    }
}
