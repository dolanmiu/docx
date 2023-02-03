// http://officeopenxml.com/WPtableWidth.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { measurementOrPercentValue } from "@util/values";

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
export interface ITableWidthProperties {
    readonly size: string | number;
    readonly type?: WidthType;
}

class TableWidthAttributes extends XmlAttributeComponent<ITableWidthProperties> {
    protected readonly xmlKeys = { type: "w:type", size: "w:w" };
}

export class TableWidthElement extends XmlComponent {
    public constructor(name: string, { type = WidthType.AUTO, size }: ITableWidthProperties) {
        super(name);
        // super("w:tblW");
        let tableWidthValue = size;
        if (type === WidthType.PERCENTAGE && typeof size === "number") {
            tableWidthValue = `${size}%`;
        }
        this.root.push(new TableWidthAttributes({ type: type, size: measurementOrPercentValue(tableWidthValue) }));
    }
}
