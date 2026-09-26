/**
 * The options of a chart: its type, data, axes, legend, labels and text.
 *
 * @module
 */
import type { DocPropertiesOptions, IFloating, ThemeColor } from "docx";

/**
 * A font for a chart's text. Anything left out is as Word writes a new chart's text: the theme's body font, not bold,
 * in dark grey.
 *
 * @publicApi
 */
export type ChartFont = {
    /** The typeface, such as `"Arial"`. Default is the theme's body font */
    readonly name?: string;
    /** Size in points, from 1 to 4000. Default is 14 for the chart's title, 10 for axis titles, and 9 for the rest */
    readonly size?: number;
    /** Bold text. Default is `false` */
    readonly bold?: boolean;
    /** Italic text. Default is `false` */
    readonly italics?: boolean;
    /** A 6-digit hex colour such as `"1F4E79"`, or a colour of the document's theme such as `{ theme: "accent1" }` */
    readonly color?: string | ThemeColor;
};

/**
 * A title with a font of its own.
 *
 * @publicApi
 */
export type ChartTitle = {
    /** The title. Each line of the text is a line of the title */
    readonly text: string;
    /** The title's font */
    readonly font?: ChartFont;
};

/**
 * A preset dash pattern, as for shapes' lines. The "short" patterns are the ones Word calls "Round Dot", "Square Dot"
 * and so on.
 *
 * @publicApi
 */
export type ChartLineDash =
    | "solid"
    | "dot"
    | "dash"
    | "longDash"
    | "dashDot"
    | "longDashDot"
    | "longDashDotDot"
    | "shortDash"
    | "shortDot"
    | "shortDashDot"
    | "shortDashDotDot";

/**
 * A line: a series' line, or a border.
 *
 * @publicApi
 */
export type ChartLine = {
    /** A 6-digit hex colour, or a colour of the document's theme. Default is the series' colour, or a border's light grey */
    readonly color?: string | ThemeColor;
    /** Width in points, from 0 to 1584. Default is 2.25 for a line or radar series, 1.5 for a scatter series and 0.75 for a border */
    readonly width?: number;
    /** A dash pattern. Default is `"solid"` */
    readonly dash?: ChartLineDash;
};

/**
 * The shape of a marker.
 *
 * @publicApi
 */
export type ChartMarkerShape = "circle" | "square" | "diamond" | "triangle" | "x" | "star" | "plus" | "dash" | "dot";

/**
 * A marker drawn at each point of a line, radar or scatter series, in the series' colour.
 *
 * @publicApi
 */
export type ChartMarker = {
    /** The marker's shape. Default is `"circle"` */
    readonly shape?: ChartMarkerShape;
    /** The marker's size in points, from 2 to 72. Default is 5 */
    readonly size?: number;
};

/**
 * The fill and border of the chart area, or of the plot area.
 *
 * @publicApi
 */
export type ChartAreaStyle = {
    /** A 6-digit hex colour, a colour of the document's theme, or `"none"` */
    readonly fill?: string | ThemeColor;
    /** The border, or `"none"` */
    readonly border?: "none" | ChartLine;
};

/**
 * Which value axis a series is drawn against: the primary one, on the left, or the secondary one, on the right. A bar
 * chart's are along the bottom and the top.
 *
 * @publicApi
 */
export type ChartAxisGroup = "primary" | "secondary";

/**
 * How a series of a column, line or area chart is drawn, when it isn't drawn as the chart's `type`: as columns, a line
 * or an area. A chart with series of more than one type is Word's "Combo" chart.
 *
 * @publicApi
 */
export type ComboChartSeriesType = "column" | "line" | "area";

/**
 * Where the labels on a series' bars, points or slices are. Each type of chart has its own:
 *
 * - bars: `"center"`, `"insideEnd"`, `"insideBase"` and, unless stacked, `"outsideEnd"`;
 * - lines, scatter and bubble charts: `"center"`, `"left"`, `"right"`, `"above"` and `"below"`;
 * - pie charts: `"center"`, `"insideEnd"`, `"outsideEnd"` and `"bestFit"`.
 *
 * The labels of area, doughnut and radar charts have no position.
 *
 * @publicApi
 */
export type ChartDataLabelPosition =
    "center" | "insideEnd" | "insideBase" | "outsideEnd" | "left" | "right" | "above" | "below" | "bestFit";

/**
 * What the labels on each bar, point or slice show, and where they are. There are no labels unless one of `value`,
 * `category` or `seriesName` is `true`.
 *
 * @publicApi
 */
export type ChartDataLabels = {
    /** The value. Default is `false` */
    readonly value?: boolean;
    /** The category, or on a scatter or bubble chart, the x value. Default is `false` */
    readonly category?: boolean;
    /** The series' name. Default is `false` */
    readonly seriesName?: boolean;
    /**
     * Where the labels are. Default is Office's: outside the end of a bar, in the middle of a stacked bar, to the right of
     * a point, and where they fit best on a pie. A chart's position is for the series drawn as its `type`: series drawn
     * another way keep Office's, unless their own labels give one
     */
    readonly position?: ChartDataLabelPosition;
    /** How the values are written, as an Excel number format such as `"#,##0"` or `"0.0%"`. Default is the values' own */
    readonly numberFormat?: string;
    /** The labels' font. Default is 9 points */
    readonly font?: ChartFont;
};

/**
 * What the labels on each slice of a pie or doughnut chart show: as {@link ChartDataLabels}, or the slice's percentage
 * of the whole.
 *
 * @publicApi
 */
export type PieChartDataLabels = ChartDataLabels & {
    /** The slice's percentage of the whole. Default is `false` */
    readonly percentage?: boolean;
};

/**
 * What the labels on each bubble of a bubble chart show: as {@link ChartDataLabels}, or the bubble's size.
 *
 * @publicApi
 */
export type BubbleChartDataLabels = ChartDataLabels & {
    /** The bubble's size. Default is `false` */
    readonly bubbleSize?: boolean;
};

/**
 * A series of a column, bar, line or area chart: one value for each category.
 *
 * `markers`, `smooth` and `line` are for series drawn as lines, and `colors` for series drawn as bars.
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
    /**
     * Draws the series as columns, a line or an area, whatever the chart's `type`, as Word's "Combo" charts do. Default
     * is the chart's `type`. A bar chart's series are all bars
     */
    readonly type?: ComboChartSeriesType;
    /** Draws the series against the secondary value axis, on the right. Default is `"primary"` */
    readonly axis?: ChartAxisGroup;
    /** The series' own labels, instead of the chart's `dataLabels`, or `false` for none */
    readonly dataLabels?: false | ChartDataLabels;
    /**
     * One colour for each bar, in the order of the categories. A bar without one, or with `undefined`, takes the series'
     * colour. Only for series drawn as bars
     */
    readonly colors?: readonly (string | ThemeColor | undefined)[];
    /** Draws a marker at each point, or markers of a shape and size. Default is the chart's `markers`. Only for lines */
    readonly markers?: boolean | ChartMarker;
    /** Draws the line as a smooth curve. Default is the chart's `smooth`. Only for lines */
    readonly smooth?: boolean;
    /** The line's colour, width and dashes. Only for lines */
    readonly line?: ChartLine;
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
    /** The series' own labels, instead of the chart's `dataLabels`, or `false` for none */
    readonly dataLabels?: false | PieChartDataLabels;
};

/**
 * A series of a radar chart: one value for each category, on the category's spoke.
 *
 * @publicApi
 */
export type RadarChartSeries = {
    /** The series' name, shown in the legend */
    readonly name: string;
    /** One value for each category, in order. `null` leaves a gap */
    readonly values: readonly (number | null)[];
    /** The colour of the series' line or area. Default is the next of the theme's accent colours */
    readonly color?: string | ThemeColor;
    /** The series' own labels, instead of the chart's `dataLabels`, or `false` for none */
    readonly dataLabels?: false | ChartDataLabels;
    /** Draws a marker at each point, or markers of a shape and size. Default is the chart's `markers`. Not for filled charts */
    readonly markers?: boolean | ChartMarker;
    /** The line's colour, width and dashes. Not for filled charts */
    readonly line?: ChartLine;
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
    /** The series' own labels, instead of the chart's `dataLabels`, or `false` for none */
    readonly dataLabels?: false | ChartDataLabels;
    /** Draws a marker at each point, or markers of a shape and size. Default is the chart's `markers` */
    readonly markers?: boolean | ChartMarker;
    /** The line's colour, width and dashes. Only when the chart's `lines` join the points */
    readonly line?: ChartLine;
};

/**
 * A bubble of a bubble chart: a point with a size.
 *
 * @publicApi
 */
export type BubbleChartPoint = ChartPoint & {
    /** The bubble's size, compared with the other bubbles'. Can't be negative */
    readonly size: number;
};

/**
 * A series of a bubble chart: bubbles, each with its own x, y and size.
 *
 * @publicApi
 */
export type BubbleChartSeries = {
    /** The series' name, shown in the legend */
    readonly name: string;
    /** The series' bubbles */
    readonly points: readonly BubbleChartPoint[];
    /** The colour of the series' bubbles. Default is the next of the theme's accent colours */
    readonly color?: string | ThemeColor;
    /** The series' own labels, instead of the chart's `dataLabels`, or `false` for none */
    readonly dataLabels?: false | BubbleChartDataLabels;
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
    /** The legend's font. Default is 9 points */
    readonly font?: ChartFont;
};

/**
 * Where an axis crosses the other axis: where Office puts it (`"auto"`, at zero, or at the minimum when zero is out of
 * range), at the other axis' minimum or maximum, or at a value on the other axis. On a value axis crossing categories,
 * the value is the category's number, from 1, or when the categories are dates, a date.
 *
 * @publicApi
 */
export type ChartAxisCrossing = "auto" | "minimum" | "maximum" | number | Date;

/**
 * An axis: its title, its labels, whether it is shown, and its gridlines.
 *
 * @publicApi
 */
export type ChartAxis = {
    /** The axis' title */
    readonly title?: string | ChartTitle;
    /** Whether the axis and its labels are shown. Default is `true` */
    readonly visible?: boolean;
    /** Whether lines are drawn across the plot at each label. Default is `true` for value axes and `false` for category axes */
    readonly gridlines?: boolean;
    /** Puts the categories or values in reverse order, as Word's "Categories in reverse order" does. Default is `false` */
    readonly reverseOrder?: boolean;
    /**
     * Where this axis crosses the other axis. Default is `"auto"`, or for the secondary value axis, the side opposite the
     * primary: `"maximum"`, or `"minimum"` when the categories are in reverse order. `valueAxis: { crossesAt: "maximum" }`
     * puts the value axis on the right
     */
    readonly crossesAt?: ChartAxisCrossing;
    /** Rotates the labels, in degrees clockwise, from -90 to 90: -45 slants them up to the right. Default is Office's choice */
    readonly labelRotation?: number;
    /**
     * How the labels are written, as an Excel number format such as `"#,##0"`, `"0.0%"`, `"$#,##0"` or, for dates,
     * `"mmm yyyy"`. Default is the values' own
     */
    readonly numberFormat?: string;
    /** The labels' font. Default is 9 points */
    readonly font?: ChartFont;
};

/**
 * Units a value axis' labels are written in, such as thousands: 25,000 is labelled 25, and the axis is labelled
 * "Thousands".
 *
 * @publicApi
 */
export type ChartDisplayUnits =
    | "hundreds"
    | "thousands"
    | "tenThousands"
    | "hundredThousands"
    | "millions"
    | "tenMillions"
    | "hundredMillions"
    | "billions"
    | "trillions";

/**
 * An axis of values: as {@link ChartAxis}, with its range, the interval between its labels, and its scale. On a 100%
 * stacked chart, the range and interval are percentages.
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
    /**
     * Makes the scale logarithmic, with this base, from 2 to 1000: with 10, the labels are 1, 10, 100 and so on. Values
     * of 0 or less can't be shown. Default is a linear scale
     */
    readonly logarithmicBase?: number;
    /** Writes the labels in hundreds, thousands, millions and so on. Default is the values as they are */
    readonly displayUnits?: ChartDisplayUnits;
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
    readonly title?: string | ChartTitle;
    /** The legend, or `false` for none. Default is a legend below the plot */
    readonly legend?: false | ChartLegend;
    /** The font of all the chart's text, apart from its size. The title's, legend's and others' own fonts are applied over it */
    readonly font?: Omit<ChartFont, "size">;
    /** The chart area's fill and border. Default is a white fill with a light grey border */
    readonly chartArea?: ChartAreaStyle;
    /** The plot area's fill and border. Default is neither */
    readonly plotArea?: ChartAreaStyle;
    /** The chart's size in pixels. Default is 576 by 336 pixels (6 by 3.5 inches), the size Word inserts a chart at */
    readonly transformation?: ChartSize;
    /** Floats the chart on the page instead of placing it inline with text, as for images */
    readonly floating?: IFloating;
    /**
     * A name, description and title for screen readers. Without a description, the chart is described from its data,
     * such as "Column chart, Sales. 2024: Jan 10, Feb 20, Mar 30."
     */
    readonly altText?: DocPropertiesOptions;
    /** Marks the chart as decorative, so screen readers skip it. Default is `false` */
    readonly decorative?: boolean;
};

/**
 * Options of the charts with categories and values: column, bar, line and area charts.
 *
 * @publicApi
 */
export type CategoryChartOptions = ChartBaseOptions & {
    /**
     * The categories along the chart's category axis, in order. If they are all numbers, they are written as numbers.
     * If they are all dates, the axis is a date axis, which spaces them by date
     */
    readonly categories: readonly (string | number | Date)[];
    /** The series, one value for each category */
    readonly series: readonly ChartSeries[];
    /** Whether the series of the chart's `type` are stacked. Default is `"none"` */
    readonly stacking?: ChartStacking;
    /** The axis of categories */
    readonly categoryAxis?: ChartAxis;
    /** The axis of values */
    readonly valueAxis?: ChartValueAxis;
    /** The secondary axis of values, on the right, for series with `axis: "secondary"`. It has no gridlines by default */
    readonly secondaryValueAxis?: ChartValueAxis;
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
 * A column chart: vertical bars (`c:barChart` with `c:barDir="col"`). Series can be drawn as lines or areas instead.
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
 * A line chart (`c:lineChart`). Series can be drawn as columns or areas instead.
 *
 * @publicApi
 */
export type LineChartOptions = CategoryChartOptions & {
    readonly type: "line";
    /** Draws a marker at each point, as Word's "Line with Markers" does, or markers of a shape and size. Default is `false` */
    readonly markers?: boolean | ChartMarker;
    /** Draws the lines as smooth curves. Default is `false` */
    readonly smooth?: boolean;
};

/**
 * An area chart (`c:areaChart`). Series can be drawn as columns or lines instead.
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
 * A radar chart (`c:radarChart`): a spoke for each category, and a line around the spokes for each series.
 *
 * @publicApi
 */
export type RadarChartOptions = ChartBaseOptions & {
    readonly type: "radar";
    /** The categories: a spoke each, clockwise from 12 o'clock */
    readonly categories: readonly (string | number)[];
    /** The series, one value for each category */
    readonly series: readonly RadarChartSeries[];
    /**
     * Draws a marker at each point, as Word's "Radar with Markers" does, or markers of a shape and size. Default is
     * `false`. Not for filled charts
     */
    readonly markers?: boolean | ChartMarker;
    /** Fills the area inside each series' line, as Word's "Filled Radar" does. Default is `false` */
    readonly filled?: boolean;
    /** The axis of categories: the labels at the end of the spokes, and the spokes, which are its gridlines */
    readonly categoryAxis?: ChartAxis;
    /** The axis of values, up the first spoke. Its gridlines are the rings */
    readonly valueAxis?: ChartValueAxis;
    /** Labels on each point */
    readonly dataLabels?: ChartDataLabels;
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
    /** Draws a marker at each point, or markers of a shape and size. Default is `true` */
    readonly markers?: boolean | ChartMarker;
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
 * A bubble chart (`c:bubbleChart`): bubbles, each with its own x, y and size, on two value axes.
 *
 * @publicApi
 */
export type BubbleChartOptions = ChartBaseOptions & {
    readonly type: "bubble";
    /** The series, each with its bubbles */
    readonly series: readonly BubbleChartSeries[];
    /** The size of the bubbles, as a percentage of Office's size, from 0 to 300. Default is 100 */
    readonly bubbleScale?: number;
    /** Whether a bubble's size is its area or its width. Default is `"area"` */
    readonly sizeRepresents?: "area" | "width";
    /** The horizontal axis */
    readonly xAxis?: ChartValueAxis;
    /** The vertical axis */
    readonly yAxis?: ChartValueAxis;
    /** Labels on each bubble */
    readonly dataLabels?: BubbleChartDataLabels;
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
    | RadarChartOptions
    | ScatterChartOptions
    | BubbleChartOptions;

/**
 * The type of a chart, by the name Word gives it in Insert Chart.
 *
 * @publicApi
 */
export type ChartType = ChartRunOptions["type"];
