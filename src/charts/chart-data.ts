/**
 * Lays a chart's data out as Word does in the embedded workbook's sheet: the cells, and the references to them that the
 * chart's series are written with, with the values each holds. Plain data, not XML.
 *
 * @module
 */
import { type ChartCategories, categoryRowsOf, isCategoryGroups } from "./chart-categories";
import { checkChartOptions } from "./chart-checks";
import { DATE_FORMATS, serialDate, timeUnitOf } from "./chart-dates";
import type {
    BubbleChartPoint,
    BubbleChartSeries,
    ChartErrorBars,
    ChartPoint,
    ChartRunOptions,
    ChartSize,
    ScatterChartSeries,
} from "./chart-options";
import { stockSeriesOf } from "./chart-stock";
import { sheetRangeReference, sheetReference } from "./workbook/cell-reference";

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
 * A reference to categories in groups (`c:multiLvlStrRef`), a column for each level, with the labels each level holds.
 */
export type ChartLevelsData = {
    readonly type: "levels";
    /** The formula, such as `Sheet1!$A$2:$B$9` */
    readonly formula: string;
    /** The number of categories */
    readonly count: number;
    /**
     * Each level's labels, the categories' own first, then their groups', out to the outermost. A group's label is at
     * its first category, and the others are undefined
     */
    readonly levels: readonly (readonly (string | undefined)[])[];
};

/**
 * Where custom error bars' amounts are in the sheet: towards higher values, and towards lower ones.
 */
export type ChartErrorData = {
    readonly plus?: ChartNumberData;
    readonly minus?: ChartNumberData;
};

/**
 * Where a series' name, categories and values are in the sheet.
 */
export type ChartSeriesData = {
    /** The series' name, in one cell */
    readonly name: ChartTextData;
    /** The categories, or a scatter or bubble series' x values */
    readonly categories: ChartTextData | ChartNumberData | ChartLevelsData;
    /** The values, or a scatter or bubble series' y values */
    readonly values: ChartNumberData;
    /** A bubble series' sizes */
    readonly sizes?: ChartNumberData;
    /** Custom error bars' amounts: along the values, or a scatter or bubble series' y values, and along its x values */
    readonly errors?: {
        readonly y?: ChartErrorData;
        readonly x?: ChartErrorData;
    };
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

type CategoryLayout = {
    /** The number of columns the categories take up: one, or one for each level of groups */
    readonly width: number;
    /** Each category's row of cells */
    readonly rows: readonly (readonly ChartCell[])[];
    readonly data: ChartTextData | ChartNumberData | ChartLevelsData;
};

/**
 * The categories, as the sheet's first columns write them and the series refer to them: text, numbers, dates as numbers
 * with a date format, or groups, a column for each level from the outermost in.
 */
const createCategoryData = (categories: ChartCategories): CategoryLayout => {
    if (isCategoryGroups(categories)) {
        const rows = categoryRowsOf(categories);
        const width = rows[0].length;
        return {
            width,
            rows,
            data: {
                type: "levels",
                formula: sheetRangeReference(0, width - 1, 1, rows.length),
                count: rows.length,
                levels: Array.from({ length: width }, (_, level) =>
                    rows.map((row) => {
                        const label = row[width - 1 - level];
                        return label === undefined ? undefined : String(label);
                    }),
                ),
            },
        };
    }
    const formula = sheetReference(0, 1, categories.length);
    if (categories.every((category): category is Date => category instanceof Date)) {
        const format = DATE_FORMATS[timeUnitOf(categories)];
        const points = categories.map(serialDate);
        return { width: 1, rows: points.map((value) => [{ value, format }]), data: { type: "number", formula, points, format } };
    }
    if (categories.every((category) => typeof category === "number")) {
        return { width: 1, rows: categories.map((category) => [category]), data: { type: "number", formula, points: categories } };
    }
    // The cells keep their own types, and the chart reads them all as text
    return {
        width: 1,
        rows: categories.map((category) => [typeof category === "number" ? category : String(category)]),
        data: { type: "text", formula, points: categories.map(String) },
    };
};

/**
 * A column of the sheet: its heading in row 1, and its cells below.
 */
type SheetColumn = {
    readonly heading: string;
    readonly cells: readonly (number | undefined)[];
};

/**
 * The columns of a series' custom error bars' amounts, with a name each, and where they are, from a column on.
 */
const createErrorColumns = (
    errorBars: ChartErrorBars | undefined,
    heading: string,
    rows: number,
    column: number,
): { readonly columns: readonly SheetColumn[]; readonly data?: ChartErrorData } => {
    if (errorBars?.type !== "custom") {
        return { columns: [] };
    }
    const sides = (
        [
            ["plus", "+", errorBars.plus],
            ["minus", "-", errorBars.minus],
        ] as const
    ).flatMap(([side, sign, amounts]) => (amounts === undefined ? [] : [{ side, sign, amounts }]));
    const cellsOf = (amounts: readonly (number | null)[]): readonly (number | undefined)[] =>
        Array.from({ length: rows }, (_, row) => amounts[row] ?? undefined);
    const dataOf = (side: "plus" | "minus"): ChartNumberData | undefined => {
        const index = sides.findIndex((one) => one.side === side);
        return index === -1
            ? undefined
            : { type: "number", formula: sheetReference(column + index, 1, rows), points: cellsOf(sides[index].amounts) };
    };
    const plus = dataOf("plus");
    const minus = dataOf("minus");
    return {
        columns: sides.map(({ sign, amounts }) => ({ heading: `${heading} (${sign})`, cells: cellsOf(amounts) })),
        data: { ...(plus === undefined ? {} : { plus }), ...(minus === undefined ? {} : { minus }) },
    };
};

/**
 * The sheet with columns added on the right, their headings in row 1. The sheet has a row for every cell of theirs.
 */
const withColumns = (sheet: ChartSheet, columns: readonly SheetColumn[]): ChartSheet =>
    sheet.map((row, index) => [...row, ...columns.map((column) => (index === 0 ? column.heading : column.cells[index - 1]))]);

type CategorySeries = {
    readonly name: string;
    readonly values: readonly (number | null)[];
    readonly errorBars?: ChartErrorBars;
};

/**
 * Lays out a chart with categories as Word does: the series' names in row 1 after the categories' columns, the
 * categories in column A from row 2, or in columns A, B and so on when they are in groups, and each series' values below
 * its name. The top left cells are empty. Custom error bars' amounts are in columns after the series.
 */
const createCategoryChartData = (categories: ChartCategories, series: readonly CategorySeries[]): ChartData => {
    const { width, rows, data: categoryData } = createCategoryData(categories);
    // Each series' value for each category, where a missing value or null is an empty cell
    const values = series.map((one) => rows.map((_, index) => one.values[index] ?? undefined));
    const sheet: ChartSheet = [
        [...Array.from({ length: width }, () => undefined), ...series.map(({ name }) => name)],
        ...rows.map((category, row) => [...category, ...values.map((column) => column[row])]),
    ];

    const errors = series.reduce<{ readonly next: number; readonly all: readonly ReturnType<typeof createErrorColumns>[] }>(
        ({ next, all }, one) => {
            const columns = createErrorColumns(one.errorBars, one.name, rows.length, next);
            return { next: next + columns.columns.length, all: [...all, columns] };
        },
        { next: width + series.length, all: [] },
    ).all;

    return {
        sheet: withColumns(
            sheet,
            errors.flatMap(({ columns }) => columns),
        ),
        series: series.map(({ name }, index) => ({
            name: { type: "text", formula: sheetReference(width + index, 0), points: [name] },
            categories: categoryData,
            values: { type: "number", formula: sheetReference(width + index, 1, rows.length), points: values[index] },
            ...(errors[index].data === undefined ? {} : { errors: { y: errors[index].data } }),
        })),
    };
};

/**
 * Lays out a scatter or bubble chart. Word's scatter sheet shares one column of x values between its series, but each of
 * these series has points of its own, so each series has columns of its own: "X" above its x values, its name above its
 * y values, and for a bubble chart, "Size" above its sizes. Custom error bars' amounts are in columns after the series.
 */
const createPointChartData = (series: readonly (ScatterChartSeries | BubbleChartSeries)[], bubbles: boolean): ChartData => {
    const width = bubbles ? 3 : 2;
    const rows = Math.max(...series.map(({ points }) => points.length));
    const sizeOf = (point: ChartPoint | BubbleChartPoint | undefined): number | undefined =>
        point && "size" in point ? point.size : undefined;
    const sheet: ChartSheet = [
        series.flatMap(({ name }) => (bubbles ? ["X", name, "Size"] : ["X", name])),
        ...Array.from({ length: rows }, (_, row) =>
            series.flatMap(({ points }) => {
                const point: ChartPoint | BubbleChartPoint | undefined = points[row];
                return bubbles ? [point?.x, point?.y, sizeOf(point)] : [point?.x, point?.y];
            }),
        ),
    ];

    const errors = series.reduce<{
        readonly next: number;
        readonly all: readonly { readonly x: ReturnType<typeof createErrorColumns>; readonly y: ReturnType<typeof createErrorColumns> }[];
    }>(
        ({ next, all }, { name, points, xErrorBars, yErrorBars }) => {
            const x = createErrorColumns(xErrorBars, `${name} x`, points.length, next);
            const y = createErrorColumns(yErrorBars, `${name} y`, points.length, next + x.columns.length);
            return { next: next + x.columns.length + y.columns.length, all: [...all, { x, y }] };
        },
        { next: series.length * width, all: [] },
    ).all;

    return {
        sheet: withColumns(
            sheet,
            errors.flatMap(({ x, y }) => [...x.columns, ...y.columns]),
        ),
        series: series.map(({ name, points }, index) => {
            const column = (offset: number, cells: readonly (number | undefined)[]): ChartNumberData => ({
                type: "number",
                formula: sheetReference(index * width + offset, 1, points.length),
                points: cells,
            });
            const { x, y } = errors[index];
            const data: ChartSeriesData = {
                name: { type: "text", formula: sheetReference(index * width + 1, 0), points: [name] },
                categories: column(
                    0,
                    points.map((point) => point.x),
                ),
                values: column(
                    1,
                    points.map((point) => point.y),
                ),
                ...(x.data === undefined && y.data === undefined
                    ? {}
                    : { errors: { ...(x.data === undefined ? {} : { x: x.data }), ...(y.data === undefined ? {} : { y: y.data }) } }),
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
        case "stock":
            return createCategoryChartData(options.categories, stockSeriesOf(options));
        default:
            return createCategoryChartData(options.categories, options.series);
    }
};
