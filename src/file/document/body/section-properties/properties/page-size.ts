import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { twipsMeasureValue } from "@util/values";

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
export interface IPageSizeAttributes {
    readonly width?: number | string;
    readonly height?: number | string;
    readonly orientation?: PageOrientation;
}

export class PageSizeAttributes extends XmlAttributeComponent<IPageSizeAttributes> {
    protected readonly xmlKeys = {
        width: "w:w",
        height: "w:h",
        orientation: "w:orient",
    };
}

export class PageSize extends XmlComponent {
    public constructor(width: number | string, height: number | string, orientation: PageOrientation) {
        super("w:pgSz");

        const flip = orientation === PageOrientation.LANDSCAPE;

        const widthTwips = twipsMeasureValue(width);
        const heightTwips = twipsMeasureValue(height);

        this.root.push(
            new PageSizeAttributes({
                width: flip ? heightTwips : widthTwips,
                height: flip ? widthTwips : heightTwips,
                orientation: orientation,
            }),
        );
    }
}
