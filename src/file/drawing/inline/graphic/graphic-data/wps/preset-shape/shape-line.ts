/**
 * Lines (outlines) for preset shapes, including dashes and arrowheads.
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { createShapeColor } from "./shape-color";
import { type GradientShapeFill, createShapeFill } from "./shape-fill";
import { pointsToEmus } from "./shape-units";
import { createNoFill } from "../../pic/shape-properties/outline/no-fill";

/* cspell:disable */
// Each dash pattern mapped to its OOXML name (`ST_PresetLineDashVal`). The "short" patterns are the ones OOXML calls "sys"
const LINE_DASH_OOXML_NAMES = {
    solid: "solid",
    dot: "dot",
    dash: "dash",
    longDash: "lgDash",
    dashDot: "dashDot",
    longDashDot: "lgDashDot",
    longDashDotDot: "lgDashDotDot",
    shortDash: "sysDash",
    shortDot: "sysDot",
    shortDashDot: "sysDashDot",
    shortDashDotDot: "sysDashDotDot",
} as const;
/* cspell:enable */

/**
 * A preset dash pattern.
 *
 * @publicApi
 */
export type LineDash = keyof typeof LINE_DASH_OOXML_NAMES;

/**
 * A dash pattern of your own: dashes and gaps, repeated along the line.
 *
 * @publicApi
 */
export type CustomLineDash = readonly {
    /** Length of the dash, in multiples of the line width */
    readonly length: number;
    /** Length of the gap after the dash, in multiples of the line width */
    readonly gap: number;
}[];

/**
 * The shape of the ends of a line, and of the ends of each dash.
 *
 * - `"flat"`: the line stops at its end point
 * - `"round"`: a half circle past the end point
 * - `"square"`: a half square past the end point
 *
 * @publicApi
 */
export type ShapeLineCap = "flat" | "round" | "square";

// OOXML names (`ST_LineCap`)
const LINE_CAP_OOXML_NAMES: Readonly<Record<ShapeLineCap, string>> = { flat: "flat", round: "rnd", square: "sq" };

/**
 * The shape of the corners where a line turns.
 *
 * - `"miter"`: sharp corners
 * - `"round"`: rounded corners
 * - `"bevel"`: corners cut off square
 *
 * @publicApi
 */
export type ShapeLineJoin = "miter" | "round" | "bevel";

/**
 * A line drawn as one or more parallel lines.
 *
 * - `"single"`: one line
 * - `"double"`: two lines of the same width
 * - `"thickThin"`: a thick line and a thin one
 * - `"thinThick"`: a thin line and a thick one
 * - `"triple"`: three lines, the middle one thicker
 *
 * @publicApi
 */
export type ShapeCompoundLine = "single" | "double" | "thickThin" | "thinThick" | "triple";

/* cspell:disable */
// OOXML names (`ST_CompoundLine`)
const COMPOUND_LINE_OOXML_NAMES: Readonly<Record<ShapeCompoundLine, string>> = {
    single: "sng",
    double: "dbl",
    thickThin: "thickThin",
    thinThick: "thinThick",
    triple: "tri",
};
/* cspell:enable */

/**
 * The style of an arrowhead (`ST_LineEndType`).
 *
 * @publicApi
 */
export type ArrowheadType = "triangle" | "stealth" | "diamond" | "oval" | "arrow";

/**
 * The size of an arrowhead relative to the line width.
 *
 * @publicApi
 */
export type ArrowheadSize = "small" | "medium" | "large";

/**
 * An arrowhead at one end of a line: a style, or a style with a size.
 *
 * @publicApi
 */
export type Arrowhead =
    | ArrowheadType
    | {
          readonly type: ArrowheadType;
          /** Width of the arrowhead. Default is `"medium"` */
          readonly width?: ArrowheadSize;
          /** Length of the arrowhead. Default is `"medium"` */
          readonly length?: ArrowheadSize;
      };

/**
 * Line options for a shape.
 *
 * @publicApi
 */
export type ShapeLineOptions = {
    /** A 6-digit hex colour such as `"FF0000"`. Default is `"000000"` */
    readonly color?: string;
    /** Line width in points, from 0 to 1584. Default is 1 */
    readonly width?: number;
    /** From 0 (opaque) to 100 (invisible) */
    readonly transparency?: number;
    /** Colours the line with a gradient instead of `color` */
    readonly gradient?: Omit<GradientShapeFill, "type">;
    /** A preset dash pattern, or dashes and gaps of your own. Default is a solid line */
    readonly dash?: LineDash | CustomLineDash;
    /** The shape of the line's ends and of the ends of each dash */
    readonly cap?: ShapeLineCap;
    /** The shape of the corners where the line turns */
    readonly join?: ShapeLineJoin;
    /** Draws the line as two or three parallel lines within its width. Default is `"single"` */
    readonly compound?: ShapeCompoundLine;
    /** Arrowhead at the start of the line */
    readonly startArrow?: Arrowhead;
    /** Arrowhead at the end of the line */
    readonly endArrow?: Arrowhead;
};

/**
 * A shape's line: a hex colour, `"none"`, or line options.
 *
 * @publicApi
 */
export type ShapeLine = string | ShapeLineOptions;

// How many times the line width an arrowhead is, and its OOXML name (`ST_LineEndWidth` / `ST_LineEndLength`)
const ARROWHEAD_SIZES: Readonly<Record<ArrowheadSize, { readonly factor: number; readonly ooxmlName: string }>> = {
    small: { factor: 2, ooxmlName: "sm" },
    medium: { factor: 3, ooxmlName: "med" },
    large: { factor: 5, ooxmlName: "lg" },
};

const resolveLine = (line: ShapeLine): ShapeLineOptions => (typeof line === "string" ? { color: line } : line);

const lineWidthEmus = ({ width = 1 }: ShapeLineOptions): number => pointsToEmus(width, "line width");

const resolveArrowhead = (arrowhead: Arrowhead): Exclude<Arrowhead, ArrowheadType> =>
    typeof arrowhead === "string" ? { type: arrowhead } : arrowhead;

const arrowheadFactor = (arrowhead?: Arrowhead): number => {
    if (!arrowhead) {
        return 1;
    }
    const { width = "medium", length = "medium" } = resolveArrowhead(arrowhead);
    return Math.max(ARROWHEAD_SIZES[width].factor, ARROWHEAD_SIZES[length].factor);
};

// <xsd:group name="EG_LineDashProperties">
//     <xsd:choice>
//         <xsd:element name="prstDash" type="CT_PresetLineDashProperties" minOccurs="1" maxOccurs="1"/>
//         <xsd:element name="custDash" type="CT_DashStopList" minOccurs="1" maxOccurs="1"/>
//     </xsd:choice>
// </xsd:group>
const createDash = (dash: LineDash | CustomLineDash): XmlComponent => {
    if (typeof dash === "string") {
        return new BuilderElement<{ readonly value: string }>({
            name: "a:prstDash",
            attributes: { value: { key: "val", value: LINE_DASH_OOXML_NAMES[dash] } },
        });
    }

    if (dash.length === 0) {
        throw new Error("Invalid custom line dash. Expected at least 1 dash");
    }
    return new BuilderElement({
        name: "a:custDash",
        children: dash.map(({ length, gap }) => {
            if (!(length >= 0 && gap >= 0)) {
                throw new Error(`Invalid custom line dash { length: ${length}, gap: ${gap} }. Expected lengths of 0 or more`);
            }
            return new BuilderElement<{ readonly length: number; readonly gap: number }>({
                name: "a:ds",
                attributes: {
                    // Thousandths of a percent of the line width
                    length: { key: "d", value: Math.round(length * 100000) },
                    gap: { key: "sp", value: Math.round(gap * 100000) },
                },
            });
        }),
    });
};

// <xsd:group name="EG_LineJoinProperties">
//     <xsd:choice>
//         <xsd:element name="round" type="CT_LineJoinRound" minOccurs="1" maxOccurs="1"/>
//         <xsd:element name="bevel" type="CT_LineJoinBevel" minOccurs="1" maxOccurs="1"/>
//         <xsd:element name="miter" type="CT_LineJoinMiterProperties" minOccurs="1" maxOccurs="1"/>
//     </xsd:choice>
// </xsd:group>
const createJoin = (join: ShapeLineJoin): XmlComponent =>
    join === "miter"
        ? // Word's miter limit: corners sharper than about 29 degrees are cut off
          new BuilderElement<{ readonly limit: number }>({ name: "a:miter", attributes: { limit: { key: "lim", value: 800000 } } })
        : new BuilderElement({ name: `a:${join}` });

// <xsd:complexType name="CT_LineEndProperties">
//     <xsd:attribute name="type" type="ST_LineEndType" use="optional" default="none"/>
//     <xsd:attribute name="w" type="ST_LineEndWidth" use="optional"/>
//     <xsd:attribute name="len" type="ST_LineEndLength" use="optional"/>
// </xsd:complexType>
const createLineEnd = (name: "a:headEnd" | "a:tailEnd", arrowhead: Arrowhead): XmlComponent => {
    const { type, width, length } = resolveArrowhead(arrowhead);
    return new BuilderElement<{ readonly type: ArrowheadType; readonly width?: string; readonly length?: string }>({
        name,
        attributes: {
            type: { key: "type", value: type },
            width: { key: "w", value: width && ARROWHEAD_SIZES[width].ooxmlName },
            length: { key: "len", value: length && ARROWHEAD_SIZES[length].ooxmlName },
        },
    });
};

/**
 * Creates the `a:ln` element for a preset shape.
 *
 * - `undefined` writes a solid black line 1pt wide
 * - `"none"` writes `<a:ln><a:noFill/></a:ln>`
 * - A hex colour writes a solid line 1pt wide in that colour
 * - A `gradient` writes `<a:gradFill>` in place of the line's colour
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_LineProperties">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_LineFillProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_LineDashProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_LineJoinProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="headEnd" type="CT_LineEndProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tailEnd" type="CT_LineEndProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="w" type="ST_LineWidth" use="optional"/>
 *   <xsd:attribute name="cap" type="ST_LineCap" use="optional"/>
 *   <xsd:attribute name="cmpd" type="ST_CompoundLine" use="optional"/>
 *   <xsd:attribute name="algn" type="ST_PenAlignment" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @throws If the colour, width, transparency, gradient or custom dash is invalid
 */
export const createShapeLine = (line: ShapeLine = {}): XmlComponent => {
    if (line === "none") {
        return new BuilderElement({ name: "a:ln", children: [createNoFill()] });
    }

    const options = resolveLine(line);

    return new BuilderElement<{ readonly width: number; readonly cap?: string; readonly compound?: string }>({
        name: "a:ln",
        attributes: {
            width: { key: "w", value: lineWidthEmus(options) },
            cap: { key: "cap", value: options.cap && LINE_CAP_OOXML_NAMES[options.cap] },
            compound: { key: "cmpd", value: options.compound && COMPOUND_LINE_OOXML_NAMES[options.compound] },
        },
        children: [
            options.gradient
                ? createShapeFill({ type: "gradient", ...options.gradient })
                : new BuilderElement({
                      name: "a:solidFill",
                      children: [createShapeColor(options.color ?? "000000", options.transparency)],
                  }),
            ...(options.dash ? [createDash(options.dash)] : []),
            ...(options.join ? [createJoin(options.join)] : []),
            // In DrawingML the "head" is the start of the path and the "tail" is its end
            ...(options.startArrow ? [createLineEnd("a:headEnd", options.startArrow)] : []),
            ...(options.endArrow ? [createLineEnd("a:tailEnd", options.endArrow)] : []),
        ],
    });
};

/**
 * How far, in EMUs, a shape's line (and its arrowheads) can reach past the shape's box.
 * Used for the drawing's `wp:effectExtent` so thick lines and arrowheads are not clipped.
 */
export const getShapeLineOverhang = (line: ShapeLine = {}): number => {
    if (line === "none") {
        return 0;
    }

    const options = resolveLine(line);
    const factor = Math.max(arrowheadFactor(options.startArrow), arrowheadFactor(options.endArrow));

    return Math.ceil((lineWidthEmus(options) * factor) / 2);
};
