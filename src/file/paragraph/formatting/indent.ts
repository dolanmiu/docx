// http://officeopenxml.com/WPindentation.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { signedTwipsMeasureValue, twipsMeasureValue } from "@util/values";

export interface IIndentAttributesProperties {
    readonly start?: number | string;
    readonly end?: number | string;
    readonly left?: number | string;
    readonly right?: number | string;
    readonly hanging?: number | string;
    readonly firstLine?: number | string;
}

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
class IndentAttributes extends XmlAttributeComponent<IIndentAttributesProperties> {
    protected readonly xmlKeys = {
        start: "w:start",
        end: "w:end",
        left: "w:left",
        right: "w:right",
        hanging: "w:hanging",
        firstLine: "w:firstLine",
    };
}

// <xsd:complexType name="CT_PPrBase">
// <xsd:sequence>
//     ...
//     <xsd:element name="ind" type="CT_Ind" minOccurs="0"/>
export class Indent extends XmlComponent {
    public constructor({ start, end, left, right, hanging, firstLine }: IIndentAttributesProperties) {
        super("w:ind");
        this.root.push(
            new IndentAttributes({
                start: start === undefined ? undefined : signedTwipsMeasureValue(start),
                end: end === undefined ? undefined : signedTwipsMeasureValue(end),
                left: left === undefined ? undefined : signedTwipsMeasureValue(left),
                right: right === undefined ? undefined : signedTwipsMeasureValue(right),
                hanging: hanging === undefined ? undefined : twipsMeasureValue(hanging),
                firstLine: firstLine === undefined ? undefined : twipsMeasureValue(firstLine),
            }),
        );
    }
}
