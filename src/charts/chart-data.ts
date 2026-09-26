/**
 * Checks a chart's options, and lays its data out as Word does in the embedded workbook's sheet: the cells, and the
 * references to them that the chart's series are written with, with the values each holds. Plain data, not XML.
 *
 * @module
 */
import type {
    ChartPoint,
    ChartRunOptions,
    ChartSeries,
    ChartSize,
    ChartValueAxis,
    PieChartSeries,
    ScatterChartSeries,
} from "./chart-options";
import { sheetReference } from "./workbook/cell-reference";

/**
 * A cell of the sheet: text, a number, or empty.
 */
export type ChartCell = string | number | undefined;

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
};

/**
 * Where a series' name, categories and values are in the sheet.
 */
export type ChartSeriesData = {
    /** The series' name, in one cell */
    readonly name: ChartTextData;
    /** The categories, or a scatter series' x values */
    readonly categories: ChartTextData | ChartNumberData;
    /** The values, or a scatter series' y values */
    readonly values: ChartNumberData;
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
 * Checks that an option is a number in a range, if it is given.
 *
 * @throws If it isn't
 */
export const checkRange = (value: number | undefined, option: string, minimum: number, maximum: number): void => {
    if (value !== undefined && !(value >= minimum && value <= maximum)) {
        throw new Error(`Invalid ${option} ${value}. Expected a number from ${minimum} to ${maximum}`);
    }
};

const checkSize = ({ width, height }: ChartSize): void => {
    for (const [name, value] of [
        ["width", width],
        ["height", height],
    ] as const) {
        if (!(value > 0 && Number.isFinite(value))) {
            throw new Error(`Invalid chart ${name} ${value}. Expected a positive number of pixels`);
        }
    }
};

const checkValueAxis = (axis: ChartValueAxis | undefined, name: string): void => {
    if (axis === undefined) {
        return;
    }
    const { minimum, maximum, interval } = axis;
    for (const [option, value] of [
        ["minimum", minimum],
        ["maximum", maximum],
        ["interval", interval],
    ] as const) {
        if (value !== undefined && !Number.isFinite(value)) {
            throw new Error(`Invalid ${name} ${option} ${value}. Expected a finite number`);
        }
    }
    if (minimum !== undefined && maximum !== undefined && !(minimum < maximum)) {
        throw new Error(`Invalid ${name} range from ${minimum} to ${maximum}. Expected the minimum to be less than the maximum`);
    }
    if (interval !== undefined && !(interval > 0)) {
        throw new Error(`Invalid ${name} interval ${interval}. Expected a number greater than 0`);
    }
};

const checkValue = (value: number | null, series: string): void => {
    if (value !== null && !Number.isFinite(value)) {
        throw new Error(`Invalid value ${value} in series "${series}". Expected a finite number or null`);
    }
};

const checkCategories = (categories: readonly (string | number)[]): void => {
    if (categories.length === 0) {
        throw new Error("A chart needs at least one category");
    }
    for (const category of categories) {
        if (typeof category !== "string" && !Number.isFinite(category)) {
            throw new Error(`Invalid category ${category}. Expected text or a finite number`);
        }
    }
};

const checkSeries = (series: readonly unknown[]): void => {
    if (series.length === 0) {
        throw new Error("A chart needs at least one series");
    }
};

const checkCategorySeries = ({ name, values }: ChartSeries | PieChartSeries, categories: number): void => {
    if (values.length > categories) {
        throw new Error(`Series "${name}" has ${values.length} values, but there are ${categories} categories`);
    }
    for (const value of values) {
        checkValue(value, name);
    }
};

const checkPieSeries = (series: PieChartSeries, categories: number, type: string): void => {
    checkCategorySeries(series, categories);
    // Word draws a negative value's slice at its absolute value, which is rarely what was meant
    const negative = series.values.find((value) => value !== null && value < 0);
    if (negative !== undefined) {
        throw new Error(`Invalid value ${negative} in series "${series.name}". A ${type} chart's values can't be negative`);
    }
    if (series.colors && series.colors.length > categories) {
        throw new Error(`Series "${series.name}" has ${series.colors.length} colors, but there are ${categories} categories`);
    }
};

const checkPoint = ({ x, y }: ChartPoint, series: string): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`Invalid point (${x}, ${y}) in series "${series}". Expected a finite x and y`);
    }
};

const checkScatterSeries = ({ name, points }: ScatterChartSeries): void => {
    if (points.length === 0) {
        throw new Error(`Series "${name}" has no points`);
    }
    for (const point of points) {
        checkPoint(point, name);
    }
};

/**
 * Checks a chart's options, so mistakes show up where the chart is made.
 *
 * @throws If there are no series or categories, a value isn't a finite number or null, a series has more values than
 * there are categories, a pie chart has more than one series or a pie or doughnut chart a negative value, a scatter
 * point isn't two finite numbers, or an option is out of its range
 */
export const checkChartOptions = (options: ChartRunOptions): void => {
    checkSeries(options.series);
    checkSize(options.transformation ?? DEFAULT_CHART_SIZE);

    switch (options.type) {
        case "scatter":
            options.series.forEach(checkScatterSeries);
            checkValueAxis(options.xAxis, "x axis");
            checkValueAxis(options.yAxis, "y axis");
            return;
        case "pie":
        case "doughnut":
            checkCategories(options.categories);
            if (options.type === "pie" && options.series.length > 1) {
                throw new Error(`A pie chart has one series, but ${options.series.length} were given. A doughnut chart can have more`);
            }
            options.series.forEach((series) => checkPieSeries(series, options.categories.length, options.type));
            checkRange(options.firstSliceAngle, "first slice angle", 0, 360);
            checkRange(options.type === "doughnut" ? options.holeSize : undefined, "hole size", 10, 90);
            return;
        default:
            checkCategories(options.categories);
            options.series.forEach((series) => checkCategorySeries(series, options.categories.length));
            checkValueAxis(options.valueAxis, "value axis");
            if (options.type === "column" || options.type === "bar") {
                checkRange(options.gapWidth, "gap width", 0, 500);
                checkRange(options.overlap, "overlap", -100, 100);
            }
    }
};

/**
 * Lays out a chart with categories as Word does: the series' names in row 1 from column B, the categories in column A
 * from row 2, and each series' values below its name. A1 is empty.
 */
const createCategoryChartData = (
    categories: readonly (string | number)[],
    series: readonly (ChartSeries | PieChartSeries)[],
): ChartData => {
    const categoryData: ChartTextData | ChartNumberData = categories.every((category) => typeof category === "number")
        ? { type: "number", formula: sheetReference(0, 1, categories.length), points: categories }
        : { type: "text", formula: sheetReference(0, 1, categories.length), points: categories.map(String) };
    // Each series' value for each category, where a missing value or null is an empty cell
    const values = series.map((one) => categories.map((_, index) => one.values[index] ?? undefined));

    return {
        sheet: [
            [undefined, ...series.map(({ name }) => name)],
            ...categories.map((category, row) => [category, ...values.map((column) => column[row])]),
        ],
        series: series.map(({ name }, index) => ({
            name: { type: "text", formula: sheetReference(index + 1, 0), points: [name] },
            categories: categoryData,
            values: { type: "number", formula: sheetReference(index + 1, 1, categories.length), points: values[index] },
        })),
    };
};

/**
 * Lays out a scatter chart. Word's scatter sheet shares one column of x values between its series, but each of these
 * series has points of its own, so each series has two columns: "X" above its x values, and its name above its y values.
 */
const createScatterChartData = (series: readonly ScatterChartSeries[]): ChartData => {
    const rows = Math.max(...series.map(({ points }) => points.length));
    return {
        sheet: [
            series.flatMap(({ name }) => ["X", name]),
            ...Array.from({ length: rows }, (_, row) => series.flatMap(({ points }) => [points[row]?.x, points[row]?.y])),
        ],
        series: series.map(({ name, points }, index) => ({
            name: { type: "text", formula: sheetReference(index * 2 + 1, 0), points: [name] },
            categories: { type: "number", formula: sheetReference(index * 2, 1, points.length), points: points.map(({ x }) => x) },
            values: { type: "number", formula: sheetReference(index * 2 + 1, 1, points.length), points: points.map(({ y }) => y) },
        })),
    };
};

/**
 * Checks a chart's options and lays out its data.
 *
 * @throws If an option is wrong: see {@link checkChartOptions}
 */
export const createChartData = (options: ChartRunOptions): ChartData => {
    checkChartOptions(options);
    return options.type === "scatter"
        ? createScatterChartData(options.series)
        : createCategoryChartData(options.categories, options.series);
};
