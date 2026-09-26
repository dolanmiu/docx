/**
 * Data labels (`c:dLbls`): the labels on a series' bars, points or slices.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createElement, createValue } from "../chart-elements";
import type { BubbleChartDataLabels, ChartDataLabelPosition, ChartFont, PieChartDataLabels } from "../chart-options";
import { createNoShapeProperties, createTextProperties } from "../chart-style";
import { fontOf } from "../chart-text";

/**
 * What a series' labels are on, which decides where they can go: bars that are or aren't stacked, a line, an area, a
 * pie's or doughnut's slices, a radar chart's lines, or the points of a scatter or bubble chart.
 */
export type LabelledShape = "bars" | "stackedBars" | "line" | "area" | "pie" | "doughnut" | "radar" | "points";

type LabelPlacement = {
    /** Where Office puts the labels. None for an area, a doughnut or a radar chart */
    readonly default?: ChartDataLabelPosition;
    /** Where the labels can go: Office reports a file with any other position as needing repair */
    readonly allowed: readonly ChartDataLabelPosition[];
    /** The labelled shapes, for messages */
    readonly name: string;
};

const BESIDE_POINTS: readonly ChartDataLabelPosition[] = ["center", "left", "right", "above", "below"];

// Where Office puts labels, as the reference charts do: outside the end of a bar, in the middle of a stacked bar, to the
// right of a point, or where they fit best on a pie
const LABEL_PLACEMENTS: Readonly<Record<LabelledShape, LabelPlacement>> = {
    bars: { default: "outsideEnd", allowed: ["center", "insideEnd", "insideBase", "outsideEnd"], name: "bars" },
    stackedBars: { default: "center", allowed: ["center", "insideEnd", "insideBase"], name: "stacked bars" },
    line: { default: "right", allowed: BESIDE_POINTS, name: "a line" },
    points: { default: "right", allowed: BESIDE_POINTS, name: "points" },
    pie: { default: "bestFit", allowed: ["center", "insideEnd", "outsideEnd", "bestFit"], name: "a pie" },
    area: { allowed: [], name: "an area" },
    doughnut: { allowed: [], name: "a doughnut" },
    radar: { allowed: [], name: "a radar chart" },
};

// Each position mapped to its OOXML name (`ST_DLblPos`)
const POSITION_OOXML_NAMES: Readonly<Record<ChartDataLabelPosition, string>> = {
    center: "ctr",
    insideEnd: "inEnd",
    insideBase: "inBase",
    outsideEnd: "outEnd",
    left: "l",
    right: "r",
    above: "t",
    below: "b",
    bestFit: "bestFit",
};

/**
 * Where a series' labels go: the position given, or Office's.
 *
 * @throws If the position given isn't one the labelled shape can have
 */
const positionOf = (position: ChartDataLabelPosition | undefined, shape: LabelledShape, series: string): string | undefined => {
    const placement = LABEL_PLACEMENTS[shape];
    if (position === undefined) {
        return placement.default && POSITION_OOXML_NAMES[placement.default];
    }
    if (placement.allowed.length === 0) {
        throw new Error(`Invalid data label position "${position}" for series "${series}". Labels on ${placement.name} have no position`);
    }
    if (!placement.allowed.includes(position)) {
        const allowed = placement.allowed.map((one) => `"${one}"`);
        throw new Error(
            `Invalid data label position "${position}" for series "${series}". Labels on ${placement.name} can be at ${allowed.slice(0, -1).join(", ")} or ${allowed[allowed.length - 1]}`,
        );
    }
    return POSITION_OOXML_NAMES[position];
};

type AllDataLabels = PieChartDataLabels & BubbleChartDataLabels;

// What the labels show (`EG_DLblShared`), in the schema's order
const createShown = (
    { value, category, seriesName, percentage, bubbleSize }: AllDataLabels,
    leaderLines?: boolean,
): readonly XmlComponent[] => [
    createValue("c:showLegendKey", false),
    createValue("c:showVal", value ?? false),
    createValue("c:showCatName", category ?? false),
    createValue("c:showSerName", seriesName ?? false),
    createValue("c:showPercent", percentage ?? false),
    createValue("c:showBubbleSize", bubbleSize ?? false),
    ...(leaderLines ? [createValue("c:showLeaderLines", true)] : []),
];

type SeriesLabelOptions = {
    /** What the labels are on */
    readonly shape: LabelledShape;
    /** The series' name, for messages */
    readonly series: string;
    /** Lines from labels moved away from their slices, which Office writes for pie and doughnut charts */
    readonly leaderLines?: boolean;
    /** The chart's font */
    readonly font?: ChartFont;
};

/**
 * A series' labels, in 9 point text, or none when the labels show nothing. A number format given is written as it is,
 * not linked to the sheet's.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:group name="EG_DLblShared">
 *   <xsd:sequence>
 *     <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="dLblPos" type="CT_DLblPos" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showLegendKey" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showVal" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showCatName" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showSerName" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showPercent" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="showBubbleSize" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="separator" type="xsd:string" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:group>
 * ```
 *
 * @throws If the labels' position isn't one the labelled shape can have
 */
export const createSeriesDataLabels = (
    labels: false | AllDataLabels | undefined,
    { shape, series, leaderLines, font }: SeriesLabelOptions,
): readonly XmlComponent[] => {
    if (!labels || !(labels.value || labels.category || labels.seriesName || labels.percentage || labels.bubbleSize)) {
        return [];
    }
    const position = positionOf(labels.position, shape, series);
    return [
        createElement("c:dLbls", {}, [
            ...(labels.numberFormat === undefined ? [] : [createElement("c:numFmt", { formatCode: labels.numberFormat, sourceLinked: 0 })]),
            createNoShapeProperties(),
            createTextProperties({ size: 9, color: 75, rotation: 0, labelMargins: true, font: fontOf(font, labels.font) }),
            ...(position ? [createValue("c:dLblPos", position)] : []),
            ...createShown(labels, leaderLines),
        ]),
    ];
};

/**
 * A chart group's labels, which show nothing, as Word writes them. Each series' own labels come first.
 */
export const createGroupDataLabels = (leaderLines?: boolean): XmlComponent => createElement("c:dLbls", {}, createShown({}, leaderLines));
