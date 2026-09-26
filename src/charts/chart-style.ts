/**
 * The look Office 2013 and later give a new chart: its colours, lines and text. It is written explicitly, so every
 * application draws the chart as Word does rather than with its own defaults.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { type ChartColor, createChartColor } from "./chart-color";
import { createElement, createValue } from "./chart-elements";

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
/* cspell:enable */

/**
 * The colour of a series, or of a slice of a pie: the theme's accents 1 to 6, then the six again, darker or lighter, as
 * Office colours them. After 54 the colours repeat.
 *
 * @param index - The series' or slice's index, from 0
 * @param color - A colour given for it, which is used instead
 */
export const createSeriesColor = (index: number, color?: ChartColor): XmlComponent =>
    color === undefined
        ? createSchemeColor(`accent${(index % 6) + 1}`, ACCENT_VARIATIONS[Math.floor(index / 6) % ACCENT_VARIATIONS.length])
        : createChartColor(color);

const createSolidFill = (color: XmlComponent): XmlComponent => createElement("a:solidFill", {}, [color]);

const createNoFill = (): XmlComponent => createElement("a:noFill");

const createEffects = (): XmlComponent => createElement("a:effectLst");

type LineOptions = {
    /** Width in points */
    readonly width?: number;
    /** A colour, or undefined for no line */
    readonly color?: XmlComponent;
    /** Round ends and joins, as Office draws series' lines */
    readonly round?: boolean;
    /** Flat ends with a round join, as Office draws axes and gridlines */
    readonly axis?: boolean;
};

const createLine = ({ width, color, round, axis }: LineOptions): XmlComponent =>
    createElement(
        "a:ln",
        axis
            ? { w: width && width * EMUS_PER_POINT, cap: "flat", cmpd: "sng", algn: "ctr" }
            : { w: width && width * EMUS_PER_POINT, cap: round ? "rnd" : undefined },
        [color ? createSolidFill(color) : createNoFill(), ...(round || axis ? [createElement("a:round")] : [])],
    );

/**
 * Shape properties (`c:spPr`): an optional fill and a line, then no effects, as Office writes them.
 */
const createShapeProperties = (fill: XmlComponent | undefined, line: XmlComponent): XmlComponent =>
    createElement("c:spPr", {}, [...(fill ? [fill] : []), line, createEffects()]);

/**
 * No fill and no line, for the plot area, titles, the legend and data labels.
 */
export const createNoShapeProperties = (): XmlComponent => createShapeProperties(createNoFill(), createLine({}));

/**
 * The chart area: filled with the background colour, with a thin border.
 */
export const createChartAreaProperties = (): XmlComponent =>
    createShapeProperties(createSolidFill(createSchemeColor("bg1")), createLine({ width: 0.75, color: textColor(15), axis: true }));

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
 * The line of a line chart's series, 2.25 points wide with round ends.
 */
export const createLineSeriesProperties = (color: XmlComponent): XmlComponent =>
    createShapeProperties(undefined, createLine({ width: 2.25, color, round: true }));

/**
 * The line of a scatter chart's series, 1.5 points wide with round ends, or none.
 */
export const createScatterSeriesProperties = (color: XmlComponent | undefined): XmlComponent =>
    createShapeProperties(undefined, createLine(color ? { width: 1.5, color, round: true } : { width: 2, round: true }));

/**
 * A marker (`c:marker`): a circle of size 5 filled with the series' colour, with a thin outline in it, or none.
 *
 * @param seriesColor - Creates the series' colour, or undefined for no marker
 */
export const createMarker = (seriesColor: (() => XmlComponent) | undefined): XmlComponent =>
    seriesColor
        ? createElement("c:marker", {}, [
              createValue("c:symbol", "circle"),
              createValue("c:size", 5),
              createShapeProperties(createSolidFill(seriesColor()), createLine({ width: 0.75, color: seriesColor() })),
          ])
        : createElement("c:marker", {}, [createValue("c:symbol", "none")]);

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

type TextOptions = {
    /** Size in points */
    readonly size: number;
    /** How far from the background to the text colour the text is, from 0 to 100 */
    readonly color?: number;
    /** Rotation in 60,000ths of a degree. Office's "automatic" is -60000000 */
    readonly rotation?: number;
    /** Office's margins around a data label */
    readonly labelMargins?: boolean;
    /** Letter spacing of 0, which Office writes on titles */
    readonly spacing?: boolean;
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
 * The paragraph properties of a chart's text (`a:pPr` with `a:defRPr`): the theme's body font, in grey.
 */
export const createParagraphProperties = ({ size, color = 65, spacing }: Pick<TextOptions, "size" | "color" | "spacing">): XmlComponent =>
    createElement("a:pPr", {}, [
        createElement(
            "a:defRPr",
            {
                sz: size * 100,
                b: 0,
                i: 0,
                u: "none",
                strike: "noStrike",
                kern: 1200,
                spc: spacing ? 0 : undefined,
                baseline: 0,
            },
            [
                createSolidFill(textColor(color)),
                createElement("a:latin", { typeface: "+mn-lt" }),
                createElement("a:ea", { typeface: "+mn-ea" }),
                createElement("a:cs", { typeface: "+mn-cs" }),
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
