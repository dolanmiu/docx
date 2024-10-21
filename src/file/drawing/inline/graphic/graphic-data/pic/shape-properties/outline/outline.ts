// http://officeopenxml.com/drwSp-outline.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createNoFill } from "./no-fill";
import { SchemeColor } from "./scheme-color";
import { createSolidFill } from "./solid-fill";

// <xsd:complexType name="CT_TextOutlineEffect">
//     <xsd:sequence>
//         <xsd:group ref="EG_FillProperties" minOccurs="0"/>
//         <xsd:group ref="EG_LineDashProperties" minOccurs="0"/>
//         <xsd:group ref="EG_LineJoinProperties" minOccurs="0"/>
//     </xsd:sequence>
//     <xsd:attribute name="w" use="optional" type="a:ST_LineWidth"/>
//     <xsd:attribute name="cap" use="optional" type="ST_LineCap"/>
//     <xsd:attribute name="cmpd" use="optional" type="ST_CompoundLine"/>
//     <xsd:attribute name="algn" use="optional" type="ST_PenAlignment"/>
// </xsd:complexType>

// <xsd:simpleType name="ST_LineCap">
//     <xsd:restriction base="xsd:string">
//     <xsd:enumeration value="rnd"/>
//     <xsd:enumeration value="sq"/>
//     <xsd:enumeration value="flat"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const LineCap = {
    ROUND: "rnd",
    SQUARE: "sq",
    FLAT: "flat",
} as const;

// <xsd:simpleType name="ST_CompoundLine">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="sng"/>
//         <xsd:enumeration value="dbl"/>
//         <xsd:enumeration value="thickThin"/>
//         <xsd:enumeration value="thinThick"/>
//         <xsd:enumeration value="tri"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const CompoundLine = {
    SINGLE: "sng",
    DOUBLE: "dbl",
    THICK_THIN: "thickThin",
    THIN_THICK: "thinThick",
    TRI: "tri",
} as const;

// <xsd:simpleType name="ST_PenAlignment">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="ctr"/>
//         <xsd:enumeration value="in"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const PenAlignment = {
    CENTER: "ctr",
    INSET: "in",
} as const;

export type OutlineAttributes = {
    readonly width?: number;
    readonly cap?: keyof typeof LineCap;
    readonly compoundLine?: keyof typeof CompoundLine;
    readonly align?: keyof typeof PenAlignment;
};

type OutlineNoFill = {
    readonly type: "noFill";
};

type OutlineRgbSolidFill = {
    readonly type: "solidFill";
    readonly solidFillType: "rgb";
    readonly value: string;
};

type OutlineSchemeSolidFill = {
    readonly type: "solidFill";
    readonly solidFillType: "scheme";
    readonly value: (typeof SchemeColor)[keyof typeof SchemeColor];
};

type OutlineSolidFill = OutlineRgbSolidFill | OutlineSchemeSolidFill;

// <xsd:group name="EG_FillProperties">
//     <xsd:choice>
//         <xsd:element name="noFill" type="w:CT_Empty"/>
//         <xsd:element name="solidFill" type="CT_SolidColorFillProperties"/>
//         <xsd:element name="gradFill" type="CT_GradientFillProperties"/>
//     </xsd:choice>
// </xsd:group>
type OutlineFillProperties = OutlineNoFill | OutlineSolidFill;

export type OutlineOptions = OutlineAttributes & OutlineFillProperties;

export const createOutline = (options: OutlineOptions): XmlComponent =>
    new BuilderElement<OutlineAttributes>({
        name: "a:ln",
        attributes: {
            width: {
                key: "w",
                value: options.width,
            },
            cap: {
                key: "cap",
                value: options.cap,
            },
            compoundLine: {
                key: "cmpd",
                value: options.compoundLine,
            },
            align: {
                key: "algn",
                value: options.align,
            },
        },
        children: [
            options.type === "noFill"
                ? createNoFill()
                : options.solidFillType === "rgb"
                  ? createSolidFill({
                        type: "rgb",
                        value: options.value,
                    })
                  : createSolidFill({
                        type: "scheme",
                        value: options.value,
                    }),
        ],
    });
