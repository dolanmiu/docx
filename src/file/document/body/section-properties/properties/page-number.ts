// http://officeopenxml.com/WPSectionPgNumType.php
import { NumberFormat } from "@file/shared/number-format";
import { BuilderElement, XmlComponent } from "@file/xml-components";
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

export const PageNumberSeparator = {
    HYPHEN: "hyphen",
    PERIOD: "period",
    COLON: "colon",
    EM_DASH: "emDash",
    EN_DASH: "endash",
} as const;

export type IPageNumberTypeAttributes = {
    readonly start?: number;
    readonly formatType?: (typeof NumberFormat)[keyof typeof NumberFormat];
    readonly separator?: (typeof PageNumberSeparator)[keyof typeof PageNumberSeparator];
};

// <xsd:complexType name="CT_PageNumber">
//     <xsd:attribute name="fmt" type="ST_NumberFormat" use="optional" default="decimal"/>
//     <xsd:attribute name="start" type="ST_DecimalNumber" use="optional"/>
//     <xsd:attribute name="chapStyle" type="ST_DecimalNumber" use="optional"/>
//     <xsd:attribute name="chapSep" type="ST_ChapterSep" use="optional" default="hyphen"/>
// </xsd:complexType>

export const createPageNumberType = ({ start, formatType, separator }: IPageNumberTypeAttributes): XmlComponent =>
    new BuilderElement<IPageNumberTypeAttributes>({
        name: "w:pgNumType",
        attributes: {
            start: { key: "w:start", value: start === undefined ? undefined : decimalNumber(start) },
            formatType: { key: "w:fmt", value: formatType },
            separator: { key: "w:chapSep", value: separator },
        },
    });
