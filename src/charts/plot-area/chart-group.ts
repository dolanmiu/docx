/**
 * What a chart's groups write in the plot area.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartSeriesData } from "../chart-data";
import type { ChartDataLabels, ChartFont, ChartStacking } from "../chart-options";
import type { AxisIds } from "./axes";

/**
 * A chart's groups, such as a `c:barChart` and a `c:lineChart`, and their axes, which follow them in the plot area. Pie
 * and doughnut charts have no axes.
 */
export type ChartGroups = {
    readonly groups: readonly XmlComponent[];
    readonly axes: readonly XmlComponent[];
};

/**
 * A series of a group, with its index in the chart, which is its `c:idx` and `c:order` and picks its colour, and its
 * data.
 */
export type GroupSeries<Series> = {
    readonly index: number;
    readonly options: Series;
    readonly data: ChartSeriesData;
};

/**
 * A group of a column, bar, line or area chart: its series, how they are stacked, the axes they are drawn against, and
 * the chart's labels and font.
 */
export type CategoryGroup<Series> = {
    readonly series: readonly GroupSeries<Series>[];
    readonly stacking: ChartStacking;
    readonly axes: AxisIds;
    readonly dataLabels?: ChartDataLabels;
    readonly font?: ChartFont;
};

/**
 * How line and area charts' series are grouped (`ST_Grouping`). Bar charts call `"none"` `clustered`.
 */
export const GROUPINGS: Readonly<Record<ChartStacking, string>> = {
    none: "standard",
    stacked: "stacked",
    percent: "percentStacked",
};

/**
 * A series' labels: its own, or the chart's.
 */
export const labelsOf = <Labels>(own: false | Labels | undefined, chart: Labels | undefined): false | Labels | undefined =>
    own === undefined ? chart : own;

/**
 * The series of a chart, each with its index and data.
 */
export const groupSeries = <Series>(series: readonly Series[], data: readonly ChartSeriesData[]): readonly GroupSeries<Series>[] =>
    series.map((options, index) => ({ index, options, data: data[index] }));
