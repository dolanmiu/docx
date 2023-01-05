import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, signedTwipsMeasureValue, twipsMeasureValue, UniversalMeasure } from "@util/values";

// <xsd:complexType name="CT_PageMar">
//     <xsd:attribute name="top" type="ST_SignedTwipsMeasure" use="required"/>
//     <xsd:attribute name="right" type="s:ST_TwipsMeasure" use="required"/>
//     <xsd:attribute name="bottom" type="ST_SignedTwipsMeasure" use="required"/>
//     <xsd:attribute name="left" type="s:ST_TwipsMeasure" use="required"/>
//     <xsd:attribute name="header" type="s:ST_TwipsMeasure" use="required"/>
//     <xsd:attribute name="footer" type="s:ST_TwipsMeasure" use="required"/>
//     <xsd:attribute name="gutter" type="s:ST_TwipsMeasure" use="required"/>
// </xsd:complexType>
export type IPageMarginAttributes = {
    readonly top?: number | UniversalMeasure;
    readonly right?: number | PositiveUniversalMeasure;
    readonly bottom?: number | UniversalMeasure;
    readonly left?: number | PositiveUniversalMeasure;
    readonly header?: number | PositiveUniversalMeasure;
    readonly footer?: number | PositiveUniversalMeasure;
    readonly gutter?: number | PositiveUniversalMeasure;
};

export class PageMargin extends XmlComponent {
    public constructor(
        top: number | UniversalMeasure,
        right: number | PositiveUniversalMeasure,
        bottom: number | UniversalMeasure,
        left: number | PositiveUniversalMeasure,
        header: number | PositiveUniversalMeasure,
        footer: number | PositiveUniversalMeasure,
        gutter: number | PositiveUniversalMeasure,
    ) {
        super("w:pgMar");
        this.root.push(
            new NextAttributeComponent<IPageMarginAttributes>({
                top: { key: "w:top", value: signedTwipsMeasureValue(top) },
                right: { key: "w:right", value: twipsMeasureValue(right) },
                bottom: { key: "w:bottom", value: signedTwipsMeasureValue(bottom) },
                left: { key: "w:left", value: twipsMeasureValue(left) },
                header: { key: "w:header", value: twipsMeasureValue(header) },
                footer: { key: "w:footer", value: twipsMeasureValue(footer) },
                gutter: { key: "w:gutter", value: twipsMeasureValue(gutter) },
            }),
        );
    }
}
