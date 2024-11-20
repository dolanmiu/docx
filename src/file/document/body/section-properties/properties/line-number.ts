// http://officeopenxml.com/WPsectionLineNumbering.php
import { BuilderElement, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, decimalNumber, twipsMeasureValue } from "@util/values";

// <xsd:simpleType name="ST_LineNumberRestart">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="newPage"/>
//   <xsd:enumeration value="newSection"/>
//   <xsd:enumeration value="continuous"/>
// </xsd:restriction>
// </xsd:simpleType>

export const LineNumberRestartFormat = {
    NEW_PAGE: "newPage",
    NEW_SECTION: "newSection",
    CONTINUOUS: "continuous",
} as const;

// <xsd:complexType name="CT_LineNumber">
//     <xsd:attribute name="countBy" type="ST_DecimalNumber" use="optional"/>
//     <xsd:attribute name="start" type="ST_DecimalNumber" use="optional" default="1"/>
//     <xsd:attribute name="distance" type="s:ST_TwipsMeasure" use="optional"/>
//     <xsd:attribute name="restart" type="ST_LineNumberRestart" use="optional" default="newPage"/>
// </xsd:complexType>

export type ILineNumberAttributes = {
    readonly countBy?: number;
    readonly start?: number;
    readonly restart?: (typeof LineNumberRestartFormat)[keyof typeof LineNumberRestartFormat];
    readonly distance?: number | PositiveUniversalMeasure;
};

export const createLineNumberType = ({ countBy, start, restart, distance }: ILineNumberAttributes): XmlComponent =>
    new BuilderElement<ILineNumberAttributes>({
        name: "w:lnNumType",
        attributes: {
            countBy: { key: "w:countBy", value: countBy === undefined ? undefined : decimalNumber(countBy) },
            start: { key: "w:start", value: start === undefined ? undefined : decimalNumber(start) },
            restart: { key: "w:restart", value: restart },
            distance: {
                key: "w:distance",
                value: distance === undefined ? undefined : twipsMeasureValue(distance),
            },
        },
    });
