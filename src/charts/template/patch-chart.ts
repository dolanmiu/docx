/**
 * Replaces the data of a chart in a template, keeping its look: each series' name, categories and values, and the
 * series and points added or removed, in the chart part's XML.
 *
 * @module
 */
// cspell:ignore sqref
import type { Element } from "xml-js";

import type { XmlComponent } from "docx";

import type { ChartData, ChartSeriesData } from "../chart-data";
import type { TimeUnit } from "../chart-dates";
import { CHART_NAMESPACE, RELATIONSHIPS_NAMESPACE } from "../chart-space";
import { createSeriesColor } from "../chart-style";
import { type TemplateChart, type TemplateGroup, pointCountOf } from "./template-chart";
import { copySeries, withData, withIndex, withPointsUpTo, withoutPointsPast } from "./template-series";
import {
    attributeOf,
    childOf,
    childrenOf,
    createXmlElement,
    elementsOf,
    mapChildren,
    nameOf,
    numberOf,
    valueOf,
    withAttributes,
    withChild,
    withChildren,
    withoutChildren,
} from "./template-xml";
import { createDataSource, createSeriesName } from "../plot-area/series";

/**
 * The children of a chart part's root (`CT_ChartSpace`), in the schema's order.
 */
export const CHART_SPACE_ORDER: readonly string[] = [
    "c:date1904",
    "c:lang",
    "c:roundedCorners",
    "c:style",
    "c:clrMapOvr",
    "c:pivotSource",
    "c:protection",
    "c:chart",
    "c:spPr",
    "c:txPr",
    "c:externalData",
    "c:printSettings",
    "c:userShapes",
    "c:extLst",
];

// What comes before a group's series: `c:barDir`, `c:grouping`, `c:varyColors` and the like
const BEFORE_SERIES: ReadonlySet<string> = new Set([
    "c:barDir",
    "c:grouping",
    "c:varyColors",
    "c:radarStyle",
    "c:scatterStyle",
    "c:ofPieType",
]);

const AXES: ReadonlySet<string> = new Set(["c:valAx", "c:catAx", "c:dateAx", "c:serAx"]);

// What a date axis has that a category axis doesn't
const DATE_AXIS_ONLY: ReadonlySet<string> = new Set(["c:baseTimeUnit", "c:majorUnit", "c:majorTimeUnit", "c:minorUnit", "c:minorTimeUnit"]);

const TIME_UNITS: readonly string[] = ["days", "months", "years"];

/**
 * The new data, laid out as `docx/charts` lays out a chart's, with the template's number formats.
 */
export type TemplateChartData = ChartData & {
    /** The time unit the categories are spaced by, if they are dates */
    readonly dates: TimeUnit | undefined;
};

/**
 * A group with its series: the template's, patched, and after them, new ones. A group without series of its own has
 * the new ones after its `c:varyColors` and the like.
 */
const withSeries = (group: Element, patched: ReadonlyMap<Element, Element>, added: readonly Element[]): Element => {
    const children = group.elements ?? [];
    const isSeries = (child: Element): boolean => child.type === "element" && child.name === "c:ser";
    const last = children.reduce((found, child, index) => (isSeries(child) ? index : found), -1);
    if (last === -1) {
        const before = children.reduce((found, child, index) => (BEFORE_SERIES.has(nameOf(child)) ? index : found), -1);
        return withChildren(group, [...children.slice(0, before + 1), ...added, ...children.slice(before + 1)]);
    }
    return withChildren(
        group,
        children.flatMap((child, index) => {
            if (!isSeries(child)) {
                return [child];
            }
            const own = patched.get(child);
            return [...(own === undefined ? [] : [own]), ...(index === last ? added : [])];
        }),
    );
};

/**
 * A date axis as a category axis, for categories that aren't dates.
 */
const asCategoryAxis = (axis: Element): Element => ({
    ...withoutChildren(axis, (child) => DATE_AXIS_ONLY.has(nameOf(child))),
    name: "c:catAx",
});

/**
 * A date axis spacing its dates by the new dates' unit, if it spaced them by a longer one, so no two fall together.
 */
const withTimeUnit = (axis: Element, unit: TimeUnit): Element =>
    mapChildren(axis, (child) =>
        child.name === "c:baseTimeUnit" && TIME_UNITS.indexOf(valueOf(child) ?? "days") > TIME_UNITS.indexOf(unit)
            ? [createXmlElement("c:baseTimeUnit", { val: unit })]
            : [child],
    );

// The types whose points each have their own colour, which are the categories' colours rather than the series'
const PIE_TYPES: readonly string[] = ["pie", "doughnut", "pieOfPie", "barOfPie"];

/**
 * A pie of pie or bar of pie chart whose own split (`c:custSplit`) has only the slices it has now.
 */
const withSplitUpTo = (group: Element, count: number): Element =>
    mapChildren(group, (child) => [
        child.name === "c:custSplit"
            ? withoutChildren(child, (point) => point.name === "c:secondPiePt" && !((numberOf(point) ?? count) < count))
            : child,
    ]);

const maxOf = (values: readonly (number | undefined)[]): number =>
    values.reduce<number>((max, value) => (value === undefined ? max : Math.max(max, value)), -1);

/**
 * The chart part's root with the new data.
 *
 * @param format - Formats `docx/charts`' XML as the template's parts are parsed
 * @param createSeries - Creates the series `docx/charts` would write for the new data, for a chart that has none to copy
 * @returns The new root, and the elements of the new data, which refer to the new workbook
 */
export const patchChartSpace = (
    chart: TemplateChart,
    data: TemplateChartData,
    format: (content: XmlComponent) => Element,
    createSeries: () => readonly Element[],
): { readonly chartSpace: Element; readonly references: ReadonlySet<Element> } => {
    const references = new Set<Element>();
    const formatData = (content: XmlComponent): Element => {
        const element = format(content);
        // eslint-disable-next-line functional/immutable-data
        references.add(element);
        return element;
    };
    const dataOf = (series: ChartSeriesData): readonly Element[] => [
        formatData(createSeriesName(series.name)),
        formatData(createDataSource(chart.kind === "category" ? "c:cat" : "c:xVal", series.categories)),
        formatData(createDataSource(chart.kind === "category" ? "c:val" : "c:yVal", series.values)),
        ...(chart.kind === "bubble" && series.sizes ? [formatData(createDataSource("c:bubbleSize", series.sizes))] : []),
    ];
    const colorOf = (index: number): Element => format(createSeriesColor(index));

    const patch = (element: Element, { varyColors }: TemplateGroup, series: ChartSeriesData, templateCount: number): Element => {
        const count = series.values.points.length;
        const withNewData = withoutPointsPast(withData(element, dataOf(series)), count);
        return varyColors ? withPointsUpTo(withNewData, count, templateCount, colorOf) : withNewData;
    };

    // The template's series, as many as there are new ones, in the order they are plotted
    const kept = chart.series.slice(0, data.series.length);
    const patched = new Map(
        kept.map((own, index) => [own.element, patch(own.element, own.group, data.series[index], pointCountOf(own.element))]),
    );

    // New series join the last series' group, with its look. A chart without series gets docx/charts' own
    const model = chart.series[chart.series.length - 1];
    const group = model?.group ?? chart.groups[0];
    const created = model === undefined && data.series.length > 0 ? createSeries() : [];
    const firstIndex = maxOf(chart.series.map(({ index }) => index)) + 1;
    const firstOrder = maxOf(chart.series.map(({ order }) => order)) + 1;
    const added = data.series.slice(kept.length).map((series, offset) => {
        const position = kept.length + offset;
        const base =
            model === undefined
                ? created[position]
                : withIndex(
                      copySeries(model.element, PIE_TYPES.includes(group.type), colorOf(position)),
                      firstIndex + offset,
                      firstOrder + offset,
                  );
        return patch(base, group, series, model === undefined ? 0 : pointCountOf(model.element));
    });

    // Groups left without series are removed, with the axes only they used. A pie of pie's own split keeps only slices it has
    const groups = new Map(
        chart.groups.map(({ element }) => {
            const withNewSeries = withSeries(element, patched, element === group.element ? added : []);
            return [
                element,
                element.name === "c:ofPieChart" ? withSplitUpTo(withNewSeries, data.series[0].values.points.length) : withNewSeries,
            ] as const;
        }),
    );
    const removed = new Set(
        chart.groups
            .filter(({ element }) => childrenOf(element, "c:ser").length > 0 && childrenOf(groups.get(element), "c:ser").length === 0)
            .map(({ element }) => element),
    );
    // The ids of the axes a group is drawn against. An axis without an id is never removed
    const axesOf = (element: Element | undefined): readonly string[] =>
        childrenOf(element, "c:axId").flatMap((axis) => {
            const id = valueOf(axis);
            return id === undefined ? [] : [id];
        });
    const usedAxes = new Set(chart.groups.filter(({ element }) => !removed.has(element)).flatMap(({ element }) => axesOf(element)));
    const unusedAxes = new Set([...removed].flatMap(axesOf).filter((axis) => !usedAxes.has(axis)));

    const plotArea = mapChildren(chart.plotArea, (child) => {
        const patchedGroup = groups.get(child);
        if (patchedGroup !== undefined) {
            return removed.has(child) ? [] : [patchedGroup];
        }
        const id = valueOf(childOf(child, "c:axId"));
        if (AXES.has(nameOf(child)) && id !== undefined && unusedAxes.has(id)) {
            return [];
        }
        if (child.name === "c:dateAx" && chart.kind === "category") {
            return [data.dates === undefined ? asCategoryAxis(child) : withTimeUnit(child, data.dates)];
        }
        return [child];
    });

    // The legend's own entries, such as a hidden one, for series or, when the single series' points each have their
    // own colour, for points that are gone
    const single = data.series.length === 1 ? (kept[0]?.group ?? group) : undefined;
    const entries = single?.varyColors ? data.series[0].values.points.length : data.series.length;
    const newChart = mapChildren(chart.chart, (child) => {
        if (child === chart.plotArea) {
            return [plotArea];
        }
        return [
            child.name === "c:legend"
                ? withoutChildren(child, (entry) => entry.name === "c:legendEntry" && (numberOf(childOf(entry, "c:idx")) ?? 0) >= entries)
                : child,
        ];
    });

    // The new data's dates are counted from 1900, and the elements it adds need their namespaces
    const root = mapChildren(chart.chartSpace, (child) => {
        if (child === chart.chart) {
            return [newChart];
        }
        return [child.name === "c:date1904" ? withAttributes(child, { val: 0 }) : child];
    });
    const namespaces = Object.fromEntries(
        [
            ["xmlns:c", CHART_NAMESPACE],
            ["xmlns:a", "http://schemas.openxmlformats.org/drawingml/2006/main"],
            ["xmlns:r", RELATIONSHIPS_NAMESPACE],
        ].filter(([name]) => attributeOf(root, name) === undefined),
    );
    return { chartSpace: withAttributes(root, namespaces), references };
};

/**
 * The chart part's root, referring to its workbook by a relationship id, with Word's `c:autoUpdate` if it had no
 * reference to a workbook.
 */
export const withWorkbook = (chartSpace: Element, relationshipId: string): Element => {
    const externalData = childOf(chartSpace, "c:externalData");
    if (externalData === undefined) {
        return withChild(
            chartSpace,
            createXmlElement("c:externalData", { "r:id": relationshipId }, [createXmlElement("c:autoUpdate", { val: 0 })]),
            CHART_SPACE_ORDER,
        );
    }
    const name = relationshipIdAttributeOf(externalData) ?? "r:id";
    return mapChildren(chartSpace, (child) => [child === externalData ? withAttributes(child, { [name]: relationshipId }) : child]);
};

/**
 * The name of an element's relationship id attribute, such as `r:id`, whatever its prefix.
 */
export const relationshipIdAttributeOf = (element: Element | undefined): string | undefined =>
    Object.keys(element?.attributes ?? {}).find((name) => name.endsWith(":id") && !name.startsWith("xmlns"));

// The elements that refer to cells: a formula (`c:f`), or a range (`c15:sqref`)
const REFERENCE = /(^|:)(f|sqref)$/;

/**
 * The first element that refers to cells of the chart's workbook, other than the new data's, with the elements it is in.
 */
export const findWorkbookReference = (
    element: Element,
    skip: ReadonlySet<Element>,
    path: readonly Element[] = [],
): readonly Element[] | undefined =>
    elementsOf(element).reduce<readonly Element[] | undefined>((found, child) => {
        if (found !== undefined || skip.has(child)) {
            return found;
        }
        return REFERENCE.test(nameOf(child)) ? [...path, child] : findWorkbookReference(child, skip, [...path, child]);
    }, undefined);

/**
 * Why something that refers to cells of the chart's workbook can't be kept, and what to do in Word.
 *
 * @param path - The element that refers to cells, with the elements it is in
 */
export const describeWorkbookReference = (path: readonly Element[]): string => {
    const names = path.map(nameOf);
    const reason = ((): string => {
        if (names.some((name) => name.endsWith(":datalabelsRange"))) {
            return 'Its data labels show text from cells of its workbook (Word\'s "Value From Cells"). Turn that off in Word';
        }
        if (names.some((name) => /:filtered/.test(name) || /:categoryFilterException/.test(name))) {
            return "It has series or categories hidden with Word's chart filters. Show them, or remove them in Word's Select Data";
        }
        if (names.includes("c:errBars")) {
            return "Its error bars' custom values are cells of its workbook. Give them fixed values in Word, or remove them";
        }
        if (names.includes("c:title")) {
            return "A title is linked to a cell of its workbook. Type the title in Word instead";
        }
        return names.some((name) => name === "c:dLbl" || name === "c:dLbls" || name === "c:trendlineLbl")
            ? "A label is linked to a cell of its workbook. Type the label in Word instead"
            : `Something in it refers to cells of its workbook (${names.join(" > ")})`;
    })();
    return `${reason}: the new data replaces the workbook`;
};
