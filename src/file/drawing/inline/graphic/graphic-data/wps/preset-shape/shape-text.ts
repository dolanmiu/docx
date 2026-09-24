/**
 * Text layout inside preset shapes (`wps:bodyPr`): alignment, margins, wrapping, autofit, direction, columns and warps.
 *
 * Reference: ECMA-376 Part 1, 21.1.2.1.1 bodyPr (Body Properties)
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { pointsToEmus } from "./shape-units";

/**
 * Where text sits between the top and bottom of a shape.
 *
 * @publicApi
 */
export type ShapeTextVerticalAlignment = "top" | "center" | "bottom";

// OOXML names (`ST_TextAnchoringType`)
const VERTICAL_ALIGNMENT_OOXML_NAMES: Readonly<Record<ShapeTextVerticalAlignment, string>> = { top: "t", center: "ctr", bottom: "b" };

/* cspell:disable */
// Each text direction mapped to its OOXML name (`ST_TextVerticalType`)
const TEXT_DIRECTION_OOXML_NAMES = {
    horizontal: "horz",
    topToBottom: "vert",
    bottomToTop: "vert270",
    stacked: "wordArtVert",
    stackedRightToLeft: "wordArtVertRtl",
    eastAsianVertical: "eaVert",
    mongolianVertical: "mongolianVert",
} as const;
/* cspell:enable */

/**
 * The direction text runs in inside a shape.
 *
 * - `"horizontal"`: left to right, the default
 * - `"topToBottom"`: turned a quarter turn clockwise, so each line reads downwards
 * - `"bottomToTop"`: turned a quarter turn anticlockwise, so each line reads upwards
 * - `"stacked"`: upright letters stacked one below the other, with lines running left to right
 * - `"stackedRightToLeft"`: upright letters stacked one below the other, with lines running right to left
 * - `"eastAsianVertical"`: East Asian characters upright and other text turned, with lines running right to left
 * - `"mongolianVertical"`: as `"eastAsianVertical"`, with lines running left to right
 *
 * @publicApi
 */
export type ShapeTextDirection = keyof typeof TEXT_DIRECTION_OOXML_NAMES;

/* cspell:disable */
// Each warp mapped to its OOXML name (`ST_TextShapeType`)
const TEXT_WARP_OOXML_NAMES = {
    square: "textPlain",
    stop: "textStop",
    triangleUp: "textTriangle",
    triangleDown: "textTriangleInverted",
    chevronUp: "textChevron",
    chevronDown: "textChevronInverted",
    ringInside: "textRingInside",
    ringOutside: "textRingOutside",
    archUp: "textArchUp",
    archDown: "textArchDown",
    circle: "textCircle",
    button: "textButton",
    archUpFilled: "textArchUpPour",
    archDownFilled: "textArchDownPour",
    circleFilled: "textCirclePour",
    buttonFilled: "textButtonPour",
    curveUp: "textCurveUp",
    curveDown: "textCurveDown",
    canUp: "textCanUp",
    canDown: "textCanDown",
    wave: "textWave1",
    waveInverted: "textWave2",
    doubleWave: "textDoubleWave1",
    doubleWaveInverted: "textWave4",
    inflate: "textInflate",
    deflate: "textDeflate",
    inflateBottom: "textInflateBottom",
    deflateBottom: "textDeflateBottom",
    inflateTop: "textInflateTop",
    deflateTop: "textDeflateTop",
    deflateInflate: "textDeflateInflate",
    deflateInflateDeflate: "textDeflateInflateDeflate",
    fadeRight: "textFadeRight",
    fadeLeft: "textFadeLeft",
    fadeUp: "textFadeUp",
    fadeDown: "textFadeDown",
    slantUp: "textSlantUp",
    slantDown: "textSlantDown",
    cascadeUp: "textCascadeUp",
    cascadeDown: "textCascadeDown",
} as const;
/* cspell:enable */

/**
 * A WordArt-style warp that bends or stretches the text to a shape, such as `"archUp"`, `"wave"` or `"inflate"`.
 * The `...Filled` arches, circle and button spread the text over the whole shape, where the others follow a single line.
 *
 * @publicApi
 */
export type ShapeTextWarp = keyof typeof TEXT_WARP_OOXML_NAMES;

/**
 * How text is laid out inside a shape.
 *
 * @publicApi
 */
export type ShapeTextOptions = {
    /** Where the text sits between the top and bottom of the shape. Default is `"center"` */
    readonly verticalAlignment?: ShapeTextVerticalAlignment;
    /** Space between the shape's edges and its text, in points. Word's defaults are 7.2 (0.1") on the left and right and 3.6 (0.05") on the top and bottom */
    readonly margins?: {
        readonly top?: number;
        readonly right?: number;
        readonly bottom?: number;
        readonly left?: number;
    };
    /** Whether lines of text wrap at the shape's edges. Default is `true` */
    readonly wrap?: boolean;
    /** Grows or shrinks the shape to fit its text. Can't be used with `shrinkTextOnOverflow` */
    readonly resizeShapeToFitText?: boolean;
    /** Makes the text smaller when there is too much of it for the shape. Can't be used with `resizeShapeToFitText` */
    readonly shrinkTextOnOverflow?: boolean;
    /** The direction the text runs in. Default is `"horizontal"` */
    readonly direction?: ShapeTextDirection;
    /** Lays the text out in columns */
    readonly columns?: {
        /** The number of columns, from 1 to 16 */
        readonly count: number;
        /** Space between the columns, in points. Default is 0 */
        readonly spacing?: number;
    };
    /** Bends or stretches the text to a shape, like WordArt */
    readonly warp?: ShapeTextWarp;
};

const MAX_TEXT_COLUMNS = 16;

// <xsd:group name="EG_TextAutofit">
//     <xsd:choice>
//         <xsd:element name="noAutofit" type="CT_TextNoAutofit"/>
//         <xsd:element name="normAutofit" type="CT_TextNormalAutofit"/>
//         <xsd:element name="spAutoFit" type="CT_TextShapeAutofit"/>
//     </xsd:choice>
// </xsd:group>
const createAutofit = ({ resizeShapeToFitText, shrinkTextOnOverflow }: ShapeTextOptions): readonly XmlComponent[] => {
    if (resizeShapeToFitText && shrinkTextOnOverflow) {
        throw new Error("Invalid text options. A shape can't both resize to fit its text and shrink its text");
    }
    if (resizeShapeToFitText) {
        return [new BuilderElement({ name: "a:spAutoFit" })];
    }
    return shrinkTextOnOverflow ? [new BuilderElement({ name: "a:normAutofit" })] : [];
};

// <xsd:complexType name="CT_PresetTextShape">
//     <xsd:sequence>
//         <xsd:element name="avLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="prst" type="ST_TextShapeType" use="required"/>
// </xsd:complexType>
const createWarp = (warp: ShapeTextWarp): XmlComponent =>
    new BuilderElement<{ readonly preset: string }>({
        name: "a:prstTxWarp",
        attributes: { preset: { key: "prst", value: TEXT_WARP_OOXML_NAMES[warp] } },
        children: [new BuilderElement({ name: "a:avLst" })],
    });

const columnCount = (count: number): number => {
    if (!(Number.isInteger(count) && count >= 1 && count <= MAX_TEXT_COLUMNS)) {
        throw new Error(`Invalid text column count ${count}. Expected a whole number from 1 to ${MAX_TEXT_COLUMNS}`);
    }
    return count;
};

const marginEmus = (margin: number | undefined, side: string): number | undefined =>
    margin === undefined ? undefined : pointsToEmus(margin, `${side} text margin`);

/**
 * Creates the `wps:bodyPr` element for the text in a preset shape.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TextBodyProperties">
 *   <xsd:sequence>
 *     <xsd:element name="prstTxWarp" type="CT_PresetTextShape" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_TextAutofit" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="scene3d" type="CT_Scene3D" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_Text3D" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="vert" type="ST_TextVerticalType" use="optional"/>
 *   <xsd:attribute name="wrap" type="ST_TextWrappingType" use="optional"/>
 *   <xsd:attribute name="lIns" type="ST_Coordinate32" use="optional"/>
 *   <xsd:attribute name="tIns" type="ST_Coordinate32" use="optional"/>
 *   <xsd:attribute name="rIns" type="ST_Coordinate32" use="optional"/>
 *   <xsd:attribute name="bIns" type="ST_Coordinate32" use="optional"/>
 *   <xsd:attribute name="numCol" type="ST_TextColumnCount" use="optional"/>
 *   <xsd:attribute name="spcCol" type="ST_PositiveCoordinate32" use="optional"/>
 *   <xsd:attribute name="fromWordArt" type="xsd:boolean" use="optional"/>
 *   <xsd:attribute name="anchor" type="ST_TextAnchoringType" use="optional"/>
 *   ...
 * </xsd:complexType>
 * ```
 *
 * @throws If a margin or the column spacing is out of range, the column count isn't 1 to 16, or both autofit options are set
 */
export const createShapeTextProperties = (options: ShapeTextOptions = {}): XmlComponent =>
    new BuilderElement<{
        readonly direction?: string;
        readonly wrap?: string;
        readonly left?: number;
        readonly top?: number;
        readonly right?: number;
        readonly bottom?: number;
        readonly columns?: number;
        readonly columnSpacing?: number;
        readonly fromWordArt?: boolean;
        readonly anchor?: string;
    }>({
        name: "wps:bodyPr",
        attributes: {
            direction: { key: "vert", value: options.direction && TEXT_DIRECTION_OOXML_NAMES[options.direction] },
            wrap: { key: "wrap", value: options.wrap === undefined ? undefined : options.wrap ? "square" : "none" },
            left: { key: "lIns", value: marginEmus(options.margins?.left, "left") },
            top: { key: "tIns", value: marginEmus(options.margins?.top, "top") },
            right: { key: "rIns", value: marginEmus(options.margins?.right, "right") },
            bottom: { key: "bIns", value: marginEmus(options.margins?.bottom, "bottom") },
            columns: { key: "numCol", value: options.columns && columnCount(options.columns.count) },
            columnSpacing: {
                key: "spcCol",
                value: options.columns?.spacing === undefined ? undefined : pointsToEmus(options.columns.spacing, "text column spacing"),
            },
            // Word draws warped text as WordArt
            fromWordArt: { key: "fromWordArt", value: options.warp ? true : undefined },
            anchor: { key: "anchor", value: options.verticalAlignment && VERTICAL_ALIGNMENT_OOXML_NAMES[options.verticalAlignment] },
        },
        children: [...(options.warp ? [createWarp(options.warp)] : []), ...createAutofit(options)],
    });
