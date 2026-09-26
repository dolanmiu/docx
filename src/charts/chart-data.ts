/**
 * Lays a chart's data out as Word does in the embedded workbook's sheet: the cells, and the references to them that the
 * chart's series are written with, with the values each holds. Plain data, not XML.
 *
 * @module
 */
import { checkChartOptions } from "./chart-checks";
import { DATE_FORMATS, serialDate, timeUnitOf } from "./chart-dates";
import type { BubbleChartPoint, BubbleChartSeries, ChartPoint, ChartRunOptions, ChartSize, ScatterChartSeries } from "./chart-options";
import { sheetReference } from "./workbook/cell-reference";

/**
 * A number with an Excel number format, such as a date.
 */
export type FormattedNumber = {
    readonly value: number;
    /** The number format, such as `"d mmm yyyy"` */
    readonly format: string;
};

/**
 * A cell of the sheet: text, a number, a number with a format, or empty.
 */
export type ChartCell = string | number | FormattedNumber | undefined;

/**
 * The sheet, row by row from row 1, each row from column A.
 */
export type ChartSheet = readonly (readonly ChartCell[])[];

/**
 * A reference to text in the sheet (`c:strRef`), with the text each cell holds, as the chart caches it.
 */
export type ChartTextData = {
    readonly type: "text";
    /** The formula, such as `Sheet1!$A$2:$A$5` */
    readonly formula: string;
    /** Each cell's text */
    readonly points: readonly string[];
};

/**
 * A reference to numbers in the sheet (`c:numRef`), with the number each cell holds, as the chart caches it.
 */
export type ChartNumberData = {
    readonly type: "number";
    /** The formula, such as `Sheet1!$B$2:$B$5` */
    readonly formula: string;
    /** Each cell's number, or undefined for an empty cell, which is a gap */
    readonly points: readonly (number | undefined)[];
    /** The cells' number format. Default is `"General"` */
    readonly format?: string;
};

/**
 * Where a series' name, categories and values are in the sheet.
 */
export type ChartSeriesData = {
    /** The series' name, in one cell */
    readonly name: ChartTextData;
    /** The categories, or a scatter or bubble series' x values */
    readonly categories: ChartTextData | ChartNumberData;
    /** The values, or a scatter or bubble series' y values */
    readonly values: ChartNumberData;
    /** A bubble series' sizes */
    readonly sizes?: ChartNumberData;
};

/**
 * A chart's data: the sheet, and where each series is in it.
 */
export type ChartData = {
    readonly sheet: ChartSheet;
    readonly series: readonly ChartSeriesData[];
};

/** The size Word inserts a chart at: 6 by 3.5 inches */
export const DEFAULT_CHART_SIZE: ChartSize = { width: 576, height: 336 };

/**
 * The categories, as the sheet's column A writes them and the series refer to them: text, numbers, or dates as numbers
 * with a date format.
 */
const createCategoryData = (
    categories: readonly (string | number | Date)[],
): { readonly cells: readonly ChartCell[]; readonly data: ChartTextData | ChartNumberData } => {
    const formula = sheetReference(0, 1, categories.length);
    if (categories.every((category): category is Date => category instanceof Date)) {
        const format = DATE_FORMATS[timeUnitOf(categories)];
        const points = categories.map(serialDate);
        return { cells: points.map((value) => ({ value, format })), data: { type: "number", formula, points, format } };
    }
    if (categories.every((category) => typeof category === "number")) {
        return { cells: categories, data: { type: "number", formula, points: categories } };
    }
    // The cells keep their own types, and the chart reads them all as text
    return {
        cells: categories.map((category) => (typeof category === "number" ? category : String(category))),
        data: { type: "text", formula, points: categories.map(String) },
    };
};

/**
 * Lays out a chart with categories as Word does: the series' names in row 1 from column B, the categories in column A
 * from row 2, and each series' values below its name. A1 is empty.
 */
const createCategoryChartData = (
    categories: readonly (string | number | Date)[],
    series: readonly { readonly name: string; readonly values: readonly (number | null)[] }[],
): ChartData => {
    const { cells, data: categoryData } = createCategoryData(categories);
    // Each series' value for each category, where a missing value or null is an empty cell
    const values = series.map((one) => categories.map((_, index) => one.values[index] ?? undefined));

    return {
        sheet: [
            [undefined, ...series.map(({ name }) => name)],
            ...cells.map((category, row) => [category, ...values.map((column) => column[row])]),
        ],
        series: series.map(({ name }, index) => ({
            name: { type: "text", formula: sheetReference(index + 1, 0), points: [name] },
            categories: categoryData,
            values: { type: "number", formula: sheetReference(index + 1, 1, categories.length), points: values[index] },
        })),
    };
};

/**
 * Lays out a scatter or bubble chart. Word's scatter sheet shares one column of x values between its series, but each of
 * these series has points of its own, so each series has columns of its own: "X" above its x values, its name above its
 * y values, and for a bubble chart, "Size" above its sizes.
 */
const createPointChartData = (series: readonly (ScatterChartSeries | BubbleChartSeries)[], bubbles: boolean): ChartData => {
    const width = bubbles ? 3 : 2;
    const rows = Math.max(...series.map(({ points }) => points.length));
    const sizeOf = (point: ChartPoint | BubbleChartPoint | undefined): number | undefined =>
        point && "size" in point ? point.size : undefined;
    return {
        sheet: [
            series.flatMap(({ name }) => (bubbles ? ["X", name, "Size"] : ["X", name])),
            ...Array.from({ length: rows }, (_, row) =>
                series.flatMap(({ points }) => {
                    const point: ChartPoint | BubbleChartPoint | undefined = points[row];
                    return bubbles ? [point?.x, point?.y, sizeOf(point)] : [point?.x, point?.y];
                }),
            ),
        ],
        series: series.map(({ name, points }, index) => {
            const column = (offset: number, cells: readonly (number | undefined)[]): ChartNumberData => ({
                type: "number",
                formula: sheetReference(index * width + offset, 1, points.length),
                points: cells,
            });
            const data: ChartSeriesData = {
                name: { type: "text", formula: sheetReference(index * width + 1, 0), points: [name] },
                categories: column(
                    0,
                    points.map(({ x }) => x),
                ),
                values: column(
                    1,
                    points.map(({ y }) => y),
                ),
            };
            return bubbles ? { ...data, sizes: column(2, points.map(sizeOf)) } : data;
        }),
    };
};

/**
 * Checks a chart's options and lays out its data.
 *
 * @throws If an option is wrong: see {@link checkChartOptions}
 */
export const createChartData = (options: ChartRunOptions): ChartData => {
    checkChartOptions(options);
    switch (options.type) {
        case "scatter":
            return createPointChartData(options.series, false);
        case "bubble":
            return createPointChartData(options.series, true);
        default:
            return createCategoryChartData(options.categories, options.series);
    }
};
