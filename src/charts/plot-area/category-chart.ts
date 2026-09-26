/**
 * Column, bar, line and area charts, whose series can each be drawn another way, as Word's "Combo" charts are, and
 * against a secondary value axis.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartData } from "../chart-data";
import { DATE_FORMATS, timeUnitOf } from "../chart-dates";
import type {
    AreaChartOptions,
    BarChartOptions,
    ChartAxisGroup,
    ChartFont,
    ChartSeries,
    ColumnChartOptions,
    LineChartOptions,
} from "../chart-options";
import { createAreaChart } from "./area-chart";
import { type AxisIds, type DateCategories, PRIMARY_AXES, SECONDARY_AXES, createCategoryAxis, createValueAxis } from "./axes";
import { createBarChart } from "./bar-chart";
import { type CategoryGroup, type ChartGroups, type GroupSeries, groupSeries } from "./chart-group";
import { createLineChart } from "./line-chart";

type CategoryChartOptions = ColumnChartOptions | BarChartOptions | LineChartOptions | AreaChartOptions;

/** How a group draws its series: as bars (columns or bars), lines or areas */
type GroupKind = "bars" | "line" | "area";

// The order groups are written in, which is the order they are drawn in: areas behind bars, and lines in front
const KINDS: readonly GroupKind[] = ["area", "bars", "line"];

const kindOf = (type: ChartSeries["type"] | CategoryChartOptions["type"]): GroupKind => {
    switch (type) {
        case "line":
            return "line";
        case "area":
            return "area";
        default:
            return "bars";
    }
};

/**
 * The group of series drawn one way against one pair of axes.
 */
const createGroup = (options: CategoryChartOptions, kind: GroupKind, group: CategoryGroup<ChartSeries>): XmlComponent => {
    switch (kind) {
        case "area":
            return createAreaChart(group);
        case "line":
            return createLineChart({
                ...group,
                markers: options.type === "line" ? options.markers : undefined,
                smooth: options.type === "line" ? options.smooth : undefined,
            });
        default:
            return createBarChart({
                ...group,
                horizontal: options.type === "bar",
                gapWidth: options.type === "column" || options.type === "bar" ? options.gapWidth : undefined,
                overlap: options.type === "column" || options.type === "bar" ? options.overlap : undefined,
            });
    }
};

/**
 * The categories' dates, when they are dates: the unit to space them by, and how they are written.
 */
const datesOf = (categories: CategoryChartOptions["categories"]): DateCategories | undefined => {
    const dates = categories.filter((category): category is Date => category instanceof Date);
    if (dates.length === 0) {
        return undefined;
    }
    const unit = timeUnitOf(dates);
    return { unit, format: DATE_FORMATS[unit] };
};

/**
 * A column, bar, line or area chart: a group for each way its series are drawn against each value axis, then its axes.
 *
 * - Groups are written areas first, then bars, then lines, and those against the primary axis before those against the
 *   secondary, so each is drawn in front of the one before, as Office draws them.
 * - `stacking` stacks the groups drawn as the chart's `type`, and the chart's label position is for them. The others
 *   aren't stacked, and keep Office's label positions.
 * - The secondary value axis is on the right (or for a bar chart, at the top), with no gridlines. It crosses a hidden
 *   secondary category axis, which is in the same order as the primary one, so each series lines up with its category,
 *   at its end away from the primary value axis.
 * - The value axes cross at the categories (`midCat`) only when every series is an area, so the areas reach both sides of
 *   the plot, as in Word's and Excel's area charts, and the categories line up for every group.
 */
export const createCategoryCharts = (options: CategoryChartOptions, data: ChartData, font: ChartFont | undefined): ChartGroups => {
    const series = groupSeries(options.series, data.series);
    const stacking = options.stacking ?? "none";
    const ownKind = kindOf(options.type);
    const horizontal = options.type === "bar";
    const kindOfSeries = ({ options: one }: GroupSeries<ChartSeries>): GroupKind => kindOf(one.type ?? options.type);
    const axisOf = ({ options: one }: GroupSeries<ChartSeries>): ChartAxisGroup => one.axis ?? "primary";

    const groupsOn = (axis: ChartAxisGroup, ids: AxisIds): readonly XmlComponent[] =>
        KINDS.flatMap((kind) => {
            const members = series.filter((one) => axisOf(one) === axis && kindOfSeries(one) === kind);
            return members.length === 0
                ? []
                : [
                      createGroup(options, kind, {
                          series: members,
                          stacking: kind === ownKind ? stacking : "none",
                          axes: ids,
                          // The chart's label position is for its own type: others can't always have it
                          dataLabels:
                              kind === ownKind || !options.dataLabels ? options.dataLabels : { ...options.dataLabels, position: undefined },
                          font,
                      }),
                  ];
        });
    // A value axis is a percentage axis when a group against it is stacked to 100%
    const percentOn = (axis: ChartAxisGroup): boolean =>
        stacking === "percent" && series.some((one) => axisOf(one) === axis && kindOfSeries(one) === ownKind);

    const secondary = series.some((one) => axisOf(one) === "secondary");
    const dates = datesOf(options.categories);
    const crossBetween = series.every((one) => kindOfSeries(one) === "area") ? "midCat" : "between";

    return {
        groups: [...groupsOn("primary", PRIMARY_AXES), ...(secondary ? groupsOn("secondary", SECONDARY_AXES) : [])],
        axes: [
            createCategoryAxis(
                {
                    id: PRIMARY_AXES.category,
                    crossAxisId: PRIMARY_AXES.value,
                    position: horizontal ? "l" : "b",
                    crossesPercent: percentOn("primary"),
                    font,
                },
                options.categoryAxis,
                dates,
            ),
            createValueAxis(
                {
                    id: PRIMARY_AXES.value,
                    crossAxisId: PRIMARY_AXES.category,
                    position: horizontal ? "b" : "l",
                    crossBetween,
                    percent: percentOn("primary"),
                    font,
                },
                options.valueAxis,
            ),
            ...(secondary
                ? [
                      createValueAxis(
                          {
                              id: SECONDARY_AXES.value,
                              crossAxisId: SECONDARY_AXES.category,
                              position: horizontal ? "t" : "r",
                              // The side opposite the primary value axis, the last category's unless they are reversed
                              crosses: options.categoryAxis?.reverseOrder ? "minimum" : "maximum",
                              crossBetween,
                              percent: percentOn("secondary"),
                              gridlines: false,
                              font,
                          },
                          options.secondaryValueAxis,
                      ),
                      createCategoryAxis(
                          {
                              id: SECONDARY_AXES.category,
                              crossAxisId: SECONDARY_AXES.value,
                              position: horizontal ? "l" : "b",
                              crossesPercent: percentOn("secondary"),
                          },
                          { visible: false, reverseOrder: options.categoryAxis?.reverseOrder },
                          dates,
                      ),
                  ]
                : []),
        ],
    };
};
