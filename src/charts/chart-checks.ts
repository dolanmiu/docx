/**
 * Checks a chart's options, so mistakes show up where the chart is made rather than when the document is opened.
 *
 * @module
 */
import { checkDate } from "./chart-dates";
import type {
    BubbleChartSeries,
    ChartAreaStyle,
    ChartAxis,
    ChartAxisCrossing,
    ChartDataLabels,
    ChartDisplayUnits,
    ChartFont,
    ChartLine,
    ChartMarker,
    ChartPoint,
    ChartRunOptions,
    ChartSeries,
    ChartSize,
    ChartTitle,
    ChartValueAxis,
    PieChartSeries,
    RadarChartSeries,
    ScatterChartSeries,
} from "./chart-options";

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

const checkFont = (font: ChartFont | undefined): void => checkRange(font?.size, "font size", 1, 4000);

const checkTitle = (title: string | ChartTitle | undefined): void => checkFont(typeof title === "object" ? title.font : undefined);

const checkLine = (line: ChartLine | undefined): void => checkRange(line?.width, "line width", 0, 1584);

const checkArea = (area: ChartAreaStyle | undefined): void => checkLine(area?.border === "none" ? undefined : area?.border);

const checkMarkers = (markers: boolean | ChartMarker | undefined): void =>
    checkRange(typeof markers === "object" ? markers.size : undefined, "marker size", 2, 72);

const checkDataLabels = (labels: false | ChartDataLabels | undefined): void => checkFont(labels ? labels.font : undefined);

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
        throw new Error(`Invalid value ${value} in series "${series}". Expected a finite number or null`);
    }
};

/**
 * Checks the categories: text or finite numbers, or on a chart with a category axis, all dates.
 */
const checkCategories = (categories: readonly (string | number | Date)[], dates: boolean): void => {
    if (categories.length === 0) {
        throw new Error("A chart needs at least one category");
    }
    const dated = categories.filter((category): category is Date => category instanceof Date);
    if (dates && dated.length > 0) {
        if (dated.length < categories.length) {
            throw new Error("Invalid categories. Expected all of them to be dates, or none");
        }
        dated.forEach(checkDate);
        return;
    }
    for (const category of categories) {
        if (typeof category !== "string" && !Number.isFinite(category)) {
            throw new Error(`Invalid category ${String(category)}. Expected text or a finite number`);
        }
    }
};

const checkSeries = (series: readonly unknown[]): void => {
    if (series.length === 0) {
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

const checkPieSeries = (series: PieChartSeries, categories: number, type: string): void => {
    checkCategorySeries(series, categories);
    // Word draws a negative value's slice at its absolute value, which is rarely what was meant
    const negative = series.values.find((value) => value !== null && value < 0);
    if (negative !== undefined) {
        throw new Error(`Invalid value ${negative} in series "${series.name}". A ${type} chart's values can't be negative`);
    }
    checkColors(series, categories);
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

// How each type draws a series, for the messages
const DRAWN_AS: Readonly<Record<string, string>> = { column: "columns", bar: "bars", line: "a line", area: "an area" };

/**
 * Checks a series of a column, bar, line or area chart: how it's drawn, its axis, and that its options are ones the way
 * it's drawn has.
 */
const checkComboSeries = (series: ChartSeries, type: "column" | "bar" | "line" | "area", categories: number): void => {
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
    checkColors(series, categories);
    checkMarkers(series.markers);
    checkLine(series.line);
};

const checkPoint = ({ x, y }: ChartPoint, series: string): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`Invalid point (${x}, ${y}) in series "${series}". Expected a finite x and y`);
    }
};

const checkPoints = ({ name, points, dataLabels }: ScatterChartSeries | BubbleChartSeries): void => {
    if (points.length === 0) {
        throw new Error(`Series "${name}" has no points`);
    }
    for (const point of points) {
        checkPoint(point, name);
    }
    checkDataLabels(dataLabels);
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

/**
 * Checks what every chart has: its series, size, text and areas.
 */
const checkChartBase = (options: ChartRunOptions): void => {
    checkSeries(options.series);
    if (options.transformation) {
        checkSize(options.transformation);
    }
    checkTitle(options.title);
    // The chart's font has no size, but a size given from JavaScript would be written
    checkFont(options.font);
    checkFont(options.legend ? options.legend.font : undefined);
    checkArea(options.chartArea);
    checkArea(options.plotArea);
    checkDataLabels(options.dataLabels);
};

/**
 * Checks a chart's options, so mistakes show up where the chart is made.
 *
 * @throws If there are no series or categories, a value isn't a finite number or null, a series has more values than
 * there are categories or an option its type doesn't have, a pie chart has more than one series or a pie or doughnut
 * chart a negative value, a scatter or bubble point isn't finite numbers, or an option is out of its range
 */
export const checkChartOptions = (options: ChartRunOptions): void => {
    checkChartBase(options);

    switch (options.type) {
        case "scatter": {
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
            return;
        }
        case "bubble":
            options.series.forEach(checkBubbleSeries);
            checkRange(options.bubbleScale, "bubble scale", 0, 300);
            checkValueAxis(options.xAxis, "x axis");
            checkValueAxis(options.yAxis, "y axis");
            return;
        case "pie":
        case "doughnut":
            checkCategories(options.categories, false);
            if (options.type === "pie" && options.series.length > 1) {
                throw new Error(`A pie chart has one series, but ${options.series.length} were given. A doughnut chart can have more`);
            }
            options.series.forEach((series) => checkPieSeries(series, options.categories.length, options.type));
            checkRange(options.firstSliceAngle, "first slice angle", 0, 360);
            checkRange(options.type === "doughnut" ? options.holeSize : undefined, "hole size", 10, 90);
            return;
        case "radar":
            checkCategories(options.categories, false);
            for (const series of options.series) {
                checkCategorySeries(series, options.categories.length);
                checkMarkers(series.markers);
                checkLine(series.line);
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
            return;
        default: {
            checkCategories(options.categories, true);
            const dates = options.categories.some((category) => category instanceof Date);
            options.series.forEach((series) => checkComboSeries(series, options.type, options.categories.length));
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
};
