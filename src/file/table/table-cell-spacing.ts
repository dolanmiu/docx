// http://officeopenxml.com/WPtableCellSpacing.php
import { BuilderElement, XmlComponent } from "@file/xml-components";
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

export const createTableCellSpacing = ({ type = CellSpacingType.DXA, value }: ITableCellSpacingProperties): XmlComponent =>
    new BuilderElement<ITableCellSpacingProperties>({
        name: "w:tblCellSpacing",
        attributes: {
            type: { key: "w:type", value: type },
            value: { key: "w:w", value: measurementOrPercentValue(value) },
        },
    });
