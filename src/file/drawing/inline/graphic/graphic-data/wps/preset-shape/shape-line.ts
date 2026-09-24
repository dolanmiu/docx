/**
 * Lines (outlines) for preset shapes, including dashes and arrowheads.
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { createShapeColor } from "./shape-color";
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
    /** Dash pattern. Default is a solid line */
    readonly dash?: LineDash;
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

const EMUS_PER_POINT = 12700;
// ST_LineWidth allows up to 20116800 EMUs
const MAX_LINE_WIDTH_POINTS = 1584;
// How many times the line width an arrowhead is, and its OOXML name (`ST_LineEndWidth` / `ST_LineEndLength`)
const ARROWHEAD_SIZES: Readonly<Record<ArrowheadSize, { readonly factor: number; readonly ooxmlName: string }>> = {
    small: { factor: 2, ooxmlName: "sm" },
    medium: { factor: 3, ooxmlName: "med" },
    large: { factor: 5, ooxmlName: "lg" },
};

const resolveLine = (line: ShapeLine): ShapeLineOptions => (typeof line === "string" ? { color: line } : line);

const lineWidthEmus = ({ width = 1 }: ShapeLineOptions): number => {
    if (!(width >= 0 && width <= MAX_LINE_WIDTH_POINTS)) {
        throw new Error(`Invalid line width ${width}. Expected a number of points from 0 to ${MAX_LINE_WIDTH_POINTS}`);
    }
    return Math.round(width * EMUS_PER_POINT);
};

const resolveArrowhead = (arrowhead: Arrowhead): Exclude<Arrowhead, ArrowheadType> =>
    typeof arrowhead === "string" ? { type: arrowhead } : arrowhead;

const arrowheadFactor = (arrowhead?: Arrowhead): number => {
    if (!arrowhead) {
        return 1;
    }
    const { width = "medium", length = "medium" } = resolveArrowhead(arrowhead);
    return Math.max(ARROWHEAD_SIZES[width].factor, ARROWHEAD_SIZES[length].factor);
};

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
 * @throws If the colour, width or transparency is invalid
 */
export const createShapeLine = (line: ShapeLine = {}): XmlComponent => {
    if (line === "none") {
        return new BuilderElement({ name: "a:ln", children: [createNoFill()] });
    }

    const options = resolveLine(line);

    return new BuilderElement<{ readonly width: number }>({
        name: "a:ln",
        attributes: {
            width: { key: "w", value: lineWidthEmus(options) },
        },
        children: [
            new BuilderElement({ name: "a:solidFill", children: [createShapeColor(options.color ?? "000000", options.transparency)] }),
            ...(options.dash
                ? [
                      new BuilderElement<{ readonly value: string }>({
                          name: "a:prstDash",
                          attributes: { value: { key: "val", value: LINE_DASH_OOXML_NAMES[options.dash] } },
                      }),
                  ]
                : []),
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
