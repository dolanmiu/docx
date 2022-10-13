import { IgnoreIfEmptyXmlComponent } from "@file/xml-components";
import { TableWidthElement, WidthType } from "../table-width";

export interface ITableCellMarginOptions {
    readonly marginUnitType?: WidthType;
    readonly top?: number;
    readonly bottom?: number;
    readonly left?: number;
    readonly right?: number;
}

// Technically two different types, but they're identical
//
// <xsd:complexType name="CT_TcMar">
//     <xsd:sequence>
//     <xsd:element name="top" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//     <xsd:element name="start" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//     <xsd:element name="left" type="CT_TblWidth" minOccurs="0"/>
//     <xsd:element name="bottom" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//     <xsd:element name="end" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//     <xsd:element name="right" type="CT_TblWidth" minOccurs="0"/>
//     </xsd:sequence>
// </xsd:complexType>

// <xsd:complexType name="CT_TblCellMar">
//     <xsd:sequence>
//     <xsd:element name="top" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//     <xsd:element name="start" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//     <xsd:element name="left" type="CT_TblWidth" minOccurs="0"/>
//     <xsd:element name="bottom" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//     <xsd:element name="end" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
//     <xsd:element name="right" type="CT_TblWidth" minOccurs="0"/>
//     </xsd:sequence>
// </xsd:complexType>

export enum TableCellMarginElementType {
    TABLE = "w:tblCellMar",
    TABLE_CELL = "w:tcMar",
}

export class TableCellMargin extends IgnoreIfEmptyXmlComponent {
    public constructor(
        type: TableCellMarginElementType,
        { marginUnitType = WidthType.DXA, top, left, bottom, right }: ITableCellMarginOptions,
    ) {
        super(type);

        if (top !== undefined) {
            this.root.push(new TableWidthElement("w:top", { type: marginUnitType, size: top }));
        }

        if (left !== undefined) {
            this.root.push(new TableWidthElement("w:left", { type: marginUnitType, size: left }));
        }

        if (bottom !== undefined) {
            this.root.push(new TableWidthElement("w:bottom", { type: marginUnitType, size: bottom }));
        }

        if (right !== undefined) {
            this.root.push(new TableWidthElement("w:right", { type: marginUnitType, size: right }));
        }
    }
}
