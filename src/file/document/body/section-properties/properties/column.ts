import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

// <xsd:complexType name="CT_Column">
//     <xsd:attribute name="w" type="s:ST_TwipsMeasure" use="optional" />
//     <xsd:attribute name="space" type="s:ST_TwipsMeasure" use="optional" default="0" />
// </xsd:complexType>

type IColumnAttributes = {
    readonly width: number | PositiveUniversalMeasure;
    readonly space?: number | PositiveUniversalMeasure;
};

export class Column extends XmlComponent {
    public constructor({ width, space }: IColumnAttributes) {
        super("w:col");
        this.root.push(
            new NextAttributeComponent<IColumnAttributes>({
                width: { key: "w:w", value: twipsMeasureValue(width) },
                space: { key: "w:space", value: space === undefined ? undefined : twipsMeasureValue(space) },
            }),
        );
    }
}
