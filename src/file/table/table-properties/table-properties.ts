// http://officeopenxml.com/WPtableProperties.php
//
// <xsd:complexType name="CT_TblPrBase">
//     <xsd:sequence>
//         <xsd:element name="tblStyle" type="CT_String" minOccurs="0"/>
//         <xsd:element name="tblpPr" type="CT_TblPPr" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblOverlap" type="CT_TblOverlap" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="bidiVisual" type="CT_OnOff" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblStyleRowBandSize" type="CT_DecimalNumber" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblStyleColBandSize" type="CT_DecimalNumber" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblW" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="jc" type="CT_JcTable" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblCellSpacing" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblInd" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblBorders" type="CT_TblBorders" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="shd" type="CT_Shd" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblLayout" type="CT_TblLayoutType" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblCellMar" type="CT_TblCellMar" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblLook" type="CT_TblLook" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblCaption" type="CT_String" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblDescription" type="CT_String" minOccurs="0" maxOccurs="1"/>
//     </xsd:sequence>
// </xsd:complexType>
import { IgnoreIfEmptyXmlComponent, OnOffElement, StringValueElement } from "@file/xml-components";

import { Alignment, AlignmentType } from "../../paragraph";
import { IShadingAttributesProperties, Shading } from "../../shading";
import { ITableWidthProperties, TableWidthElement } from "../table-width";
import { ITableBordersOptions, TableBorders } from "./table-borders";
import { ITableCellMarginOptions, TableCellMargin, TableCellMarginElementType } from "./table-cell-margin";
import { ITableFloatOptions, TableFloatProperties } from "./table-float-properties";
import { TableLayout, TableLayoutType } from "./table-layout";

export interface ITablePropertiesOptions {
    readonly width?: ITableWidthProperties;
    readonly indent?: ITableWidthProperties;
    readonly layout?: TableLayoutType;
    readonly borders?: ITableBordersOptions;
    readonly float?: ITableFloatOptions;
    readonly shading?: IShadingAttributesProperties;
    readonly style?: string;
    readonly alignment?: AlignmentType;
    readonly cellMargin?: ITableCellMarginOptions;
    readonly visuallyRightToLeft?: boolean;
}

export class TableProperties extends IgnoreIfEmptyXmlComponent {
    public constructor(options: ITablePropertiesOptions) {
        super("w:tblPr");

        if (options.style) {
            this.root.push(new StringValueElement("w:tblStyle", options.style));
        }

        if (options.float) {
            this.root.push(new TableFloatProperties(options.float));
        }

        if (options.visuallyRightToLeft !== undefined) {
            this.root.push(new OnOffElement("w:bidiVisual", options.visuallyRightToLeft));
        }

        if (options.width) {
            this.root.push(new TableWidthElement("w:tblW", options.width));
        }

        if (options.alignment) {
            this.root.push(new Alignment(options.alignment));
        }

        if (options.indent) {
            this.root.push(new TableWidthElement("w:tblInd", options.indent));
        }

        if (options.borders) {
            this.root.push(new TableBorders(options.borders));
        }

        if (options.shading) {
            this.root.push(new Shading(options.shading));
        }

        if (options.layout) {
            this.root.push(new TableLayout(options.layout));
        }

        if (options.cellMargin) {
            this.root.push(new TableCellMargin(TableCellMarginElementType.TABLE, options.cellMargin));
        }
    }
}
