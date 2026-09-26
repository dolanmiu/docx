/**
 * Checks a chart's options, so mistakes show up where the chart is made rather than when the document is opened.
 *
 * @module
 */
import { type ChartCategories, isCategoryGroups, leafCategoriesOf } from "./chart-categories";
import { checkDate } from "./chart-dates";
import { legendEntriesOf } from "./chart-legend";
import type {
    BubbleChartSeries,
    ChartAreaStyle,
    ChartAxis,
    ChartAxisCrossing,
    ChartDataLabels,
    ChartDataTable,
    ChartDisplayUnits,
    ChartEmptyValues,
    ChartErrorBars,
    ChartFont,
    ChartLine,
    ChartMarker,
    ChartPoint,
    ChartRunOptions,
    ChartSeries,
    ChartSize,
    ChartTitle,
    ChartTrendline,
    ChartTrendlineType,
    ChartValueAxis,
    PieChartSeries,
    PieChartSplit,
    RadarChartSeries,
    ScatterChartSeries,
    SplitPieChartBaseOptions,
    StockChartOptions,
} from "./chart-options";
import { stockSeriesOf } from "./chart-stock";

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

/**
 * A value as an error message writes it: text in quotes, so "5" isn't mistaken for a number.
 */
const quoted = (value: unknown): string => (typeof value === "string" ? `"${value}"` : String(value));

/**
 * Checks that an option is a whole number in a range, if it is given.
 */
const checkWholeNumber = (value: number | undefined, option: string, minimum: number, maximum: number): void => {
    if (value !== undefined && !(Number.isInteger(value) && value >= minimum && value <= maximum)) {
        throw new Error(`Invalid ${option} ${quoted(value)}. Expected a whole number from ${minimum} to ${maximum}`);
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

const checkFont = (font: ChartFont | undefined): void => checkRange(font?.size, "font size", 1, 4000);

const checkTitle = (title: string | ChartTitle | undefined): void => checkFont(typeof title === "object" ? title.font : undefined);

const checkLine = (line: ChartLine | undefined): void => checkRange(line?.width, "line width", 0, 1584);

const checkArea = (area: ChartAreaStyle | undefined): void => checkLine(area?.border === "none" ? undefined : area?.border);

const checkMarkers = (markers: boolean | ChartMarker | undefined): void =>
    checkRange(typeof markers === "object" ? markers.size : undefined, "marker size", 2, 72);

const checkDataLabels = (labels: false | ChartDataLabels | undefined): void => checkFont(labels ? labels.font : undefined);

// What labels can show, other than text of their own
const SHOWN: readonly string[] = ["value", "category", "seriesName", "percentage", "bubbleSize"];

/**
 * Checks the labels of single points: no more than there are points, each a label's options, `false` or undefined, and
 * a label with text showing nothing else.
 *
 * @param points - How many points the series has room for, and what they are, for messages
 */
const checkPointLabels = (
    series: { readonly name: string; readonly pointLabels?: readonly unknown[] },
    count: number,
    points: "categories" | "points",
): void => {
    const { name, pointLabels } = series;
    if (pointLabels === undefined) {
        return;
    }
    if (!Array.isArray(pointLabels)) {
        throw new Error(`Invalid point labels ${quoted(pointLabels)} for series "${name}". Expected a label for each point, in order`);
    }
    if (pointLabels.length > count) {
        throw new Error(`Series "${name}" has ${pointLabels.length} point labels, but there are ${count} ${points}`);
    }
    pointLabels.forEach((label: unknown, index) => {
        if (label === undefined || label === false) {
            return;
        }
        if (typeof label !== "object" || label === null) {
            throw new Error(
                `Invalid label ${quoted(label)} of point ${index + 1} of series "${name}". Expected a label's options, false or undefined`,
            );
        }
        const { text, numberFormat, font } = label as {
            readonly text?: unknown;
            readonly numberFormat?: unknown;
            readonly font?: ChartFont;
        };
        if (text !== undefined) {
            if (typeof text !== "string") {
                throw new Error(`Invalid text ${quoted(text)} of the label of point ${index + 1} of series "${name}". Expected text`);
            }
            const shown = [...SHOWN, "numberFormat"].find((option) => (label as Record<string, unknown>)[option] !== undefined);
            if (shown !== undefined) {
                throw new Error(
                    `Invalid option ${shown} of the label of point ${index + 1} of series "${name}". A label with text shows only its text`,
                );
            }
        }
        if (numberFormat !== undefined && typeof numberFormat !== "string") {
            throw new Error(`Invalid number format ${quoted(numberFormat)} of the label of point ${index + 1} of series "${name}"`);
        }
        checkFont(font);
    });
};

/**
 * Checks where an axis crosses the other: a place, a finite number, or, on a value axis crossing categories that are
 * dates, a date. A value axis crossing dates takes a date rather than a category's number.
 *
 * @param dates - Whether the axis crosses categories that are dates
 */
const checkCrossing = (crossesAt: ChartAxisCrossing | undefined, name: string, dates: boolean): void => {
    if (crossesAt instanceof Date) {
        if (!dates) {
            throw new Error(
                `Invalid ${name} crossing ${String(crossesAt)}. A date is only for a value axis crossing categories that are dates`,
            );
        }
        checkDate(crossesAt);
        return;
    }
    if (typeof crossesAt === "number" ? !Number.isFinite(crossesAt) : ![undefined, "auto", "minimum", "maximum"].includes(crossesAt)) {
        throw new Error(`Invalid ${name} crossing ${crossesAt}. Expected "auto", "minimum", "maximum" or a finite number`);
    }
    if (dates && typeof crossesAt === "number") {
        throw new Error(`Invalid ${name} crossing ${crossesAt}. The categories are dates, so expected a date`);
    }
};

const checkAxis = (axis: ChartAxis | undefined, name: string, dates = false): void => {
    checkTitle(axis?.title);
    checkFont(axis?.font);
    checkRange(axis?.labelRotation, `${name} label rotation`, -90, 90);
    checkCrossing(axis?.crossesAt, name, dates);
};

const DISPLAY_UNITS: readonly ChartDisplayUnits[] = [
    "hundreds",
    "thousands",
    "tenThousands",
    "hundredThousands",
    "millions",
    "tenMillions",
    "hundredMillions",
    "billions",
    "trillions",
];

/**
 * @param dates - Whether the axis crosses categories that are dates
 */
const checkValueAxis = (axis: ChartValueAxis | undefined, name: string, dates = false): void => {
    checkAxis(axis, name, dates);
    if (axis === undefined) {
        return;
    }
    const { minimum, maximum, interval, logarithmicBase, displayUnits } = axis;
    if (displayUnits !== undefined && !DISPLAY_UNITS.includes(displayUnits)) {
        throw new Error(`Invalid ${name} display units "${displayUnits}". Expected one of ${DISPLAY_UNITS.join(", ")}`);
    }
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
    checkRange(logarithmicBase, `${name} logarithmic base`, 2, 1000);
    if (logarithmicBase !== undefined) {
        for (const [option, value] of [
            ["minimum", minimum],
            ["maximum", maximum],
        ] as const) {
            if (value !== undefined && !(value > 0)) {
                throw new Error(`Invalid ${name} ${option} ${value}. A logarithmic axis' range is above 0`);
            }
        }
    }
};

const checkValue = (value: number | null, series: string): void => {
    if (value !== null && !Number.isFinite(value)) {
        throw new Error(`Invalid value ${quoted(value)} in series "${series}". Expected a finite number or null`);
    }
};

const isGroup = (category: unknown): boolean => typeof category === "object" && category !== null && !(category instanceof Date);

/**
 * Checks groups of categories: each has a name and at least one category, holds categories or groups but not both, and
 * every group at the same depth holds groups as deep.
 *
 * @returns How deep the groups are: 1 for groups of categories, 2 for groups of those, and so on
 */
const checkGroups = (groups: readonly unknown[]): number => {
    const depths = groups.map((group) => {
        const { name, categories } = (isGroup(group) ? group : {}) as { readonly name?: unknown; readonly categories?: unknown };
        if (!isGroup(group) || typeof name !== "string" || !Array.isArray(categories)) {
            throw new Error(
                `Invalid category group ${isGroup(group) ? JSON.stringify(group) : quoted(group)}. Expected { name, categories }, as every category is a group or none is`,
            );
        }
        if (categories.length === 0) {
            throw new Error(`Category group "${name}" has no categories`);
        }
        if (isGroup(categories[0])) {
            return 1 + checkGroups(categories);
        }
        for (const category of categories as readonly unknown[]) {
            if (isGroup(category)) {
                throw new Error(`Category group "${name}" holds categories and groups. A group holds one or the other`);
            }
            if (category instanceof Date) {
                throw new Error(
                    `Invalid category ${String(category)} in group "${name}". Categories in groups are text or numbers, not dates`,
                );
            }
            if (typeof category !== "string" && !Number.isFinite(category)) {
                throw new Error(`Invalid category ${quoted(category)} in group "${name}". Expected text or a finite number`);
            }
        }
        return 1;
    });
    if (new Set(depths).size > 1) {
        throw new Error(
            "Invalid category groups. Every group at the same depth holds groups as deep, so every category has as many groups",
        );
    }
    return depths[0];
};

type CategoryRules = {
    /** Whether the categories can be dates: on a category axis */
    readonly dates: boolean;
    /** Whether the categories can be in groups: on a category axis that isn't a stock chart's */
    readonly groups: boolean;
    /** The chart's type, for messages */
    readonly type: string;
};

/**
 * Checks the categories: text or finite numbers, or on a chart with a category axis, all dates, or all groups.
 */
const checkCategories = (categories: ChartCategories, { dates, groups, type }: CategoryRules): void => {
    if (!Array.isArray(categories)) {
        throw new Error(`Invalid categories ${quoted(categories)}. Expected a list of them`);
    }
    if (categories.length === 0) {
        throw new Error("A chart needs at least one category");
    }
    if (isCategoryGroups(categories)) {
        if (!groups) {
            throw new Error(`Invalid categories. A ${type} chart's categories can't be in groups`);
        }
        checkGroups(categories);
        return;
    }
    const plain: readonly (string | number | Date)[] = categories;
    if (plain.some(isGroup)) {
        throw new Error("Invalid categories. Expected all of them to be groups, or none");
    }
    const dated = plain.filter((category): category is Date => category instanceof Date);
    if (dates && dated.length > 0) {
        if (dated.length < plain.length) {
            throw new Error("Invalid categories. Expected all of them to be dates, or none");
        }
        dated.forEach(checkDate);
        return;
    }
    for (const category of plain) {
        if (typeof category !== "string" && !Number.isFinite(category)) {
            throw new Error(`Invalid category ${String(category)}. Expected text or a finite number`);
        }
    }
};

const checkSeries = (series: readonly unknown[]): void => {
    if (!Array.isArray(series) || series.length === 0) {
        throw new Error("A chart needs at least one series");
    }
};

const checkCategorySeries = ({ name, values, dataLabels }: ChartSeries | PieChartSeries | RadarChartSeries, categories: number): void => {
    if (values.length > categories) {
        throw new Error(`Series "${name}" has ${values.length} values, but there are ${categories} categories`);
    }
    for (const value of values) {
        checkValue(value, name);
    }
    checkDataLabels(dataLabels);
};

const checkColors = ({ name, colors }: ChartSeries | PieChartSeries, categories: number): void => {
    if (colors && colors.length > categories) {
        throw new Error(`Series "${name}" has ${colors.length} colors, but there are ${categories} categories`);
    }
};

/**
 * Checks how far a pie's slices are pulled out: one amount for all, or one for each slice.
 */
const checkExplosion = ({ name, explosion }: PieChartSeries, categories: number): void => {
    if (explosion === undefined || typeof explosion === "number") {
        checkRange(explosion, `explosion of series "${name}"`, 0, 400);
        return;
    }
    if (!Array.isArray(explosion)) {
        throw new Error(`Invalid explosion ${quoted(explosion)} of series "${name}". Expected a percentage, or one for each slice`);
    }
    if (explosion.length > categories) {
        throw new Error(`Series "${name}" has ${explosion.length} explosions, but there are ${categories} categories`);
    }
    for (const amount of explosion as readonly unknown[]) {
        if (amount !== undefined && typeof amount !== "number") {
            throw new Error(`Invalid explosion ${quoted(amount)} of series "${name}". Expected a percentage or undefined for each slice`);
        }
        checkRange(amount, `explosion of series "${name}"`, 0, 400);
    }
};

const checkPieSeries = (series: PieChartSeries, categories: number, type: string): void => {
    checkCategorySeries(series, categories);
    // Word draws a negative value's slice at its absolute value, which is rarely what was meant
    const negative = series.values.find((value) => value !== null && value < 0);
    if (negative !== undefined) {
        throw new Error(`Invalid value ${negative} in series "${series.name}". A ${type} chart's values can't be negative`);
    }
    checkColors(series, categories);
    checkPointLabels(series, categories, "categories");
    checkExplosion(series, categories);
};

/**
 * Throws for an option a series has that it can't have, such as markers on a series drawn as columns.
 */
const checkOptionsFor = (series: object & { readonly name: string }, options: readonly string[], reason: string): void => {
    const given = options.find((option) => (series as Record<string, unknown>)[option] !== undefined);
    if (given !== undefined) {
        throw new Error(`Invalid option ${given} for series "${series.name}". ${reason}`);
    }
};

/**
 * Throws for an option a chart has that its type can't have, such as a data table on a pie chart.
 */
const checkChartOptionsFor = (options: object, names: readonly string[], reason: string): void => {
    const given = names.find((option) => (options as Record<string, unknown>)[option] !== undefined);
    if (given !== undefined) {
        throw new Error(`Invalid option ${given}. ${reason}`);
    }
};

const TRENDLINE_TYPES: readonly ChartTrendlineType[] = ["linear", "exponential", "logarithmic", "polynomial", "power", "movingAverage"];

/**
 * The values a trendline is fitted to: each point's x and y. A chart with categories numbers them from 1.
 */
type TrendlineData = readonly { readonly x: number; readonly y: number }[];

/**
 * Checks a series' trendlines: their type, the options it has, and that the series' values are ones it can be fitted to.
 */
const checkTrendlines = (series: string, trendlines: readonly ChartTrendline[] | undefined, data: TrendlineData): void => {
    if (trendlines === undefined) {
        return;
    }
    if (!Array.isArray(trendlines)) {
        throw new Error(`Invalid trendlines ${quoted(trendlines)} for series "${series}". Expected a list of them`);
    }
    for (const trendline of trendlines) {
        const { type } = (trendline ?? {}) as Partial<ChartTrendline>;
        if (type === undefined || !TRENDLINE_TYPES.includes(type)) {
            throw new Error(
                `Invalid trendline type ${quoted(type)} for series "${series}". Expected one of ${TRENDLINE_TYPES.map((one) => `"${one}"`).join(", ")}`,
            );
        }
        const name = `the ${type} trendline of series "${series}"`;
        const invalid = (option: string, reason: string): Error => new Error(`Invalid option ${option} for ${name}. ${reason}`);
        if (type !== "polynomial" && trendline.order !== undefined) {
            throw invalid("order", "Only a polynomial trendline has an order");
        }
        if (type !== "movingAverage" && trendline.period !== undefined) {
            throw invalid("period", "Only a moving average has a period");
        }
        checkWholeNumber(trendline.order, `order of ${name}`, 2, 6);
        if (type === "movingAverage") {
            for (const option of ["forecastForward", "forecastBackward", "intercept", "equation", "rSquared", "label"] as const) {
                if (trendline[option] !== undefined) {
                    throw invalid(option, "A moving average has no equation, so it has none");
                }
            }
            const { period = 2 } = trendline;
            if (!(Number.isInteger(period) && period >= 2 && period < data.length)) {
                throw new Error(
                    `Invalid period ${quoted(period)} of ${name}. Expected a whole number from 2 to one fewer than the series' ${data.length} values`,
                );
            }
        }
        for (const option of ["forecastForward", "forecastBackward"] as const) {
            const value = trendline[option];
            if (value !== undefined && !(typeof value === "number" && value >= 0 && Number.isFinite(value))) {
                throw new Error(`Invalid ${option} ${quoted(value)} of ${name}. Expected a finite number of 0 or more`);
            }
        }
        if (trendline.intercept !== undefined) {
            if (!["linear", "exponential", "polynomial"].includes(type)) {
                throw invalid("intercept", "Only linear, exponential and polynomial trendlines have one");
            }
            if (!Number.isFinite(trendline.intercept) || (type === "exponential" && !(trendline.intercept > 0))) {
                throw new Error(
                    `Invalid intercept ${quoted(trendline.intercept)} of ${name}. Expected a finite number${type === "exponential" ? " above 0" : ""}`,
                );
            }
        }
        if (trendline.label !== undefined && !trendline.equation && !trendline.rSquared) {
            throw invalid("label", "It shows neither its equation nor its R² value");
        }
        checkFont(trendline.label?.font);
        checkLine(trendline.line);
        if (trendline.name !== undefined && typeof trendline.name !== "string") {
            throw new Error(`Invalid name ${quoted(trendline.name)} of ${name}. Expected text`);
        }
        // Office can't fit these to values of 0 or less, and draws nothing
        const nonPositive = (axis: "x" | "y"): number | undefined => data.find((point) => !(point[axis] > 0))?.[axis];
        const needsPositive: readonly ("x" | "y")[] =
            type === "exponential" ? ["y"] : type === "power" ? ["x", "y"] : type === "logarithmic" ? ["x"] : [];
        for (const axis of needsPositive) {
            const value = nonPositive(axis);
            if (value !== undefined) {
                throw new Error(
                    `Can't fit ${name} to the ${axis === "y" ? "value" : "x value"} ${value}. A ${type} trendline needs ${axis === "y" ? "values" : "x values"} above 0`,
                );
            }
        }
    }
};

const ERROR_BAR_TYPES: readonly ChartErrorBars["type"][] = ["fixed", "percentage", "standardDeviation", "standardError", "custom"];

/**
 * Checks a series' error bars: their type and amounts, and for custom ones, no more amounts than there are points.
 *
 * @param which - Which error bars they are, for messages, such as "error bars" or "x error bars"
 */
const checkErrorBars = (series: string, errorBars: ChartErrorBars | undefined, count: number, which: string): void => {
    if (errorBars === undefined) {
        return;
    }
    const { type } = (typeof errorBars === "object" && errorBars !== null ? errorBars : {}) as Partial<ChartErrorBars>;
    if (type === undefined || !ERROR_BAR_TYPES.includes(type)) {
        throw new Error(
            `Invalid ${which} type ${quoted(type)} for series "${series}". Expected one of ${ERROR_BAR_TYPES.map((one) => `"${one}"`).join(", ")}`,
        );
    }
    const name = `the ${which} of series "${series}"`;
    checkLine(errorBars.line);
    if (errorBars.type === "custom") {
        if ("direction" in errorBars && errorBars.direction !== undefined) {
            throw new Error(`Invalid option direction for ${name}. Custom error bars go the ways their plus and minus amounts are given`);
        }
        if (errorBars.plus === undefined && errorBars.minus === undefined) {
            throw new Error(`Custom ${name} need plus or minus amounts, or both`);
        }
        for (const side of ["plus", "minus"] as const) {
            const amounts = errorBars[side];
            if (amounts === undefined) {
                continue;
            }
            if (!Array.isArray(amounts)) {
                throw new Error(`Invalid ${side} amounts ${quoted(amounts)} of ${name}. Expected one for each point`);
            }
            if (amounts.length > count) {
                throw new Error(`The ${which} of series "${series}" have ${amounts.length} ${side} amounts, but there are ${count} points`);
            }
            const wrong = amounts.findIndex(
                (amount: unknown) => amount !== null && !(typeof amount === "number" && amount >= 0 && Number.isFinite(amount)),
            );
            if (wrong !== -1) {
                throw new Error(
                    `Invalid ${side} amount ${quoted(amounts[wrong])} of ${name}. Expected a finite number of 0 or more, or null`,
                );
            }
        }
        return;
    }
    if (errorBars.direction !== undefined && !["both", "plus", "minus"].includes(errorBars.direction)) {
        throw new Error(`Invalid direction ${quoted(errorBars.direction)} of ${name}. Expected "both", "plus" or "minus"`);
    }
    const { value } = errorBars as { readonly value?: unknown };
    if (errorBars.type === "standardError") {
        if (value !== undefined) {
            throw new Error(`Invalid option value for ${name}. The standard error has no amount`);
        }
        return;
    }
    if (value === undefined && errorBars.type !== "standardDeviation") {
        throw new Error(`The ${errorBars.type} ${name} need a value`);
    }
    if (value !== undefined && !(typeof value === "number" && value >= 0 && Number.isFinite(value))) {
        throw new Error(`Invalid value ${quoted(value)} of ${name}. Expected a finite number of 0 or more`);
    }
};

// How each type draws a series, for the messages
const DRAWN_AS: Readonly<Record<string, string>> = { column: "columns", bar: "bars", line: "a line", area: "an area" };

/**
 * The points of a series with a value for each category, numbered from 1 as a trendline numbers them. Gaps are left out.
 */
const numbered = (values: readonly (number | null)[]): TrendlineData =>
    values.flatMap((value, index) => (value === null ? [] : [{ x: index + 1, y: value }]));

/**
 * Checks a series of a column, bar, line or area chart: how it's drawn, its axis, and that its options are ones the way
 * it's drawn has.
 *
 * @param stacked - Whether the series is stacked: drawn as the chart's type, which is stacked
 */
const checkComboSeries = (series: ChartSeries, type: "column" | "bar" | "line" | "area", categories: number, stacked: boolean): void => {
    checkCategorySeries(series, categories);
    if (series.type !== undefined) {
        if (type === "bar") {
            throw new Error(`Invalid option type for series "${series.name}". A bar chart's series are all bars`);
        }
        if (!["column", "line", "area"].includes(series.type)) {
            throw new Error(`Invalid type "${series.type}" for series "${series.name}". Expected "column", "line" or "area"`);
        }
    }
    if (series.axis !== undefined && series.axis !== "primary" && series.axis !== "secondary") {
        throw new Error(`Invalid axis "${series.axis}" for series "${series.name}". Expected "primary" or "secondary"`);
    }
    const drawnAs = series.type ?? type;
    if (drawnAs !== "line") {
        checkOptionsFor(series, ["markers", "smooth", "line"], `It is drawn as ${DRAWN_AS[drawnAs]}, and only a line has it`);
    }
    if (drawnAs !== "column" && drawnAs !== "bar") {
        checkOptionsFor(series, ["colors"], `It is drawn as ${DRAWN_AS[drawnAs]}, and only bars have it`);
    }
    if (stacked && drawnAs === type) {
        checkOptionsFor(series, ["trendlines"], "It is stacked, and a stacked series has no trendline");
    }
    checkColors(series, categories);
    checkMarkers(series.markers);
    checkLine(series.line);
    checkPointLabels(series, categories, "categories");
    checkTrendlines(series.name, series.trendlines, numbered(series.values));
    checkErrorBars(series.name, series.errorBars, categories, "error bars");
};

const checkPoint = ({ x, y }: ChartPoint, series: string): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`Invalid point (${x}, ${y}) in series "${series}". Expected a finite x and y`);
    }
};

const checkPoints = (series: ScatterChartSeries | BubbleChartSeries): void => {
    const { name, points, dataLabels } = series;
    if (points.length === 0) {
        throw new Error(`Series "${name}" has no points`);
    }
    for (const point of points) {
        checkPoint(point, name);
    }
    checkDataLabels(dataLabels);
    checkPointLabels(series, points.length, "points");
    checkTrendlines(name, series.trendlines, points);
    checkErrorBars(name, series.xErrorBars, points.length, "x error bars");
    checkErrorBars(name, series.yErrorBars, points.length, "y error bars");
};

const checkBubbleSeries = (series: BubbleChartSeries): void => {
    checkPoints(series);
    for (const { x, y, size } of series.points) {
        if (!(size >= 0 && Number.isFinite(size))) {
            throw new Error(
                `Invalid size ${size} of the bubble at (${x}, ${y}) in series "${series.name}". Expected a finite number of 0 or more`,
            );
        }
    }
};

const EMPTY_VALUES: readonly ChartEmptyValues[] = ["gap", "zero", "connect"];

/**
 * Each type's name in messages, such as "pie of pie".
 */
export const TYPE_NAMES: Readonly<Record<ChartRunOptions["type"], string>> = {
    column: "column",
    bar: "bar",
    line: "line",
    area: "area",
    pie: "pie",
    doughnut: "doughnut",
    pieOfPie: "pie of pie",
    barOfPie: "bar of pie",
    radar: "radar",
    scatter: "scatter",
    bubble: "bubble",
    stock: "stock",
};

/**
 * Checks what every chart can have: its size, text, areas and legend.
 */
const checkChartBase = (options: ChartRunOptions): void => {
    if (options.transformation) {
        checkSize(options.transformation);
    }
    checkTitle(options.title);
    // The chart's font has no size, but a size given from JavaScript would be written
    checkFont(options.font);
    checkFont(options.legend ? options.legend.font : undefined);
    checkArea(options.chartArea);
    checkArea(options.plotArea);
    const { emptyValues, dataTable } = options as {
        readonly emptyValues?: ChartEmptyValues;
        readonly dataTable?: boolean | ChartDataTable;
    };
    if (emptyValues !== undefined && !EMPTY_VALUES.includes(emptyValues)) {
        throw new Error(`Invalid option emptyValues ${quoted(emptyValues)}. Expected "gap", "zero" or "connect"`);
    }
    checkFont(typeof dataTable === "object" ? dataTable.font : undefined);
};

/**
 * Checks the entries the legend hides: each is the text of an entry.
 */
const checkHiddenEntries = (options: ChartRunOptions): void => {
    const hidden = options.legend ? options.legend.hiddenEntries : undefined;
    if (hidden === undefined) {
        return;
    }
    if (!Array.isArray(hidden)) {
        throw new Error(`Invalid hidden legend entries ${quoted(hidden)}. Expected a list of the entries' text`);
    }
    const entries = legendEntriesOf(options).map(({ text }) => text);
    for (const entry of hidden) {
        if (!entries.includes(String(entry))) {
            const all = entries.map((one) => `"${one}"`);
            throw new Error(
                `Invalid hidden legend entry ${quoted(entry)}. The legend's entries are ${all.length > 1 ? `${all.slice(0, -1).join(", ")} and ` : ""}${all[all.length - 1]}`,
            );
        }
    }
};

/**
 * Checks a pie of pie or bar of pie chart's split: the categories, value or percentage it splits the pie by.
 */
const checkSplit = (split: PieChartSplit | undefined, categories: readonly (string | number)[]): void => {
    if (split === undefined) {
        return;
    }
    const { by } = (typeof split === "object" && split !== null ? split : {}) as Partial<PieChartSplit>;
    switch (by) {
        case "position":
            checkWholeNumber((split as { readonly count: number }).count, "split count", 1, categories.length);
            if ((split as { readonly count?: number }).count === undefined) {
                throw new Error("Invalid split. Splitting by position needs the count of the last categories that go to the second plot");
            }
            return;
        case "value":
        case "percentage": {
            const { lessThan } = split as { readonly lessThan?: unknown };
            if (!(typeof lessThan === "number" && Number.isFinite(lessThan))) {
                throw new Error(`Invalid split ${by === "value" ? "value" : "percentage"} ${quoted(lessThan)}. Expected a finite number`);
            }
            if (by === "percentage") {
                checkRange(lessThan, "split percentage", 0, 100);
            }
            return;
        }
        case "categories": {
            const chosen = (split as { readonly categories?: unknown }).categories;
            if (!Array.isArray(chosen) || chosen.length === 0) {
                throw new Error("Invalid split. Splitting by categories needs at least one category for the second plot");
            }
            const missing = chosen.find((category: unknown) => !categories.some((one) => String(one) === String(category)));
            if (missing !== undefined) {
                throw new Error(`Invalid split category ${quoted(missing)}. It isn't one of the chart's categories`);
            }
            return;
        }
        default:
            throw new Error(`Invalid split ${quoted(by)}. Expected { by: "position", "value", "percentage" or "categories", ... }`);
    }
};

const checkSplitPie = (options: SplitPieChartBaseOptions & { readonly type: "pieOfPie" | "barOfPie" }): void => {
    checkChartOptionsFor(options, ["firstSliceAngle"], "A pie of pie or bar of pie chart's first slice always starts at 12 o'clock");
    checkSplit(options.split, options.categories);
    checkRange(options.secondPlotSize, "second plot size", 5, 200);
    checkRange(options.gapWidth, "gap width", 0, 500);
    checkLine(options.seriesLines);
};

/**
 * Checks a stock chart: its prices and volumes, each a value for each category, with each high at least its low, and
 * each open and close between them, and options that need opening prices or volumes only with them.
 */
const checkStock = (options: StockChartOptions): void => {
    checkChartOptionsFor(options, ["series"], "A stock chart's data is its high, low and close, and its open and volume if given");
    checkCategories(options.categories, { dates: true, groups: false, type: "stock" });
    const count = options.categories.length;
    for (const role of ["high", "low", "close"] as const) {
        if (options[role] === undefined) {
            throw new Error(`A stock chart needs its ${role} prices`);
        }
    }
    const series = stockSeriesOf(options);
    for (const { role, name, values } of series) {
        if (!Array.isArray(values)) {
            throw new Error(`Invalid ${role} ${quoted(values)}. Expected a value for each category`);
        }
        if (typeof name !== "string") {
            throw new Error(`Invalid name ${quoted(name)} of the ${role} series. Expected text`);
        }
        checkCategorySeries({ name, values }, count);
        if (role === "volume") {
            const negative = values.find((value) => value !== null && value < 0);
            if (negative !== undefined) {
                throw new Error(`Invalid volume ${negative}. Volumes can't be negative`);
            }
        }
    }
    const { open = [], high, low, close } = options;
    const categories = options.categories.map((category) => (category instanceof Date ? category.toISOString().slice(0, 10) : category));
    for (let index = 0; index < count; index++) {
        const [top, bottom] = [high[index] ?? null, low[index] ?? null];
        if (top === null || bottom === null) {
            continue;
        }
        if (top < bottom) {
            throw new Error(`The high ${top} of ${quoted(categories[index])} is below its low ${bottom}`);
        }
        for (const [role, value] of [
            ["open", open[index] ?? null],
            ["close", close[index] ?? null],
        ] as const) {
            if (value !== null && (value > top || value < bottom)) {
                throw new Error(`The ${role} ${value} of ${quoted(categories[index])} isn't between its low ${bottom} and its high ${top}`);
            }
        }
    }
    if (options.open === undefined) {
        checkChartOptionsFor(options, ["upBars", "downBars"], "The chart has no opening prices, so no bars from the open to the close");
    }
    if (options.volume === undefined) {
        checkChartOptionsFor(options, ["volumeAxis"], "The chart has no volumes");
    }
    // Its dates are spaced evenly, so a value axis crosses them at a category's number
    checkAxis(options.categoryAxis, "category axis");
    checkValueAxis(options.valueAxis, "value axis");
    checkValueAxis(options.volumeAxis, "volume axis");
    checkLine(options.highLowLines);
    checkArea(options.upBars);
    checkArea(options.downBars);
};

/**
 * Checks a chart's options, so mistakes show up where the chart is made.
 *
 * @throws If there are no series or categories, a value isn't a finite number or null, a series has more values than
 * there are categories or an option its type doesn't have, a pie chart has more than one series or a pie or doughnut
 * chart a negative value, a scatter or bubble point isn't finite numbers, a trendline can't be fitted to its series, a
 * stock chart's high is below its low, or an option is out of its range
 */
export const checkChartOptions = (options: ChartRunOptions): void => {
    checkChartBase(options);

    if (options.type === "stock") {
        checkStock(options);
        checkHiddenEntries(options);
        return;
    }

    checkSeries(options.series);
    checkDataLabels(options.dataLabels);
    const withoutDataTable = `A ${TYPE_NAMES[options.type]} chart has no data table. Column, bar, line, area and stock charts have one`;
    if (options.type === "scatter" || options.type === "bubble") {
        checkChartOptionsFor(options, ["emptyValues"], `A ${options.type} chart's points have no empty values`);
    }

    switch (options.type) {
        case "scatter": {
            checkChartOptionsFor(options, ["dataTable"], withoutDataTable);
            const { lines = "none" } = options;
            for (const series of options.series) {
                checkPoints(series);
                checkMarkers(series.markers);
                checkLine(series.line);
                if (lines === "none") {
                    checkOptionsFor(series, ["line"], `The chart's lines are "none"`);
                }
            }
            checkMarkers(options.markers);
            checkValueAxis(options.xAxis, "x axis");
            checkValueAxis(options.yAxis, "y axis");
            break;
        }
        case "bubble":
            checkChartOptionsFor(options, ["dataTable"], withoutDataTable);
            options.series.forEach(checkBubbleSeries);
            checkRange(options.bubbleScale, "bubble scale", 0, 300);
            checkValueAxis(options.xAxis, "x axis");
            checkValueAxis(options.yAxis, "y axis");
            break;
        case "pie":
        case "doughnut":
        case "pieOfPie":
        case "barOfPie": {
            const type = TYPE_NAMES[options.type];
            checkChartOptionsFor(options, ["dataTable"], withoutDataTable);
            checkChartOptionsFor(options, ["emptyValues"], `A ${type} chart leaves out the slice of an empty value`);
            checkCategories(options.categories, { dates: false, groups: false, type });
            if (options.type !== "doughnut" && options.series.length > 1) {
                throw new Error(`A ${type} chart has one series, but ${options.series.length} were given. A doughnut chart can have more`);
            }
            for (const series of options.series) {
                checkPieSeries(series, options.categories.length, type);
                checkOptionsFor(series, ["trendlines", "errorBars"], `A ${type} chart's series have neither`);
            }
            if (options.type === "pieOfPie" || options.type === "barOfPie") {
                checkSplitPie(options);
            } else {
                checkRange(options.firstSliceAngle, "first slice angle", 0, 360);
                checkRange(options.type === "doughnut" ? options.holeSize : undefined, "hole size", 10, 90);
            }
            break;
        }
        case "radar":
            checkChartOptionsFor(options, ["dataTable"], withoutDataTable);
            checkCategories(options.categories, { dates: false, groups: false, type: "radar" });
            for (const series of options.series) {
                checkCategorySeries(series, options.categories.length);
                checkMarkers(series.markers);
                checkLine(series.line);
                checkPointLabels(series, options.categories.length, "categories");
                checkOptionsFor(series, ["trendlines", "errorBars"], "A radar chart's series have neither");
                if (options.filled) {
                    checkOptionsFor(series, ["markers", "line"], "A filled radar chart's series have neither");
                }
            }
            checkMarkers(options.markers);
            if (options.filled && options.markers !== undefined) {
                throw new Error("Invalid option markers. A filled radar chart's series have no markers");
            }
            checkAxis(options.categoryAxis, "category axis");
            checkValueAxis(options.valueAxis, "value axis");
            break;
        default: {
            checkCategories(options.categories, { dates: true, groups: true, type: options.type });
            const leaves = leafCategoriesOf(options.categories);
            const dates = leaves.some((category) => category instanceof Date);
            const stacked = (options.stacking ?? "none") !== "none";
            options.series.forEach((series) => checkComboSeries(series, options.type, leaves.length, stacked));
            if (options.series.every(({ axis }) => axis === "secondary")) {
                throw new Error("A chart needs at least one series on the primary axis");
            }
            checkAxis(options.categoryAxis, "category axis");
            checkValueAxis(options.valueAxis, "value axis", dates);
            checkValueAxis(options.secondaryValueAxis, "secondary value axis", dates);
            if (options.type === "line") {
                checkMarkers(options.markers);
            }
            if (options.type === "column" || options.type === "bar") {
                checkRange(options.gapWidth, "gap width", 0, 500);
                checkRange(options.overlap, "overlap", -100, 100);
            }
        }
    }
    checkHiddenEntries(options);
};
