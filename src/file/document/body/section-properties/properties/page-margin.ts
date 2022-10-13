import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { signedTwipsMeasureValue, twipsMeasureValue } from "@util/values";

// <xsd:complexType name="CT_PageMar">
//     <xsd:attribute name="top" type="ST_SignedTwipsMeasure" use="required"/>
//     <xsd:attribute name="right" type="s:ST_TwipsMeasure" use="required"/>
//     <xsd:attribute name="bottom" type="ST_SignedTwipsMeasure" use="required"/>
//     <xsd:attribute name="left" type="s:ST_TwipsMeasure" use="required"/>
//     <xsd:attribute name="header" type="s:ST_TwipsMeasure" use="required"/>
//     <xsd:attribute name="footer" type="s:ST_TwipsMeasure" use="required"/>
//     <xsd:attribute name="gutter" type="s:ST_TwipsMeasure" use="required"/>
// </xsd:complexType>
export interface IPageMarginAttributes {
    readonly top?: number | string;
    readonly right?: number | string;
    readonly bottom?: number | string;
    readonly left?: number | string;
    readonly header?: number | string;
    readonly footer?: number | string;
    readonly gutter?: number | string;
}

export class PageMarginAttributes extends XmlAttributeComponent<IPageMarginAttributes> {
    protected readonly xmlKeys = {
        top: "w:top",
        right: "w:right",
        bottom: "w:bottom",
        left: "w:left",
        header: "w:header",
        footer: "w:footer",
        gutter: "w:gutter",
    };
}

export class PageMargin extends XmlComponent {
    public constructor(
        top: number | string,
        right: number | string,
        bottom: number | string,
        left: number | string,
        header: number | string,
        footer: number | string,
        gutter: number | string,
    ) {
        super("w:pgMar");
        this.root.push(
            new PageMarginAttributes({
                top: signedTwipsMeasureValue(top),
                right: twipsMeasureValue(right),
                bottom: signedTwipsMeasureValue(bottom),
                left: twipsMeasureValue(left),
                header: twipsMeasureValue(header),
                footer: twipsMeasureValue(footer),
                gutter: twipsMeasureValue(gutter),
            }),
        );
    }
}
