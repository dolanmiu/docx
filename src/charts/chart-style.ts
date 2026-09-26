/**
 * The look Office 2013 and later give a new chart: its colours, lines and text. It is written explicitly, so every
 * application draws the chart as Word does rather than with its own defaults. Options such as fonts, line widths and
 * marker shapes are written over it.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { type ChartColor, createChartColor } from "./chart-color";
import { createElement, createValue } from "./chart-elements";
import type { ChartAreaStyle, ChartFont, ChartLine, ChartLineDash, ChartMarker, ChartMarkerShape } from "./chart-options";

// cspell:ignore cmpd
const EMUS_PER_POINT = 12700;

/* cspell:disable */
/**
 * A colour of the chart's theme, by the name Office's chart styles use (`tx1` for text, `bg1` for the background), as a
 * percentage of the way from the background to it: text at 65% is `tx1` with its luminance scaled to 65% and 35% added.
 */
const createSchemeColor = (name: string, changes: readonly { readonly name: string; readonly value: number }[] = []): XmlComponent =>
    createElement(
        "a:schemeClr",
        { val: name },
        changes.map((change) => createValue(change.name, change.value)),
    );

const textColor = (percent: number): XmlComponent =>
    createSchemeColor("tx1", [
        { name: "a:lumMod", value: percent * 1000 },
        { name: "a:lumOff", value: (100 - percent) * 1000 },
    ]);

// How Office's colors1.xml varies the six accent colours for series 7 onwards: darker, then lighter, and so on
const ACCENT_VARIATIONS: readonly (readonly { readonly name: string; readonly value: number }[])[] = [
    [],
    [{ name: "a:lumMod", value: 60000 }],
    [
        { name: "a:lumMod", value: 80000 },
        { name: "a:lumOff", value: 20000 },
    ],
    [{ name: "a:lumMod", value: 80000 }],
    [
        { name: "a:lumMod", value: 60000 },
        { name: "a:lumOff", value: 40000 },
    ],
    [{ name: "a:lumMod", value: 50000 }],
    [
        { name: "a:lumMod", value: 70000 },
        { name: "a:lumOff", value: 30000 },
    ],
    [{ name: "a:lumMod", value: 70000 }],
    [
        { name: "a:lumMod", value: 50000 },
        { name: "a:lumOff", value: 50000 },
    ],
];

// Each dash pattern mapped to its OOXML name (`ST_PresetLineDashVal`), as for shapes' lines. The "short" patterns are the
// ones OOXML calls "sys"
const LINE_DASH_OOXML_NAMES: Readonly<Record<ChartLineDash, string>> = {
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
};
/* cspell:enable */

const MARKER_SHAPES: readonly ChartMarkerShape[] = ["circle", "square", "diamond", "triangle", "x", "star", "plus", "dash", "dot"];

/**
 * The colour of a series, or of a slice of a pie: the theme's accents 1 to 6, then the six again, darker or lighter, as
 * Office colours them. After 54 the colours repeat.
 *
 * @param index - The series' or slice's index, from 0
 * @param color - A colour given for it, which is used instead
 * @param transparency - From 0 (opaque) to 100 (invisible), as Office draws bubbles at 25%
 */
export const createSeriesColor = (index: number, color?: ChartColor, transparency?: number): XmlComponent =>
    color === undefined
        ? createSchemeColor(`accent${(index % 6) + 1}`, [
              ...ACCENT_VARIATIONS[Math.floor(index / 6) % ACCENT_VARIATIONS.length],
              ...(transparency ? [{ name: "a:alpha", value: (100 - transparency) * 1000 }] : []),
          ])
        : createChartColor(color, transparency);

const createSolidFill = (color: XmlComponent): XmlComponent => createElement("a:solidFill", {}, [color]);

const createNoFill = (): XmlComponent => createElement("a:noFill");

const createEffects = (): XmlComponent => createElement("a:effectLst");

const createDash = (dash: ChartLineDash): XmlComponent => {
    const name = LINE_DASH_OOXML_NAMES[dash];
    if (name === undefined) {
        throw new Error(`Invalid line dash "${dash}". Expected one of ${Object.keys(LINE_DASH_OOXML_NAMES).join(", ")}`);
    }
    return createValue("a:prstDash", name);
};

type LineOptions = {
    /** Width in points */
    readonly width?: number;
    /** A colour, or undefined for no line */
    readonly color?: XmlComponent;
    /** Round ends and joins, as Office draws series' lines */
    readonly round?: boolean;
    /** Flat ends with a round join, as Office draws axes and gridlines */
    readonly axis?: boolean;
    readonly dash?: ChartLineDash;
};

const createLine = ({ width, color, round, axis, dash }: LineOptions): XmlComponent => {
    const w = width === undefined ? undefined : Math.round(width * EMUS_PER_POINT);
    return createElement("a:ln", axis ? { w, cap: "flat", cmpd: "sng", algn: "ctr" } : { w, cap: round ? "rnd" : undefined }, [
        color ? createSolidFill(color) : createNoFill(),
        ...(color && dash ? [createDash(dash)] : []),
        ...(round || axis ? [createElement("a:round")] : []),
    ]);
};

/**
 * Shape properties (`c:spPr`): an optional fill and a line, then no effects, as Office writes them.
 */
const createShapeProperties = (fill: XmlComponent | undefined, line: XmlComponent): XmlComponent =>
    createElement("c:spPr", {}, [...(fill ? [fill] : []), line, createEffects()]);

/**
 * No fill and no line, for titles, the legend and data labels.
 */
export const createNoShapeProperties = (): XmlComponent => createShapeProperties(createNoFill(), createLine({}));

/**
 * A border given as options, over a default width and colour.
 */
const createBorder = (border: ChartLine, defaultColor: XmlComponent): XmlComponent =>
    createLine({
        width: border.width ?? 0.75,
        color: border.color === undefined ? defaultColor : createChartColor(border.color),
        dash: border.dash,
        axis: true,
    });

const createAreaFill = (fill: string | ChartColor | undefined, defaultFill: XmlComponent): XmlComponent => {
    if (fill === "none") {
        return createNoFill();
    }
    return fill === undefined ? defaultFill : createSolidFill(createChartColor(fill));
};

/**
 * The chart area: filled with the background colour, with a thin light grey border, or as given.
 */
export const createChartAreaProperties = ({ fill, border }: ChartAreaStyle = {}): XmlComponent =>
    createShapeProperties(
        createAreaFill(fill, createSolidFill(createSchemeColor("bg1"))),
        border === "none" ? createLine({}) : createBorder(border ?? {}, textColor(15)),
    );

/**
 * The plot area: no fill and no border, or as given.
 */
export const createPlotAreaProperties = ({ fill, border }: ChartAreaStyle = {}): XmlComponent =>
    createShapeProperties(
        createAreaFill(fill, createNoFill()),
        border === undefined || border === "none" ? createLine({}) : createBorder(border, textColor(15)),
    );

/**
 * A bar, column, area or slice of a series: a solid fill and no line.
 */
export const createFilledSeriesProperties = (color: XmlComponent): XmlComponent =>
    createShapeProperties(createSolidFill(color), createLine({}));

/**
 * A slice of a pie or doughnut: a solid fill, with a border in the background colour between it and the next slice.
 */
export const createSliceProperties = (color: XmlComponent): XmlComponent =>
    createShapeProperties(createSolidFill(color), createLine({ width: 1.5, color: createSchemeColor("lt1") }));

/**
 * A series' line, over its default width, with round ends: 2.25 points for a line or radar series, and 1.5 for a
 * scatter series.
 *
 * @param color - The series' colour, which the line has unless it has a colour of its own
 */
const createSeriesLine = (color: XmlComponent, width: number, line: ChartLine = {}): XmlComponent =>
    createLine({
        width: line.width ?? width,
        color: line.color === undefined ? color : createChartColor(line.color),
        dash: line.dash,
        round: true,
    });

/**
 * The line of a line or radar chart's series, 2.25 points wide with round ends, or as given.
 */
export const createLineSeriesProperties = (color: XmlComponent, line?: ChartLine): XmlComponent =>
    createShapeProperties(undefined, createSeriesLine(color, 2.25, line));

/**
 * The line of a scatter chart's series, 1.5 points wide with round ends, or as given, or none.
 */
export const createScatterSeriesProperties = (color: XmlComponent | undefined, line?: ChartLine): XmlComponent =>
    createShapeProperties(undefined, color ? createSeriesLine(color, 1.5, line) : createLine({ width: 2, round: true }));

/**
 * A bubble chart's series: bubbles filled with the series' colour at 75% opacity, with no line, as Office draws them.
 */
export const createBubbleSeriesProperties = (index: number, color?: ChartColor): XmlComponent =>
    createShapeProperties(createSolidFill(createSeriesColor(index, color, 25)), createLine({}));

/**
 * A marker (`c:marker`): a circle of size 5, or the shape and size given, filled with the series' colour with a thin
 * outline in it, or none.
 *
 * @param seriesColor - Creates the series' colour, or undefined for no marker
 */
export const createMarker = (
    seriesColor: (() => XmlComponent) | undefined,
    { shape = "circle", size = 5 }: ChartMarker = {},
): XmlComponent => {
    if (!seriesColor) {
        return createElement("c:marker", {}, [createValue("c:symbol", "none")]);
    }
    if (!MARKER_SHAPES.includes(shape)) {
        throw new Error(`Invalid marker shape "${shape}". Expected one of ${MARKER_SHAPES.join(", ")}`);
    }
    return createElement("c:marker", {}, [
        createValue("c:symbol", shape),
        createValue("c:size", Math.round(size)),
        createShapeProperties(createSolidFill(seriesColor()), createLine({ width: 0.75, color: seriesColor() })),
    ]);
};

/**
 * Gridlines, or the line of an axis: 0.75 points wide, 15% of the way from the background to the text colour, or 25%
 * for a scatter chart's axes.
 */
export const createAxisLine = (percent = 15): XmlComponent => createLine({ width: 0.75, color: textColor(percent), axis: true });

/**
 * An axis' shape properties: no fill, and its line.
 */
export const createAxisProperties = (line: XmlComponent | undefined): XmlComponent =>
    createShapeProperties(createNoFill(), line ?? createLine({}));

/**
 * Gridlines (`c:majorGridlines`).
 */
export const createGridlines = (): XmlComponent =>
    createElement("c:majorGridlines", {}, [createShapeProperties(undefined, createAxisLine())]);

/**
 * How a piece of the chart's text looks: Office's size and grey, with the font given over them.
 */
export type TextOptions = {
    /** Office's size for the text, in points */
    readonly size: number;
    /** How far from the background to the text colour Office's text is, from 0 to 100. Default is 65 */
    readonly color?: number;
    /** Rotation in 60,000ths of a degree. Office's "automatic" is -60000000 */
    readonly rotation?: number;
    /** Office's margins around a data label */
    readonly labelMargins?: boolean;
    /** Letter spacing of 0, which Office writes on titles */
    readonly spacing?: boolean;
    /** The font given, with the chart's own */
    readonly font?: ChartFont;
};

/**
 * The text body's properties (`a:bodyPr`), as Office writes them for a chart's text.
 */
export const createBodyProperties = ({
    rotation = -60000000,
    labelMargins,
}: Pick<TextOptions, "rotation" | "labelMargins">): XmlComponent =>
    createElement(
        "a:bodyPr",
        {
            rot: rotation,
            spcFirstLastPara: 1,
            vertOverflow: "ellipsis",
            vert: "horz",
            wrap: "square",
            ...(labelMargins ? { lIns: 38100, tIns: 19050, rIns: 38100, bIns: 19050 } : {}),
            anchor: "ctr",
            anchorCtr: 1,
        },
        labelMargins ? [createElement("a:spAutoFit")] : [],
    );

/**
 * The paragraph properties of a chart's text (`a:pPr` with `a:defRPr`): the theme's body font, in grey, or the font
 * given. A typeface given is for Latin and complex scripts, as Office sets it, and East Asian text keeps the theme's.
 */
export const createParagraphProperties = ({
    size,
    color = 65,
    spacing,
    font = {},
}: Pick<TextOptions, "size" | "color" | "spacing" | "font">): XmlComponent =>
    createElement("a:pPr", {}, [
        createElement(
            "a:defRPr",
            {
                sz: Math.round((font.size ?? size) * 100),
                b: Number(font.bold ?? false),
                i: Number(font.italics ?? false),
                u: "none",
                strike: "noStrike",
                kern: 1200,
                spc: spacing ? 0 : undefined,
                baseline: 0,
            },
            [
                createSolidFill(font.color === undefined ? textColor(color) : createChartColor(font.color)),
                createElement("a:latin", { typeface: font.name ?? "+mn-lt" }),
                createElement("a:ea", { typeface: "+mn-ea" }),
                createElement("a:cs", { typeface: font.name ?? "+mn-cs" }),
            ],
        ),
    ]);

/**
 * The text properties (`c:txPr`) of an axis, the legend, a title or data labels.
 */
export const createTextProperties = (options: TextOptions): XmlComponent =>
    createElement("c:txPr", {}, [
        createBodyProperties(options),
        createElement("a:lstStyle"),
        createElement("a:p", {}, [createParagraphProperties(options), createElement("a:endParaRPr", { lang: "en-US" })]),
    ]);

/**
 * The chart's own text properties, which Office writes empty.
 */
export const createChartTextProperties = (): XmlComponent =>
    createElement("c:txPr", {}, [
        createElement("a:bodyPr"),
        createElement("a:lstStyle"),
        createElement("a:p", {}, [
            createElement("a:pPr", {}, [createElement("a:defRPr")]),
            createElement("a:endParaRPr", { lang: "en-US" }),
        ]),
    ]);
