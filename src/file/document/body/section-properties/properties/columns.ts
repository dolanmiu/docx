import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber, PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

import { Column } from "./column";

// <xsd:complexType name="CT_Columns">
//     <xsd:sequence minOccurs="0">
//         <xsd:element name="col" type="CT_Column" maxOccurs="45"/>
//     </xsd:sequence>
//     <xsd:attribute name="equalWidth" type="s:ST_OnOff" use="optional"/>
//     <xsd:attribute name="space" type="s:ST_TwipsMeasure" use="optional" default="720"/>
//     <xsd:attribute name="num" type="ST_DecimalNumber" use="optional" default="1"/>
//     <xsd:attribute name="sep" type="s:ST_OnOff" use="optional"/>
// </xsd:complexType>
export type IColumnsAttributes = {
    readonly space?: number | PositiveUniversalMeasure;
    readonly count?: number;
    readonly separate?: boolean;
    readonly equalWidth?: boolean;
    readonly children?: readonly Column[];
};

export class Columns extends XmlComponent {
    public constructor({ space, count, separate, equalWidth, children }: IColumnsAttributes) {
        super("w:cols");
        this.root.push(
            new NextAttributeComponent<Omit<IColumnsAttributes, "children">>({
                space: { key: "w:space", value: space === undefined ? undefined : twipsMeasureValue(space) },
                count: { key: "w:num", value: count === undefined ? undefined : decimalNumber(count) },
                separate: { key: "w:sep", value: separate },
                equalWidth: { key: "w:equalWidth", value: equalWidth },
            }),
        );

        if (!equalWidth && children) {
            children.forEach((column) => this.addChildElement(column));
        }
    }
}
