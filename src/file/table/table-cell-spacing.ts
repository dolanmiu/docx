// http://officeopenxml.com/WPtableCellSpacing.php
import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { Percentage, UniversalMeasure, measurementOrPercentValue } from "@util/values";

// <xsd:simpleType name="ST_TblCellSpacing">
//   <xsd:restriction base="xsd:string">
//     <xsd:enumeration value="nil"/>
//     <xsd:enumeration value="dxa"/>
//   </xsd:restriction>
// </xsd:simpleType>

export const CellSpacingType = {
    /** Value is in twentieths of a point */
    DXA: "dxa",
    /** No (empty) value. */
    NIL: "nil",
} as const;

// <xsd:complexType name="CT_TblCellSpacing">
//     <xsd:attribute name="w" type="ST_MeasurementOrPercent"/>
//     <xsd:attribute name="type" type="ST_TblCellSpacing"/>
// </xsd:complexType>
export type ITableCellSpacingProperties = {
    readonly value: number | Percentage | UniversalMeasure;
    readonly type?: (typeof CellSpacingType)[keyof typeof CellSpacingType];
};

export class TableCellSpacingElement extends XmlComponent {
    public constructor({ type = CellSpacingType.DXA, value }: ITableCellSpacingProperties) {
        super("w:tblCellSpacing");

        this.root.push(
            new NextAttributeComponent<ITableCellSpacingProperties>({
                type: { key: "w:type", value: type },
                value: { key: "w:w", value: measurementOrPercentValue(value) },
            }),
        );
    }
}
