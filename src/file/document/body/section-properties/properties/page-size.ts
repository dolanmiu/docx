import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

// <xsd:simpleType name="ST_PageOrientation">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="portrait"/>
//   <xsd:enumeration value="landscape"/>
// </xsd:restriction>
// </xsd:simpleType>
export enum PageOrientation {
    PORTRAIT = "portrait",
    LANDSCAPE = "landscape",
}

// <xsd:complexType name="CT_PageSz">
//     <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
//     <xsd:attribute name="h" type="s:ST_TwipsMeasure"/>
//     <xsd:attribute name="orient" type="ST_PageOrientation" use="optional"/>
//     <xsd:attribute name="code" type="ST_DecimalNumber" use="optional"/>
// </xsd:complexType>
export type IPageSizeAttributes = {
    readonly width?: number | PositiveUniversalMeasure;
    readonly height?: number | PositiveUniversalMeasure;
    readonly orientation?: PageOrientation;
};

export class PageSize extends XmlComponent {
    public constructor(width: number | PositiveUniversalMeasure, height: number | PositiveUniversalMeasure, orientation: PageOrientation) {
        super("w:pgSz");

        const flip = orientation === PageOrientation.LANDSCAPE;

        const widthTwips = twipsMeasureValue(width);
        const heightTwips = twipsMeasureValue(height);

        this.root.push(
            new NextAttributeComponent<IPageSizeAttributes>({
                width: { key: "w:w", value: flip ? heightTwips : widthTwips },
                height: { key: "w:h", value: flip ? widthTwips : heightTwips },
                orientation: { key: "w:orient", value: orientation },
            }),
        );
    }
}
