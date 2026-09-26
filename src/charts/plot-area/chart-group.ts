/**
 * What a chart group writes in the plot area.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartStacking } from "../chart-options";

/**
 * A chart group, such as `c:barChart`, and its axes, which follow it in the plot area. Pie and doughnut charts have no
 * axes.
 */
export type ChartGroup = {
    readonly group: XmlComponent;
    readonly axes: readonly XmlComponent[];
};

/**
 * How line and area charts' series are grouped (`ST_Grouping`). Bar charts call `"none"` `clustered`.
 */
export const GROUPINGS: Readonly<Record<ChartStacking, string>> = {
    none: "standard",
    stacked: "stacked",
    percent: "percentStacked",
};
