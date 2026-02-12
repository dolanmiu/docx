/**
 * Table row properties module for WordprocessingML documents.
 *
 * This module provides row-level properties including height and header row settings.
 *
 * Reference: http://officeopenxml.com/WPtableRowProperties.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TrPrBase">
 *   <xsd:choice maxOccurs="unbounded">
 *     <xsd:element name="cnfStyle" type="CT_Cnf" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="divId" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="gridBefore" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="gridAfter" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="wBefore" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="wAfter" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="cantSplit" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="trHeight" type="CT_Height" minOccurs="0"/>
 *     <xsd:element name="tblHeader" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="tblCellSpacing" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="jc" type="CT_JcTable" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="hidden" type="CT_OnOff" minOccurs="0"/>
 *   </xsd:choice>
 * </xsd:complexType>
 * <xsd:complexType name="CT_TrPr">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_TrPrBase">
 *       <xsd:sequence>
 *         <xsd:element name="ins" type="CT_TrackChange" minOccurs="0"/>
 *         <xsd:element name="del" type="CT_TrackChange" minOccurs="0"/>
 *         <xsd:element name="trPrChange" type="CT_TrPrChange" minOccurs="0"/>
 *       </xsd:sequence>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * <xsd:complexType name="CT_TrPrChange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_TrackChange">
 *       <xsd:sequence>
 *         <xsd:element name="trPr" type="CT_TrPrBase" minOccurs="1"/>
 *       </xsd:sequence>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @module
 */
import { DeletedTableRow, InsertedTableRow } from "@file/track-revision";
import { ChangeAttributes, IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { IgnoreIfEmptyXmlComponent, OnOffElement, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure } from "@util/values";

import { HeightRule, createTableRowHeight } from "./table-row-height";
import { ITableCellSpacingProperties, createTableCellSpacing } from "../table-cell-spacing";

export type ITableRowPropertiesOptionsBase = {
    /** Whether the row can be split across pages (cantSplit) */
    readonly cantSplit?: boolean;
    /** Whether the row should be repeated as a header row on each page (tblHeader) */
    readonly tableHeader?: boolean;
    /** Row height configuration (trHeight) */
    readonly height?: {
        /** Height value in twips or as a PositiveUniversalMeasure */
        readonly value: number | PositiveUniversalMeasure;
        /** Height rule determining how the height value is applied */
        readonly rule: (typeof HeightRule)[keyof typeof HeightRule];
    };
    /** Spacing between cells in the row (tblCellSpacing) */
    readonly cellSpacing?: ITableCellSpacingProperties;
};

/**
 * Options for configuring table row properties.
 *
 * @see {@link TableRowProperties}
 */
export type ITableRowPropertiesOptions = ITableRowPropertiesOptionsBase & {
    readonly insertion?: IChangedAttributesProperties;
    readonly deletion?: IChangedAttributesProperties;
    readonly revision?: ITableRowPropertiesChangeOptions;
    readonly includeIfEmpty?: boolean;
};

export type ITableRowPropertiesChangeOptions = ITableRowPropertiesOptionsBase & IChangedAttributesProperties;

/**
 * Represents table row properties (trPr) in a WordprocessingML document.
 *
 * The trPr element specifies properties for a table row including height,
 * whether it can split across pages, and whether it's a header row.
 *
 * Reference: http://officeopenxml.com/WPtableRowProperties.php
 *
 * @example
 * ```typescript
 * new TableRowProperties({
 *   cantSplit: true,
 *   tableHeader: true,
 *   height: {
 *     value: 1000,
 *     rule: HeightRule.EXACT,
 *   },
 * });
 * ```
 */
export class TableRowProperties extends IgnoreIfEmptyXmlComponent {
    public constructor(options: ITableRowPropertiesOptions) {
        super("w:trPr", options.includeIfEmpty);

        if (options.cantSplit !== undefined) {
            this.root.push(new OnOffElement("w:cantSplit", options.cantSplit));
        }

        if (options.tableHeader !== undefined) {
            this.root.push(new OnOffElement("w:tblHeader", options.tableHeader));
        }

        if (options.height) {
            this.root.push(createTableRowHeight(options.height.value, options.height.rule));
        }

        if (options.cellSpacing) {
            this.root.push(createTableCellSpacing(options.cellSpacing));
        }

        if (options.insertion) {
            this.root.push(new InsertedTableRow(options.insertion));
        }

        if (options.deletion) {
            this.root.push(new DeletedTableRow(options.deletion));
        }

        if (options.revision) {
            this.root.push(new TableRowPropertiesChange(options.revision));
        }
    }
}

export class TableRowPropertiesChange extends XmlComponent {
    public constructor(options: ITableRowPropertiesChangeOptions) {
        super("w:trPrChange");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        // trPr is required (minOccurs="1") even if empty
        this.root.push(new TableRowProperties({ ...options, includeIfEmpty: true }));
    }
}
