// http://officeopenxml.com/WPtableWidth.php
import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { measurementOrPercentValue, Percentage, UniversalMeasure } from "@util/values";

// <xsd:simpleType name="ST_TblWidth">
//   <xsd:restriction base="xsd:string">
//     <xsd:enumeration value="nil"/>
//     <xsd:enumeration value="pct"/>
//     <xsd:enumeration value="dxa"/>
//     <xsd:enumeration value="auto"/>
//   </xsd:restriction>
// </xsd:simpleType>
export enum WidthType {
    /** Auto. */
    AUTO = "auto",
    /** Value is in twentieths of a point */
    DXA = "dxa",
    /** No (empty) value. */
    NIL = "nil",
    /** Value is in percentage. */
    PERCENTAGE = "pct",
}

// <xsd:complexType name="CT_TblWidth">
//     <xsd:attribute name="w" type="ST_MeasurementOrPercent"/>
//     <xsd:attribute name="type" type="ST_TblWidth"/>
// </xsd:complexType>
export type ITableWidthProperties = {
    readonly size: number | Percentage | UniversalMeasure;
    readonly type?: WidthType;
};

export class TableWidthElement extends XmlComponent {
    public constructor(name: string, { type = WidthType.AUTO, size }: ITableWidthProperties) {
        super(name);
        // super("w:tblW");
        let tableWidthValue = size;
        if (type === WidthType.PERCENTAGE && typeof size === "number") {
            tableWidthValue = `${size}%`;
        }

        this.root.push(
            new NextAttributeComponent<ITableWidthProperties>({
                type: { key: "w:type", value: type },
                size: { key: "w:w", value: measurementOrPercentValue(tableWidthValue) },
            }),
        );
    }
}
