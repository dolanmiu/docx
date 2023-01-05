// http://officeopenxml.com/WPindentation.php
import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, signedTwipsMeasureValue, twipsMeasureValue, UniversalMeasure } from "@util/values";

export interface IIndentAttributesProperties {
    readonly start?: number | UniversalMeasure;
    readonly end?: number | UniversalMeasure;
    readonly left?: number | UniversalMeasure;
    readonly right?: number | UniversalMeasure;
    readonly hanging?: number | PositiveUniversalMeasure;
    readonly firstLine?: number | PositiveUniversalMeasure;
}

// <xsd:complexType name="CT_PPrBase">
// <xsd:sequence>
//     ...
//     <xsd:element name="ind" type="CT_Ind" minOccurs="0"/>
export class Indent extends XmlComponent {
    public constructor({ start, end, left, right, hanging, firstLine }: IIndentAttributesProperties) {
        super("w:ind");
        // <xsd:complexType name="CT_Ind">
        //     <xsd:attribute name="start" type="ST_SignedTwipsMeasure" use="optional"/>
        //     <xsd:attribute name="startChars" type="ST_DecimalNumber" use="optional"/>
        //     <xsd:attribute name="end" type="ST_SignedTwipsMeasure" use="optional"/>
        //     <xsd:attribute name="endChars" type="ST_DecimalNumber" use="optional"/>
        //     <xsd:attribute name="left" type="ST_SignedTwipsMeasure" use="optional"/>
        //     <xsd:attribute name="leftChars" type="ST_DecimalNumber" use="optional"/>
        //     <xsd:attribute name="right" type="ST_SignedTwipsMeasure" use="optional"/>
        //     <xsd:attribute name="rightChars" type="ST_DecimalNumber" use="optional"/>
        //     <xsd:attribute name="hanging" type="s:ST_TwipsMeasure" use="optional"/>
        //     <xsd:attribute name="hangingChars" type="ST_DecimalNumber" use="optional"/>
        //     <xsd:attribute name="firstLine" type="s:ST_TwipsMeasure" use="optional"/>
        //     <xsd:attribute name="firstLineChars" type="ST_DecimalNumber" use="optional"/>
        // </xsd:complexType>
        this.root.push(
            new NextAttributeComponent<{
                readonly start?: number | UniversalMeasure;
                readonly end?: number | UniversalMeasure;
                readonly left?: number | UniversalMeasure;
                readonly right?: number | UniversalMeasure;
                readonly hanging?: number | PositiveUniversalMeasure;
                readonly firstLine?: number | PositiveUniversalMeasure;
            }>({
                start: {
                    key: "w:start",
                    value: start === undefined ? undefined : signedTwipsMeasureValue(start),
                },
                end: {
                    key: "w:end",
                    value: end === undefined ? undefined : signedTwipsMeasureValue(end),
                },
                left: {
                    key: "w:left",
                    value: left === undefined ? undefined : signedTwipsMeasureValue(left),
                },
                right: {
                    key: "w:right",
                    value: right === undefined ? undefined : signedTwipsMeasureValue(right),
                },
                hanging: {
                    key: "w:hanging",
                    value: hanging === undefined ? undefined : twipsMeasureValue(hanging),
                },
                firstLine: {
                    key: "w:firstLine",
                    value: firstLine === undefined ? undefined : twipsMeasureValue(firstLine),
                },
            }),
        );
    }
}
