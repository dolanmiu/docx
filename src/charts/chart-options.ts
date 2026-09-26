/**
 * The options of a chart: its type, data, axes, legend and labels.
 *
 * @module
 */
import type { DocPropertiesOptions, IFloating, ThemeColor } from "docx";

/**
 * A series of a column, bar, line or area chart: one value for each category.
 *
 * @publicApi
 */
export type ChartSeries = {
    /** The series' name, shown in the legend */
    readonly name: string;
    /** One value for each category, in order. `null` leaves a gap. A series can have fewer values than there are categories */
    readonly values: readonly (number | null)[];
    /**
     * The colour of the series' bars, line or area: a 6-digit hex colour such as `"4472C4"`, or a colour of the
     * document's theme such as `{ theme: "accent2" }`. Default is the next of the theme's accent colours
     */
    readonly color?: string | ThemeColor;
};

/**
 * The series of a pie chart, or a ring of a doughnut chart: one value, a slice, for each category.
 *
 * @publicApi
 */
export type PieChartSeries = {
    /** The series' name */
    readonly name: string;
    /** One value for each category, in order. `null` leaves the slice out. Values can't be negative */
    readonly values: readonly (number | null)[];
    /**
     * One colour for each slice, as a 6-digit hex colour or a colour of the document's theme. A slice without one, or
     * with `undefined`, takes the next of the theme's accent colours
     */
    readonly colors?: readonly (string | ThemeColor | undefined)[];
};

/**
 * A point of a scatter chart.
 *
 * @publicApi
 */
export type ChartPoint = {
    /** Its position along the horizontal axis */
    readonly x: number;
    /** Its position along the vertical axis */
    readonly y: number;
};

/**
 * A series of a scatter chart: points, each with its own x and y.
 *
 * @publicApi
 */
export type ScatterChartSeries = {
    /** The series' name, shown in the legend */
    readonly name: string;
    /** The series' points, in order */
    readonly points: readonly ChartPoint[];
    /** The colour of the series' markers and line. Default is the next of the theme's accent colours */
    readonly color?: string | ThemeColor;
};

/**
 * Whether the series of a column, bar, line or area chart are stacked: `"none"` draws them side by side, `"stacked"` on
 * top of each other, and `"percent"` on top of each other as a percentage of the category's total, as Word's "Stacked"
 * and "100% Stacked" charts do.
 *
 * @publicApi
 */
export type ChartStacking = "none" | "stacked" | "percent";

/**
 * Where the legend is, around the plot: `"topRight"` is in the top right corner.
 *
 * @publicApi
 */
export type ChartLegendPosition = "top" | "bottom" | "left" | "right" | "topRight";

/**
 * The legend: a key to the series, or to the slices of a pie or doughnut chart.
 *
 * @publicApi
 */
export type ChartLegend = {
    /** Where the legend is. Default is `"bottom"`, as in Word 2013 and later */
    readonly position?: ChartLegendPosition;
};

/**
 * An axis: its title, whether it is shown, and its gridlines.
 *
 * @publicApi
 */
export type ChartAxis = {
    /** The axis' title */
    readonly title?: string;
    /** Whether the axis and its labels are shown. Default is `true` */
    readonly visible?: boolean;
    /** Whether lines are drawn across the plot at each label. Default is `true` for value axes and `false` for category axes */
    readonly gridlines?: boolean;
};

/**
 * An axis of values: as {@link ChartAxis}, with its range, the interval between its labels, and their number format.
 * On a 100% stacked chart, the range and interval are percentages.
 *
 * @publicApi
 */
export type ChartValueAxis = ChartAxis & {
    /** The lowest value on the axis. Default is chosen from the values */
    readonly minimum?: number;
    /** The highest value on the axis. Default is chosen from the values */
    readonly maximum?: number;
    /** The interval between the axis' labels and gridlines. Default is chosen from the values */
    readonly interval?: number;
    /** How the axis' labels are written, as an Excel number format such as `"#,##0"`, `"0.0%"` or `"$#,##0"` */
    readonly numberFormat?: string;
};

/**
 * What the labels on each bar, point or slice show. Each is `false` by default, and there are no labels unless one is `true`.
 *
 * @publicApi
 */
export type ChartDataLabels = {
    /** The value */
    readonly value?: boolean;
    /** The category, or on a scatter chart, the x value */
    readonly category?: boolean;
    /** The series' name */
    readonly seriesName?: boolean;
};

/**
 * What the labels on each slice of a pie or doughnut chart show: as {@link ChartDataLabels}, or the slice's percentage
 * of the whole.
 *
 * @publicApi
 */
export type PieChartDataLabels = ChartDataLabels & {
    /** The slice's percentage of the whole */
    readonly percentage?: boolean;
};

/**
 * The size of a chart, in pixels.
 *
 * @publicApi
 */
export type ChartSize = {
    /** Width in pixels */
    readonly width: number;
    /** Height in pixels */
    readonly height: number;
};

/**
 * Options every chart has, whatever its type.
 *
 * @publicApi
 */
export type ChartBaseOptions = {
    /** The chart's title, above the plot. Default is no title. Each line of the text is a line of the title */
    readonly title?: string;
    /** The legend, or `false` for none. Default is a legend below the plot */
    readonly legend?: false | ChartLegend;
    /** The chart's size in pixels. Default is 576 by 336 pixels (6 by 3.5 inches), the size Word inserts a chart at */
    readonly transformation?: ChartSize;
    /** Floats the chart on the page instead of placing it inline with text, as for images */
    readonly floating?: IFloating;
    /** A name, description and title for screen readers */
    readonly altText?: DocPropertiesOptions;
};

/**
 * Options of the charts with categories and values: column, bar, line and area charts.
 *
 * @publicApi
 */
export type CategoryChartOptions = ChartBaseOptions & {
    /** The categories along the chart's category axis, in order. If they are all numbers, they are written as numbers */
    readonly categories: readonly (string | number)[];
    /** The series, one value for each category */
    readonly series: readonly ChartSeries[];
    /** Whether the series are stacked. Default is `"none"` */
    readonly stacking?: ChartStacking;
    /** The axis of categories */
    readonly categoryAxis?: ChartAxis;
    /** The axis of values */
    readonly valueAxis?: ChartValueAxis;
    /** Labels on each bar or point */
    readonly dataLabels?: ChartDataLabels;
};

/**
 * Options of the charts with bars: column (vertical bars) and bar (horizontal bars) charts.
 *
 * @publicApi
 */
export type BarChartBaseOptions = CategoryChartOptions & {
    /**
     * The space between groups of bars, as a percentage of a bar's width, from 0 to 500. Default is Office's: 219 for
     * column charts, 182 for bar charts, and 150 when the series are stacked
     */
    readonly gapWidth?: number;
    /**
     * How much the bars in a group overlap, as a percentage of a bar's width, from -100 (a bar's width apart) to 100.
     * Default is Office's: -27 for column charts and 0 for bar charts. Stacked bars always overlap fully
     */
    readonly overlap?: number;
};

/**
 * A column chart: vertical bars (`c:barChart` with `c:barDir="col"`).
 *
 * @publicApi
 */
export type ColumnChartOptions = BarChartBaseOptions & {
    readonly type: "column";
};

/**
 * A bar chart: horizontal bars (`c:barChart` with `c:barDir="bar"`). The first category is at the bottom, as in Word.
 *
 * @publicApi
 */
export type BarChartOptions = BarChartBaseOptions & {
    readonly type: "bar";
};

/**
 * A line chart (`c:lineChart`).
 *
 * @publicApi
 */
export type LineChartOptions = CategoryChartOptions & {
    readonly type: "line";
    /** Draws a marker at each point, as Word's "Line with Markers" does. Default is `false` */
    readonly markers?: boolean;
    /** Draws the lines as smooth curves. Default is `false` */
    readonly smooth?: boolean;
};

/**
 * An area chart (`c:areaChart`).
 *
 * @publicApi
 */
export type AreaChartOptions = CategoryChartOptions & {
    readonly type: "area";
};

/**
 * Options of pie and doughnut charts.
 *
 * @publicApi
 */
export type PieChartBaseOptions = ChartBaseOptions & {
    /** The categories: one slice of each series for each category */
    readonly categories: readonly (string | number)[];
    /** Labels on each slice */
    readonly dataLabels?: PieChartDataLabels;
    /** Where the first slice starts, in degrees clockwise from 12 o'clock, from 0 to 360. Default is 0 */
    readonly firstSliceAngle?: number;
};

/**
 * A pie chart (`c:pieChart`), with one series.
 *
 * @publicApi
 */
export type PieChartOptions = PieChartBaseOptions & {
    readonly type: "pie";
    /** The series. A pie chart has one */
    readonly series: readonly PieChartSeries[];
};

/**
 * A doughnut chart (`c:doughnutChart`): a ring for each series, the first on the inside.
 *
 * @publicApi
 */
export type DoughnutChartOptions = PieChartBaseOptions & {
    readonly type: "doughnut";
    /** The series, a ring each */
    readonly series: readonly PieChartSeries[];
    /** The size of the hole, as a percentage of the chart's diameter, from 10 to 90. Default is 50 */
    readonly holeSize?: number;
};

/**
 * A scatter chart (`c:scatterChart`): points, each with its own x and y, on two value axes.
 *
 * @publicApi
 */
export type ScatterChartOptions = ChartBaseOptions & {
    readonly type: "scatter";
    /** The series, each with its points */
    readonly series: readonly ScatterChartSeries[];
    /** Draws a marker at each point. Default is `true` */
    readonly markers?: boolean;
    /** Joins the points of each series: `"none"`, `"straight"` or `"smooth"`. Default is `"none"` */
    readonly lines?: "none" | "straight" | "smooth";
    /** The horizontal axis */
    readonly xAxis?: ChartValueAxis;
    /** The vertical axis */
    readonly yAxis?: ChartValueAxis;
    /** Labels on each point */
    readonly dataLabels?: ChartDataLabels;
};

/**
 * Options for creating a chart. `type` decides the other options: each type has its own.
 *
 * @see {@link ChartRun}
 * @publicApi
 */
export type ChartRunOptions =
    | ColumnChartOptions
    | BarChartOptions
    | LineChartOptions
    | AreaChartOptions
    | PieChartOptions
    | DoughnutChartOptions
    | ScatterChartOptions;

/**
 * The type of a chart, by the name Word gives it in Insert Chart.
 *
 * @publicApi
 */
export type ChartType = ChartRunOptions["type"];
