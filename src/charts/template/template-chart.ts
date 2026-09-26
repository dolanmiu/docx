/**
 * Reads a chart in a template, made in Word or another application: its groups, its series in the order they are
 * plotted, and its title, for {@link ChartDataPatch} to replace its data.
 *
 * @module
 */
// cspell:ignore dmyhs
import type { Element } from "xml-js";

import type { ChartType } from "../chart-options";
import { childOf, childrenOf, descendantsOf, elementsOf, nameOf, numberOf, textOf, valueOf } from "./template-xml";

/**
 * How a group's series hold their data: a value for each category, or points with an x and y, and for a bubble chart,
 * a size.
 */
export type TemplateSeriesKind = "category" | "scatter" | "bubble";

/**
 * A group of the chart's plot area, such as a `c:barChart`: series drawn one way against one pair of axes.
 */
export type TemplateGroup = {
    readonly element: Element;
    /** How its series hold their data */
    readonly kind: TemplateSeriesKind;
    /** The type of chart it is, by `docx/charts`' names. A 3-D chart is its flat type, and a pie of a pie is a pie */
    readonly type: ChartType;
    /** Whether each point, such as each slice of a pie, has a colour of its own (`c:varyColors`) */
    readonly varyColors: boolean;
};

/**
 * A series of the chart.
 */
export type TemplateSeries = {
    readonly element: Element;
    readonly group: TemplateGroup;
    /** Its index (`c:idx`), unique in the chart, which picks its colour when it has none of its own */
    readonly index: number | undefined;
    /** Where it is plotted (`c:order`), unique in the chart */
    readonly order: number | undefined;
};

/**
 * A template's chart.
 */
export type TemplateChart = {
    readonly chartSpace: Element;
    readonly chart: Element;
    readonly plotArea: Element;
    readonly groups: readonly TemplateGroup[];
    /** The series, in the order they are plotted */
    readonly series: readonly TemplateSeries[];
    /** How its series hold their data */
    readonly kind: TemplateSeriesKind;
    /** The type of chart it is, which decides what data it takes: a combo chart is the type of its first group */
    readonly type: ChartType;
    /** The title's text, if it has one of its own */
    readonly title: string | undefined;
};

const barType = (group: Element): ChartType => (valueOf(childOf(group, "c:barDir")) === "bar" ? "bar" : "column");

// The groups this can patch, and the type of chart each is. A Map, so a name such as "constructor" isn't found
const GROUPS: ReadonlyMap<string, (group: Element) => ChartType> = new Map<string, (group: Element) => ChartType>([
    ["c:barChart", barType],
    ["c:bar3DChart", barType],
    ["c:lineChart", () => "line"],
    ["c:line3DChart", () => "line"],
    ["c:areaChart", () => "area"],
    ["c:area3DChart", () => "area"],
    ["c:pieChart", () => "pie"],
    ["c:pie3DChart", () => "pie"],
    ["c:ofPieChart", () => "pie"],
    ["c:doughnutChart", () => "doughnut"],
    ["c:radarChart", () => "radar"],
    ["c:scatterChart", () => "scatter"],
    ["c:bubbleChart", () => "bubble"],
]);

// The groups whose series have a fixed meaning, which new data can't keep
const UNSUPPORTED_GROUPS: ReadonlyMap<string, string> = new Map([
    ["c:stockChart", "a stock chart, whose series are its prices"],
    ["c:surfaceChart", "a surface chart"],
    ["c:surface3DChart", "a 3-D surface chart"],
]);

// The types whose data decides the checks for the whole chart, as they can't be combined with others
const PIE_TYPES: readonly ChartType[] = ["pie", "doughnut", "radar"];

const kindOf = (type: ChartType): TemplateSeriesKind => {
    switch (type) {
        case "scatter":
        case "bubble":
            return type;
        default:
            return "category";
    }
};

/**
 * Whether a group's points each have their own colour. Office varies them unless told not to on pie and doughnut
 * charts, and doesn't on the others, when there is no `c:varyColors`. A `c:varyColors` without a value is true, as in
 * the schema.
 */
const variesColors = (group: Element, type: ChartType): boolean => {
    const varyColors = childOf(group, "c:varyColors");
    if (varyColors === undefined) {
        return type === "pie" || type === "doughnut";
    }
    const value = valueOf(varyColors);
    return value === undefined || value === "1" || value === "true";
};

/**
 * The text of the chart's own title: each paragraph's runs and fields, a line each. A title Office writes from a
 * single series' name, or linked to a cell, has none.
 */
const titleOf = (chart: Element): string | undefined => {
    const rich = childOf(childOf(childOf(chart, "c:title"), "c:tx"), "c:rich");
    return rich === undefined
        ? undefined
        : childrenOf(rich, "a:p")
              .map((paragraph) => descendantsOf(paragraph, "a:t").map(textOf).join(""))
              .join("\n");
};

/**
 * Reads a chart part's chart.
 *
 * @throws If the chart is a pivot chart, has no plot area or series groups, has a group this can't patch, such as a
 * stock chart, or combines series with categories with series with points
 */
export const readTemplateChart = (chartSpace: Element): TemplateChart => {
    if (childOf(chartSpace, "c:pivotSource") !== undefined) {
        throw new Error("It is a pivot chart, whose data is a pivot table in its workbook");
    }
    const chart = childOf(chartSpace, "c:chart");
    const plotArea = childOf(chart, "c:plotArea");
    if (chart === undefined || plotArea === undefined) {
        throw new Error("Its chart part has no plot area (c:chart and c:plotArea)");
    }

    const groupElements = elementsOf(plotArea).filter((element) => nameOf(element).endsWith("Chart"));
    const groups = groupElements.map((element): TemplateGroup => {
        const name = nameOf(element);
        const unsupported = UNSUPPORTED_GROUPS.get(name);
        if (unsupported !== undefined) {
            throw new Error(`It is ${unsupported}, which ChartDataPatch can't patch`);
        }
        const typeOf = GROUPS.get(name);
        if (typeOf === undefined) {
            throw new Error(`It has a group of series of a type ChartDataPatch doesn't know (${name})`);
        }
        const groupType = typeOf(element);
        return { element, kind: kindOf(groupType), type: groupType, varyColors: variesColors(element, groupType) };
    });
    if (groups.length === 0) {
        throw new Error("Its plot area has no series groups, such as c:barChart");
    }
    const kinds = [...new Set(groups.map(({ kind }) => kind))];
    if (kinds.length > 1) {
        throw new Error(
            "It combines a scatter or bubble chart, whose series have points, with another type, whose series have categories, " +
                "which ChartDataPatch can't patch",
        );
    }

    // In the order they are plotted, then in the order they are written
    const series = groups
        .flatMap((group) =>
            childrenOf(group.element, "c:ser").map((element) => ({
                element,
                group,
                index: numberOf(childOf(element, "c:idx")),
                order: numberOf(childOf(element, "c:order")),
            })),
        )
        .map((one, position) => ({ one, position }))
        .sort((a, b) => (a.one.order ?? Infinity) - (b.one.order ?? Infinity) || a.position - b.position)
        .map(({ one }) => one);

    const type = groups.find((group) => PIE_TYPES.includes(group.type))?.type ?? groups[0].type;
    return { chartSpace, chart, plotArea, groups, series, kind: kinds[0], type, title: titleOf(chart) };
};

/**
 * The number of points the series' values had in the template, from their cache.
 */
export const pointCountOf = (series: Element): number => {
    const values = childOf(series, "c:val") ?? childOf(series, "c:yVal");
    return numberOf(descendantsOf(values, "c:ptCount")[0]) ?? 0;
};

/**
 * The number format of a series' data in the template, from its cache, such as "0%", or undefined for "General".
 *
 * @param name - The data: `c:cat`, `c:val`, `c:xVal`, `c:yVal` or `c:bubbleSize`
 */
export const formatCodeOf = (series: Element | undefined, name: string): string | undefined => {
    const [format] = descendantsOf(childOf(series, name), "c:formatCode");
    const code = format === undefined ? "" : textOf(format).trim();
    return code === "" || code.toLowerCase() === "general" ? undefined : code;
};

/**
 * Whether an Excel number format writes a date or time, such as "d mmm yyyy" or "[h]:mm", rather than a number, such as
 * "#,##0" or "0.0%". Quoted and escaped text, and colours and conditions in brackets, are left out.
 */
export const isDateFormat = (code: string): boolean =>
    /\[(h+|m+|s+)\]/i.test(code) ||
    /[dmyhs]/i.test(
        code
            .replace(/"[^"]*"/g, "")
            .replace(/\\./g, "")
            .replace(/\[[^\]]*\]/g, "")
            .replace(/[_*]./g, ""),
    );
