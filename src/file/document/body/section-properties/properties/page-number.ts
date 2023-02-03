// http://officeopenxml.com/WPSectionPgNumType.php
import { NumberFormat } from "@file/shared/number-format";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

// <xsd:simpleType name="ST_ChapterSep">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="hyphen"/>
//   <xsd:enumeration value="period"/>
//   <xsd:enumeration value="colon"/>
//   <xsd:enumeration value="emDash"/>
//   <xsd:enumeration value="enDash"/>
// </xsd:restriction>
// </xsd:simpleType>
export enum PageNumberSeparator {
    HYPHEN = "hyphen",
    PERIOD = "period",
    COLON = "colon",
    EM_DASH = "emDash",
    EN_DASH = "endash",
}

export interface IPageNumberTypeAttributes {
    readonly start?: number;
    readonly formatType?: NumberFormat;
    readonly separator?: PageNumberSeparator;
}

// <xsd:complexType name="CT_PageNumber">
//     <xsd:attribute name="fmt" type="ST_NumberFormat" use="optional" default="decimal"/>
//     <xsd:attribute name="start" type="ST_DecimalNumber" use="optional"/>
//     <xsd:attribute name="chapStyle" type="ST_DecimalNumber" use="optional"/>
//     <xsd:attribute name="chapSep" type="ST_ChapterSep" use="optional" default="hyphen"/>
// </xsd:complexType>

export class PageNumberTypeAttributes extends XmlAttributeComponent<IPageNumberTypeAttributes> {
    protected readonly xmlKeys = {
        start: "w:start",
        formatType: "w:fmt",
        separator: "w:chapSep",
    };
}
export class PageNumberType extends XmlComponent {
    public constructor({ start, formatType, separator }: IPageNumberTypeAttributes) {
        super("w:pgNumType");
        this.root.push(
            new PageNumberTypeAttributes({
                start: start === undefined ? undefined : decimalNumber(start),
                formatType,
                separator,
            }),
        );
    }
}
