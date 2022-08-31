// Note that the shading type is identical in all places,
// regardless of where it's used like paragraph/table/etc.
//
// http://officeopenxml.com/WPshading.php
// http://officeopenxml.com/WPtableShading.php
// http://officeopenxml.com/WPtableCellProperties-Shading.php
//
// This describes the CT_Shd type.
// <xsd:complexType name="CT_Shd">
//     <xsd:attribute name="val" type="ST_Shd" use="required"/>
//     <xsd:attribute name="color" type="ST_HexColor" use="optional"/>
//     <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
//     <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
//     <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
//     <xsd:attribute name="fill" type="ST_HexColor" use="optional"/>
//     <xsd:attribute name="themeFill" type="ST_ThemeColor" use="optional"/>
//     <xsd:attribute name="themeFillTint" type="ST_UcharHexNumber" use="optional"/>
//     <xsd:attribute name="themeFillShade" type="ST_UcharHexNumber" use="optional"/>
// </xsd:complexType>
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { hexColorValue } from "@util/values";

export interface IShadingAttributesProperties {
    readonly fill?: string;
    readonly color?: string;
    readonly type?: ShadingType;
}

class ShadingAttributes extends XmlAttributeComponent<IShadingAttributesProperties> {
    protected readonly xmlKeys = {
        fill: "w:fill",
        color: "w:color",
        type: "w:val",
    };
}

export class Shading extends XmlComponent {
    public constructor({ fill, color, type }: IShadingAttributesProperties) {
        super("w:shd");
        this.root.push(
            new ShadingAttributes({
                fill: fill === undefined ? undefined : hexColorValue(fill),
                color: color === undefined ? undefined : hexColorValue(color),
                type,
            }),
        );
    }
}

export enum ShadingType {
    CLEAR = "clear",
    DIAGONAL_CROSS = "diagCross",
    DIAGONAL_STRIPE = "diagStripe",
    HORIZONTAL_CROSS = "horzCross",
    HORIZONTAL_STRIPE = "horzStripe",
    NIL = "nil",
    PERCENT_5 = "pct5",
    PERCENT_10 = "pct10",
    PERCENT_12 = "pct12",
    PERCENT_15 = "pct15",
    PERCENT_20 = "pct20",
    PERCENT_25 = "pct25",
    PERCENT_30 = "pct30",
    PERCENT_35 = "pct35",
    PERCENT_37 = "pct37",
    PERCENT_40 = "pct40",
    PERCENT_45 = "pct45",
    PERCENT_50 = "pct50",
    PERCENT_55 = "pct55",
    PERCENT_60 = "pct60",
    PERCENT_62 = "pct62",
    PERCENT_65 = "pct65",
    PERCENT_70 = "pct70",
    PERCENT_75 = "pct75",
    PERCENT_80 = "pct80",
    PERCENT_85 = "pct85",
    PERCENT_87 = "pct87",
    PERCENT_90 = "pct90",
    PERCENT_95 = "pct95",
    REVERSE_DIAGONAL_STRIPE = "reverseDiagStripe",
    SOLID = "solid",
    THIN_DIAGONAL_CROSS = "thinDiagCross",
    THIN_DIAGONAL_STRIPE = "thinDiagStripe",
    THIN_HORIZONTAL_CROSS = "thinHorzCross",
    THIN_REVERSE_DIAGONAL_STRIPE = "thinReverseDiagStripe",
    THIN_VERTICAL_STRIPE = "thinVertStripe",
    VERTICAL_STRIPE = "vertStripe",
}
