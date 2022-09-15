import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber, twipsMeasureValue } from "@util/values";

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
export interface IColumnsAttributes {
    readonly space?: number | string;
    readonly count?: number;
    readonly separate?: boolean;
    readonly equalWidth?: boolean;
    readonly children?: readonly Column[];
}

export class ColumnsAttributes extends XmlAttributeComponent<IColumnsAttributes> {
    protected readonly xmlKeys = {
        space: "w:space",
        count: "w:num",
        separate: "w:sep",
        equalWidth: "w:equalWidth",
    };
}

export class Columns extends XmlComponent {
    public constructor({ space, count, separate, equalWidth, children }: IColumnsAttributes) {
        super("w:cols");
        this.root.push(
            new ColumnsAttributes({
                space: space === undefined ? undefined : twipsMeasureValue(space),
                count: count === undefined ? undefined : decimalNumber(count),
                separate,
                equalWidth,
            }),
        );

        if (!equalWidth && children) {
            children.forEach((column) => this.addChildElement(column));
        }
    }
}
