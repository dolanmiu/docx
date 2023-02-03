// http://officeopenxml.com/WPsectionLineNumbering.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber, twipsMeasureValue } from "@util/values";

// <xsd:simpleType name="ST_LineNumberRestart">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="newPage"/>
//   <xsd:enumeration value="newSection"/>
//   <xsd:enumeration value="continuous"/>
// </xsd:restriction>
// </xsd:simpleType>
export enum LineNumberRestartFormat {
    NEW_PAGE = "newPage",
    NEW_SECTION = "newSection",
    CONTINUOUS = "continuous",
}

// <xsd:complexType name="CT_LineNumber">
//     <xsd:attribute name="countBy" type="ST_DecimalNumber" use="optional"/>
//     <xsd:attribute name="start" type="ST_DecimalNumber" use="optional" default="1"/>
//     <xsd:attribute name="distance" type="s:ST_TwipsMeasure" use="optional"/>
//     <xsd:attribute name="restart" type="ST_LineNumberRestart" use="optional" default="newPage"/>
// </xsd:complexType>

export interface ILineNumberAttributes {
    readonly countBy?: number;
    readonly start?: number;
    readonly restart?: LineNumberRestartFormat;
    readonly distance?: number | string;
}

export class LineNumberAttributes extends XmlAttributeComponent<ILineNumberAttributes> {
    protected readonly xmlKeys = {
        countBy: "w:countBy",
        start: "w:start",
        restart: "w:restart",
        distance: "w:distance",
    };
}

export class LineNumberType extends XmlComponent {
    public constructor({ countBy, start, restart, distance }: ILineNumberAttributes) {
        super("w:lnNumType");
        this.root.push(
            new LineNumberAttributes({
                countBy: countBy === undefined ? undefined : decimalNumber(countBy),
                start: start === undefined ? undefined : decimalNumber(start),
                restart,
                distance: distance === undefined ? undefined : twipsMeasureValue(distance),
            }),
        );
    }
}
