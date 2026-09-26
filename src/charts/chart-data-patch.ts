/**
 * Replaces the data of charts in a template, such as charts made in Word, with `patchDocument`, keeping their look.
 *
 * @module
 */
// cspell:ignore descr
import type { Element } from "xml-js";

import { DrawingPatch, type TemplateDrawing, type TemplatePackage } from "docx";

import { checkChartOptions } from "./chart-checks";
import { type ChartData, type ChartNumberData, type ChartSheet, type ChartTextData, createChartData } from "./chart-data";
import { timeUnitOf } from "./chart-dates";
import { describeChart } from "./chart-description";
import type { BubbleChartPoint, ChartPoint, ChartRunOptions, ChartType } from "./chart-options";
import { createPlotArea } from "./plot-area/plot-area";
import {
    type TemplateChartData,
    describeWorkbookReference,
    findWorkbookReference,
    patchChartSpace,
    relationshipIdAttributeOf,
    withWorkbook,
} from "./template/patch-chart";
import { type TemplateChart, formatCodeOf, isDateFormat, readTemplateChart } from "./template/template-chart";
import { attributeOf, childOf, descendantsOf, valueOf, withAttributes } from "./template/template-xml";
import { columnIndexOf } from "./workbook/cell-reference";
import { createWorkbookPart } from "./workbook/workbook";

/**
 * A series of new data for a chart with categories: a column, bar, line, area, pie, doughnut or radar chart.
 *
 * @publicApi
 */
export type CategoryChartDataSeries = {
    /** The series' name, shown in the legend */
    readonly name: string;
    /** One value for each category, in order. `null` leaves a gap. A series can have fewer values than there are categories */
    readonly values: readonly (number | null)[];
};

/**
 * A series of new data for a scatter or bubble chart.
 *
 * @publicApi
 */
export type PointChartDataSeries = {
    /** The series' name, shown in the legend */
    readonly name: string;
    /** The series' points, in order. A bubble chart's points each need a size, which a scatter chart's leave out */
    readonly points: readonly (ChartPoint | BubbleChartPoint)[];
};

/**
 * New data for a chart with categories: a column, bar, line, area, pie, doughnut or radar chart.
 *
 * @publicApi
 */
export type CategoryChartDataPatchOptions = {
    /**
     * The categories, in order. If they are all numbers, they are written as numbers. If they are all dates, a column,
     * bar, line or area chart spaces them by date
     */
    readonly categories: readonly (string | number | Date)[];
    /** The series, one value for each category. A pie chart has one */
    readonly series: readonly CategoryChartDataSeries[];
    /**
     * The chart's alt text description. Default is a description of the chart from its new data, such as "Column chart,
     * Sales. 2025: Jan 10, Feb 20.", and none for a decorative chart. An empty description removes it
     */
    readonly description?: string;
};

/**
 * New data for a scatter or bubble chart.
 *
 * @publicApi
 */
export type PointChartDataPatchOptions = {
    /** The series, each with its points */
    readonly series: readonly PointChartDataSeries[];
    /**
     * The chart's alt text description. Default is a description of the chart from its new data, and none for a
     * decorative chart. An empty description removes it
     */
    readonly description?: string;
};

/**
 * The new data of a chart in a template: categories and each series' values, or for a scatter or bubble chart, each
 * series' points.
 *
 * @publicApi
 */
export type ChartDataPatchOptions = CategoryChartDataPatchOptions | PointChartDataPatchOptions;

// The data, copied, so changes to the options after the patch is made don't change it
type PatchData =
    | {
          readonly kind: "category";
          readonly categories: readonly (string | number | Date)[];
          readonly series: readonly CategoryChartDataSeries[];
          readonly description: string | undefined;
      }
    | {
          readonly kind: "points";
          readonly series: readonly PointChartDataSeries[];
          readonly description: string | undefined;
      };

const quoted = (value: unknown): string => (typeof value === "string" ? `"${value}"` : String(value));

const checkSize = ({ x, y, size }: ChartPoint & { readonly size?: number }, series: string): void => {
    if (size !== undefined && !(typeof size === "number" && size >= 0 && Number.isFinite(size))) {
        throw new Error(
            `Invalid size ${quoted(size)} of the point at (${x}, ${y}) in series "${series}". Expected a finite number of 0 or more`,
        );
    }
};

/**
 * Checks the options, and copies the data.
 *
 * @throws If there are no series, a series has no name, has neither values nor points, or has one and other series the
 * other, series with values have no categories or series with points have them, or the data is wrong, as for
 * `ChartRun`: see its errors
 */
const readOptions = (options: ChartDataPatchOptions): PatchData => {
    if (typeof options !== "object" || options === null) {
        throw new Error(
            `Invalid chart data ${quoted(options)}. Expected { categories, series }, or for a scatter or bubble chart, { series }`,
        );
    }
    const { series, description } = options as Partial<CategoryChartDataPatchOptions & PointChartDataPatchOptions>;
    if (!Array.isArray(series) || series.length === 0) {
        throw new Error("A chart needs at least one series");
    }
    if (description !== undefined && typeof description !== "string") {
        throw new Error(`Invalid description ${quoted(description)}. Expected text`);
    }
    const shapes = series.map((one: unknown, index) => {
        const { name, values, points } = (typeof one === "object" && one !== null ? one : {}) as Partial<
            CategoryChartDataSeries & PointChartDataSeries
        >;
        if (typeof name !== "string") {
            throw new Error(`Invalid name ${quoted(name)} of series ${index + 1}. Expected text`);
        }
        if (Array.isArray(values) === Array.isArray(points)) {
            throw new Error(`Series "${name}" needs values, for a chart with categories, or points, for a scatter or bubble chart`);
        }
        return { name, points: Array.isArray(points) };
    });
    const withPoints = shapes.find(({ points }) => points);
    const withValues = shapes.find(({ points }) => !points);
    if (withPoints !== undefined && withValues !== undefined) {
        throw new Error(
            `Series "${withValues.name}" has values, and series "${withPoints.name}" has points. A chart's series all have values, or all have points`,
        );
    }
    const { categories } = options as Partial<CategoryChartDataPatchOptions>;

    if (withPoints !== undefined) {
        if (categories !== undefined) {
            throw new Error("Invalid option categories. The series have points, which have their own x values");
        }
        const pointSeries = (series as readonly PointChartDataSeries[]).map(({ name, points }) => ({
            name,
            points: points.map((point) => ({ ...point })),
        }));
        checkChartOptions({ type: "scatter", series: pointSeries });
        pointSeries.forEach(({ name, points }) => points.forEach((point) => checkSize(point, name)));
        return { kind: "points", series: pointSeries, description };
    }

    if (!Array.isArray(categories)) {
        throw new Error("Invalid option categories. Series with values need categories, one for each value");
    }
    const copiedCategories = categories.map((category: unknown) =>
        category instanceof Date ? new Date(category.getTime()) : category,
    ) as readonly (string | number | Date)[];
    const copied = (series as readonly CategoryChartDataSeries[]).map(({ name, values }) => ({ name, values: [...values] }));
    // A line chart has the checks every chart with categories has: dates, negative values and more than one series
    // are checked for the template's chart's type when it is patched
    checkChartOptions({ type: "line", categories: copiedCategories, series: copied });
    return { kind: "category", categories: copiedCategories, series: copied, description };
};

const withArticle = (type: ChartType): string => `${type === "area" ? "an" : "a"} ${type} chart`;

/**
 * The options `docx/charts` would draw the new data with in the template's chart's type, which check the data and
 * describe it.
 *
 * @throws If the data isn't for the chart's type: values for a scatter or bubble chart, points for another, or points
 * without sizes for a bubble chart
 */
const optionsFor = (chart: TemplateChart, data: PatchData): ChartRunOptions => {
    const title = chart.title?.trim() ? chart.title : undefined;
    if (chart.kind === "category") {
        if (data.kind !== "category") {
            throw new Error(
                `It is ${withArticle(chart.type)}, whose series have a value for each category. Give categories, and each series values`,
            );
        }
        return { type: chart.type, title, categories: data.categories, series: data.series } as ChartRunOptions;
    }
    if (data.kind !== "points") {
        throw new Error(
            `It is ${withArticle(chart.type)}, whose series have points. Give each series points, with an x and y${chart.kind === "bubble" ? " and a size" : ""}`,
        );
    }
    if (chart.kind === "scatter") {
        return {
            type: "scatter",
            title,
            series: data.series.map(({ name, points }) => ({ name, points: points.map(({ x, y }) => ({ x, y })) })),
        };
    }
    return {
        type: "bubble",
        title,
        series: data.series.map(({ name, points }) => ({
            name,
            points: points.map((point) => {
                if (!("size" in point) || point.size === undefined) {
                    throw new Error(
                        `The point at (${point.x}, ${point.y}) in series "${name}" has no size, and a bubble chart's points each need one`,
                    );
                }
                return point;
            }),
        })),
    };
};

// A cell reference's column and rows, such as B, 2 and 5 for Sheet1!$B$2:$B$5
const rangeOf = (formula: string): { readonly column: number; readonly first: number; readonly last: number } => {
    // The formulas are docx/charts' own, so always match
    const [, column, first, last] = /\$([A-Z]+)\$(\d+)(?::\$[A-Z]+\$(\d+))?$/.exec(formula)!;
    return { column: columnIndexOf(column), first: Number(first) - 1, last: Number(last ?? first) - 1 };
};

/**
 * The sheet with a number format on the cells a reference refers to.
 */
const withCellFormat = (sheet: ChartSheet, data: ChartTextData | ChartNumberData | undefined): ChartSheet => {
    if (data?.type !== "number" || data.format === undefined) {
        return sheet;
    }
    const { format } = data;
    const { column, first, last } = rangeOf(data.formula);
    return sheet.map((row, index) =>
        index < first || index > last
            ? row
            : row.map((cell, at) =>
                  at !== column || cell === undefined || typeof cell === "string"
                      ? cell
                      : { value: typeof cell === "number" ? cell : cell.value, format },
              ),
    );
};

/**
 * The data with the template's number formats, such as "0%", in its caches and cells, as Word keeps a chart's number
 * formats when its data is edited. Categories keep the template's format if it and the new categories are both dates,
 * or both other numbers.
 *
 * @param unit - The unit the categories are spaced by, if they are dates
 */
const withTemplateFormats = (data: ChartData, chart: TemplateChart, unit: TemplateChartData["dates"]): TemplateChartData => {
    const withFormat = <Data extends ChartTextData | ChartNumberData>(own: Data, format: string | undefined): Data =>
        own.type === "number" && format !== undefined ? { ...own, format } : own;
    const categoryFormat = (own: ChartTextData | ChartNumberData, format: string | undefined): string | undefined => {
        if (own.type === "text" || format === undefined || chart.kind !== "category") {
            return format;
        }
        // Dates have their own format, which the template's replaces only if it is a date format too
        return (own.format !== undefined) === isDateFormat(format) ? format : undefined;
    };

    const series = data.series.map((one, index) => {
        // A new series has the look, and formats, of the template's last
        const template = (chart.series[index] ?? chart.series[chart.series.length - 1])?.element;
        const categoriesName = chart.kind === "category" ? "c:cat" : "c:xVal";
        const valuesName = chart.kind === "category" ? "c:val" : "c:yVal";
        return {
            ...one,
            categories: withFormat(one.categories, categoryFormat(one.categories, formatCodeOf(template, categoriesName))),
            values: withFormat(one.values, formatCodeOf(template, valuesName)),
            ...(one.sizes === undefined ? {} : { sizes: withFormat(one.sizes, formatCodeOf(template, "c:bubbleSize")) }),
        };
    });
    // A chart's categories are all in the same cells, so the first series' format is theirs
    const shared = chart.kind === "category" ? series.map((one) => ({ ...one, categories: series[0].categories })) : series;
    const sheet = shared.reduce(
        (cells, one, index) =>
            [one.values, one.sizes, ...(chart.kind === "category" && index > 0 ? [] : [one.categories])].reduce(withCellFormat, cells),
        data.sheet,
    );
    return { sheet, series: shared, dates: unit };
};

// The chart a drawing shows: the relationship id of its `c:chart`
const chartIdOf = (drawing: Element): string => {
    const charts = descendantsOf(drawing, "c:chart");
    if (charts.length > 1) {
        throw new Error(`It is a group of ${charts.length} charts. Put the placeholder in the alt text of one of them`);
    }
    if (charts.length === 0) {
        if (descendantsOf(drawing, "cx:chart").length > 0) {
            throw new Error(
                "It is a chart of a type Office 2016 added, such as a waterfall, histogram or treemap chart, which ChartDataPatch can't patch",
            );
        }
        if (descendantsOf(drawing, "pic:pic").length > 0) {
            throw new Error("It is a picture, not a chart");
        }
        if (descendantsOf(drawing, "wps:wsp").length > 0) {
            throw new Error("It is a shape, not a chart");
        }
        throw new Error("It isn't a chart");
    }
    const name = relationshipIdAttributeOf(charts[0]);
    const id = name === undefined ? undefined : attributeOf(charts[0], name);
    if (!id) {
        throw new Error("Its c:chart has no relationship id (r:id)");
    }
    return id;
};

/**
 * Sets the chart's alt text: a description of the new data, as a description of the template's data no longer fits it,
 * and its title without the placeholder. A decorative chart isn't described.
 */
const setAltText = ({ properties, placeholder }: TemplateDrawing, description: string | undefined, describe: () => string): void => {
    const title = attributeOf(properties, "title");
    const decorative = descendantsOf(properties, "adec:decorative").some((element) => !["0", "false"].includes(valueOf(element) ?? "1"));
    const newDescription = description ?? (decorative ? undefined : describe());

    properties.attributes = withAttributes(properties, {
        descr: newDescription || undefined,
        title: title?.split(placeholder).join("").trim() || undefined,
    }).attributes;
};

/**
 * Replaces the data of a chart in a template, found by a placeholder in its alt text, such as `{{sales}}`, keeping its
 * look: its type, title, colours, fonts, labels, axes and legend. Give it as a patch to `patchDocument`, with the
 * placeholder's key.
 *
 * - Each series' name and data are replaced, in the order the series are plotted, and its data is written in the
 *   chart's own number formats, such as "0%".
 * - New series copy the look of the template's last series, in their own colour, the next of the theme's accents, as
 *   `ChartRun` colours them. Series the new data doesn't have are removed, with any axes only they used.
 * - Points past the new data lose their own colours and labels. When each slice of a pie has its own colour, new
 *   slices take the next of the theme's accents.
 * - The chart's workbook is replaced with one holding the new data, so Word's "Edit Data" opens it.
 * - The alt text's description is replaced with a description of the new data.
 *
 * The patch checks the data against the chart's type when the document is patched: a pie chart has one series, and a
 * scatter or bubble chart's series have points. Put the placeholder in the chart's alt text in Word, in "Alt Text" or
 * "Edit Alt Text". A placeholder in the document's text is left as it is.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * await patchDocument({
 *   outputType: "nodebuffer",
 *   data: template,
 *   patches: {
 *     sales: new ChartDataPatch({
 *       categories: ["Jan", "Feb", "Mar"],
 *       series: [{ name: "2025", values: [10, 20, 30] }],
 *     }),
 *   },
 * });
 * ```
 */
export class ChartDataPatch extends DrawingPatch {
    private readonly data: PatchData;
    // The chart parts patched, so a chart two drawings show is patched once
    private readonly patched = new WeakSet<Element>();

    /**
     * @throws If there are no series, a series has no name, or has neither values nor points, some series have values
     * and others points, series with values have no categories, or a value, category or point is wrong, as for
     * `ChartRun`
     */
    public constructor(options: ChartDataPatchOptions) {
        super();
        this.data = readOptions(options);
    }

    /**
     * Replaces the chart's data, and its workbook, and describes it in its alt text.
     *
     * @throws If the drawing isn't a chart, is a type of chart this can't patch, such as a stock chart, or has something
     * that refers to its workbook's cells other than its data, such as labels from cells, or the data isn't for the
     * chart's type, such as two series for a pie chart
     */
    public patch(drawing: TemplateDrawing, template: TemplatePackage): void {
        try {
            this.patchChart(drawing, template);
        } catch (error) {
            throw new Error(`Can't patch the chart ${drawing.placeholder}. ${error instanceof Error ? error.message : String(error)}`, {
                cause: error,
            });
        }
    }

    private patchChart(drawing: TemplateDrawing, template: TemplatePackage): void {
        const part = template.getRelatedPart(drawing.part, chartIdOf(drawing.element));
        if (part?.xml === undefined) {
            throw new Error("It refers to a chart part the template doesn't have");
        }
        const chartSpace = childOf(part.xml, "c:chartSpace");
        if (chartSpace === undefined) {
            throw new Error(`Its part ${part.path} isn't a chart: it has no c:chartSpace`);
        }
        const chart = readTemplateChart(chartSpace);
        const options = optionsFor(chart, this.data);

        if (!this.patched.has(part.xml)) {
            const categories: readonly (string | number | Date)[] = "categories" in options ? options.categories : [];
            const dates = categories.filter((category): category is Date => category instanceof Date);
            const data = withTemplateFormats(createChartData(options), chart, dates.length > 0 ? timeUnitOf(dates) : undefined);
            const patched = patchChartSpace(chart, data, template.format, () =>
                descendantsOf(template.format(createPlotArea(options, data)), "c:ser"),
            );
            const reference = findWorkbookReference(patched.chartSpace, patched.references);
            if (reference !== undefined) {
                throw new Error(describeWorkbookReference(reference));
            }
            const externalData = childOf(chartSpace, "c:externalData");
            const name = relationshipIdAttributeOf(externalData);
            const id = template.replaceRelatedPart(
                part,
                name === undefined ? undefined : attributeOf(externalData, name),
                createWorkbookPart(data.sheet),
            );
            const withNewWorkbook = withWorkbook(patched.chartSpace, id);
            // eslint-disable-next-line functional/immutable-data
            part.xml.elements = part.xml.elements!.map((element) => (element === chartSpace ? withNewWorkbook : element));
            this.patched.add(part.xml);
        }

        setAltText(drawing, this.data.description, () => describeChart(options));
    }
}
