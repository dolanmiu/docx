// <xsd:complexType name="CT_TcPr">
//     <xsd:complexContent>
//         <xsd:extension base="CT_TcPrInner">
//             <xsd:sequence>
//                 <xsd:element name="tcPrChange" type="CT_TcPrChange" minOccurs="0"/>
//             </xsd:sequence>
//         </xsd:extension>
//     </xsd:complexContent>
// </xsd:complexType>
// <xsd:complexType name="CT_TcPrInner">
//     <xsd:complexContent>
//         <xsd:extension base="CT_TcPrBase">
//             <xsd:sequence>
//                 <xsd:group ref="EG_CellMarkupElements" minOccurs="0" maxOccurs="1"/>
//             </xsd:sequence>
//         </xsd:extension>
//     </xsd:complexContent>
// </xsd:complexType>
// <xsd:complexType name="CT_TcPrBase">
//     <xsd:sequence>
//         <xsd:element name="cnfStyle" type="CT_Cnf" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tcW" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="gridSpan" type="CT_DecimalNumber" minOccurs="0"/>
//         <xsd:element name="vMerge" type="CT_VMerge" minOccurs="0"/>
//         <xsd:element name="tcBorders" type="CT_TcBorders" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="shd" type="CT_Shd" minOccurs="0"/>
//         <xsd:element name="noWrap" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="tcMar" type="CT_TcMar" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="textDirection" type="CT_TextDirection" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tcFitText" type="CT_OnOff" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="vAlign" type="CT_VerticalJc" minOccurs="0"/>
//         <xsd:element name="hideMark" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="headers" type="CT_Headers" minOccurs="0"/>
//     </xsd:sequence>
// </xsd:complexType>
// <xsd:group name="EG_CellMarkupElements">
//     <xsd:choice>
//         <xsd:element name="cellIns" type="CT_TrackChange" minOccurs="0"/>
//         <xsd:element name="cellDel" type="CT_TrackChange" minOccurs="0"/>
//         <xsd:element name="cellMerge" type="CT_CellMergeTrackChange" minOccurs="0"/>
//     </xsd:choice>
// </xsd:group>
// <xsd:complexType name="CT_TcPrChange">
//     <xsd:complexContent>
//         <xsd:extension base="CT_TrackChange">
//             <xsd:sequence>
//                 <xsd:element name="tcPr" type="CT_TcPrInner" minOccurs="1"/>
//             </xsd:sequence>
//         </xsd:extension>
//     </xsd:complexContent>
// </xsd:complexType>
import { CellMerge, DeletedTableCell, ICellMergeAttributes, InsertedTableCell } from "@file/track-revision";
import { ChangeAttributes, IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { TableVerticalAlign, VerticalAlignElement } from "@file/vertical-align";
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "@file/xml-components";

import { IShadingAttributesProperties, Shading } from "../../shading";
import { ITableCellMarginOptions, TableCellMargin, TableCellMarginElementType } from "../table-properties/table-cell-margin";
import { ITableWidthProperties, TableWidthElement } from "../table-width";
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
    readonly shading?: IShadingAttributesProperties;
    readonly margins?: ITableCellMarginOptions;
    readonly verticalAlign?: TableVerticalAlign;
    readonly textDirection?: (typeof TextDirection)[keyof typeof TextDirection];
    readonly verticalMerge?: (typeof VerticalMergeType)[keyof typeof VerticalMergeType];
    readonly width?: ITableWidthProperties;
    readonly columnSpan?: number;
    readonly rowSpan?: number;
    readonly borders?: ITableCellBorders;
    readonly insertion?: IChangedAttributesProperties;
    readonly deletion?: IChangedAttributesProperties;
    readonly cellMerge?: ICellMergeAttributes;
};

export type ITableCellPropertiesOptions = {
    readonly revision?: ITableCellPropertiesChangeOptions;
    readonly includeIfEmpty?: boolean;
} & ITableCellPropertiesOptionsBase;

export type ITableCellPropertiesChangeOptions = ITableCellPropertiesOptionsBase & IChangedAttributesProperties;

export class TableCellProperties extends IgnoreIfEmptyXmlComponent {
    public constructor(options: ITableCellPropertiesOptions) {
        super("w:tcPr", options.includeIfEmpty);

        if (options.width) {
            this.root.push(new TableWidthElement("w:tcW", options.width));
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
            this.root.push(new Shading(options.shading));
        }

        if (options.margins) {
            this.root.push(new TableCellMargin(TableCellMarginElementType.TABLE_CELL, options.margins));
        }

        if (options.textDirection) {
            this.root.push(new TDirection(options.textDirection));
        }

        if (options.verticalAlign) {
            this.root.push(new VerticalAlignElement(options.verticalAlign));
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
