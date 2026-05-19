/**
 * Table properties module for WordprocessingML documents.
 *
 * This module provides table-level properties including width, borders,
 * layout, alignment, and margins.
 *
 * Reference: http://officeopenxml.com/WPtableProperties.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblPrBase">
 *   <xsd:sequence>
 *     <xsd:element name="tblStyle" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="tblpPr" type="CT_TblPPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblOverlap" type="CT_TblOverlap" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="bidiVisual" type="CT_OnOff" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblStyleRowBandSize" type="CT_DecimalNumber" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblStyleColBandSize" type="CT_DecimalNumber" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblW" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="jc" type="CT_JcTable" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblCellSpacing" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblInd" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblBorders" type="CT_TblBorders" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="shd" type="CT_Shd" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblLayout" type="CT_TblLayoutType" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblCellMar" type="CT_TblCellMar" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblLook" type="CT_TblLook" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblCaption" type="CT_String" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblDescription" type="CT_String" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_TblPrChange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_TrackChange">
 *       <xsd:sequence>
 *         <xsd:element name="tblPr" type="CT_TblPrBase"/>
 *       </xsd:sequence>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @module
 */
import { ChangeAttributes, type IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { IgnoreIfEmptyXmlComponent, OnOffElement, StringValueElement, XmlComponent } from "@file/xml-components";

import { type AlignmentType, createAlignment } from "../../paragraph";
import { type IShadingAttributesProperties, createShading } from "../../shading";
import { type ITableWidthProperties, createTableWidthElement } from "../table-width";
import { type ITableBordersOptions, TableBorders } from "./table-borders";
import { type ITableCellMarginOptions, createTableCellMargin } from "./table-cell-margin";
import { type ITableFloatOptions, createTableFloatProperties } from "./table-float-properties";
import { type TableLayoutType, createTableLayout } from "./table-layout";
import { type ITableCellSpacingProperties, createTableCellSpacing } from "../table-cell-spacing";
import { type ITableLookOptions, createTableLook } from "./table-look";

export type ITablePropertiesOptionsBase = {
    readonly width?: ITableWidthProperties;
    readonly indent?: ITableWidthProperties;
    readonly layout?: (typeof TableLayoutType)[keyof typeof TableLayoutType];
    readonly borders?: ITableBordersOptions;
    readonly float?: ITableFloatOptions;
    readonly shading?: IShadingAttributesProperties;
    readonly style?: string;
    readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    readonly cellMargin?: ITableCellMarginOptions;
    readonly visuallyRightToLeft?: boolean;
    readonly tableLook?: ITableLookOptions;
    readonly cellSpacing?: ITableCellSpacingProperties;
};

export type ITablePropertiesChangeOptions = ITablePropertiesOptions & IChangedAttributesProperties;

/**
 * Options for configuring table properties.
 *
 * @see {@link TableProperties}
 */
export type ITablePropertiesOptions = {
    readonly revision?: ITablePropertiesChangeOptions;
    readonly includeIfEmpty?: boolean;
} & ITablePropertiesOptionsBase;

/**
 * Represents table properties (tblPr) in a WordprocessingML document.
 *
 * The tblPr element specifies the properties for a table including width,
 * alignment, borders, margins, and layout.
 *
 * Reference: http://officeopenxml.com/WPtableProperties.php
 */
export class TableProperties extends IgnoreIfEmptyXmlComponent {
    public constructor(options: ITablePropertiesOptions) {
        super("w:tblPr", options.includeIfEmpty);

        if (options.style) {
            this.root.push(new StringValueElement("w:tblStyle", options.style));
        }

        if (options.float) {
            this.root.push(createTableFloatProperties(options.float));
        }

        if (options.visuallyRightToLeft !== undefined) {
            this.root.push(new OnOffElement("w:bidiVisual", options.visuallyRightToLeft));
        }

        if (options.width) {
            this.root.push(createTableWidthElement("w:tblW", options.width));
        }

        if (options.alignment) {
            this.root.push(createAlignment(options.alignment));
        }

        if (options.indent) {
            this.root.push(createTableWidthElement("w:tblInd", options.indent));
        }

        if (options.borders) {
            this.root.push(new TableBorders(options.borders));
        }

        if (options.shading) {
            this.root.push(createShading(options.shading));
        }

        if (options.layout) {
            this.root.push(createTableLayout(options.layout));
        }

        if (options.cellMargin) {
            const cellMargin = createTableCellMargin(options.cellMargin);
            if (cellMargin) {
                this.root.push(cellMargin);
            }
        }

        if (options.tableLook) {
            this.root.push(createTableLook(options.tableLook));
        }

        if (options.cellSpacing) {
            this.root.push(createTableCellSpacing(options.cellSpacing));
        }

        if (options.revision) {
            this.root.push(new TablePropertiesChange(options.revision));
        }
    }
}

class TablePropertiesChange extends XmlComponent {
    public constructor(options: ITablePropertiesChangeOptions) {
        super("w:tblPrChange");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        // tblPr is required even if empty (minOccurs="0" is missing)
        this.root.push(new TableProperties({ ...options, includeIfEmpty: true }));
    }
}
