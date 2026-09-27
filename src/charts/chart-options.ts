/**
 * The options of a chart: its type, data, axes, legend, labels and text.
 *
 * @module
 */
import type { DocPropertiesOptions, IFloating, IRunPropertiesOptions, ThemeColor } from "docx";

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
 * Text of a label's own, in place of what it would show.
 *
 * @publicApi
 */
export type ChartLabelText = {
    /**
     * The label's text, in place of the value, category or series' name, such as `"Record high"`. Each line of the text is
     * a line of the label. A label with text shows nothing else
     */
    readonly text?: string;
};

/**
 * The label of one bar or point, over its series' labels: its own text, or what it shows, where it is, its number
 * format and its font. Anything left out is as the series' labels have it.
 *
 * @publicApi
 */
export type ChartPointLabel = ChartDataLabels & ChartLabelText;

/**
 * The label of one slice of a pie or doughnut chart: as {@link ChartPointLabel}, or the slice's percentage.
 *
 * @publicApi
 */
export type PieChartPointLabel = PieChartDataLabels & ChartLabelText;

/**
 * The label of one bubble of a bubble chart: as {@link ChartPointLabel}, or the bubble's size.
 *
 * @publicApi
 */
export type BubbleChartPointLabel = BubbleChartDataLabels & ChartLabelText;

/**
 * The kind of line a trendline fits to a series' values:
 *
 * - `"linear"`: a straight line;
 * - `"exponential"`: a curve that rises or falls ever faster, for values above 0;
 * - `"logarithmic"`: a curve that rises or falls quickly, then levels out;
 * - `"polynomial"`: a curve with as many bends as its `order`, less one;
 * - `"power"`: a curve for values that grow at a steady rate, above 0;
 * - `"movingAverage"`: the average of each point and the points before it, which smooths out the ups and downs.
 *
 * @publicApi
 */
export type ChartTrendlineType = "linear" | "exponential" | "logarithmic" | "polynomial" | "power" | "movingAverage";

/**
 * The label of a trendline's equation and R² value.
 *
 * @publicApi
 */
export type ChartTrendlineLabel = {
    /** How the numbers are written, as an Excel number format such as `"#,##0.00"`. Default is `"General"` */
    readonly numberFormat?: string;
    /** The label's font. Default is 9 points */
    readonly font?: ChartFont;
};

/**
 * A trendline: a line fitted to a series' values, which shows their trend, and can extend it forward or backward as a
 * forecast. It is drawn as a dotted line in the series' colour, and has an entry in the legend.
 *
 * @publicApi
 */
export type ChartTrendline = {
    /** The kind of line fitted to the values */
    readonly type: ChartTrendlineType;
    /** The order of a polynomial trendline, from 2 to 6: 2 has one bend, 3 has two, and so on. Default is 2 */
    readonly order?: number;
    /**
     * How many points each point of a moving average averages, from 2 to one fewer than the series' values or points.
     * Default is 2
     */
    readonly period?: number;
    /** The trendline's name in the legend. Default is Office's, such as "Linear (Sales)" */
    readonly name?: string;
    /**
     * Extends the trendline past the last point by this many categories, or on a scatter or bubble chart, this much along
     * the x axis. Default is 0. Not for moving averages
     */
    readonly forecastForward?: number;
    /**
     * Extends the trendline before the first point by this many categories, or on a scatter or bubble chart, this much
     * along the x axis. Default is 0. Not for moving averages
     */
    readonly forecastBackward?: number;
    /**
     * Where the trendline crosses the vertical axis: its value where x is 0. Default is where the values put it. Only for
     * linear, exponential and polynomial trendlines, and above 0 for exponential ones
     */
    readonly intercept?: number;
    /** Shows the trendline's equation on the chart, such as "y = 2.5x + 4". Default is `false`. Not for moving averages */
    readonly equation?: boolean;
    /** Shows how well the trendline fits the values, its R² value, on the chart. Default is `false`. Not for moving averages */
    readonly rSquared?: boolean;
    /** The equation's and R² value's number format and font */
    readonly label?: ChartTrendlineLabel;
    /** The line's colour, width and dashes. Default is the series' colour, 1.5 points wide, with short dots */
    readonly line?: ChartLine;
};

/**
 * What error bars share, whatever their size: which way they go, their end caps and their line.
 *
 * @publicApi
 */
export type ChartErrorBarsStyle = {
    /** Whether the bars end with a short line across them. Default is `true` */
    readonly endCaps?: boolean;
    /** The bars' colour, width and dashes. Default is dark grey, 0.75 points wide */
    readonly line?: ChartLine;
};

/**
 * Error bars of a size that follows a rule: a fixed amount, a percentage of each value, a number of standard
 * deviations, or the standard error.
 *
 * @publicApi
 */
export type ChartErrorBarsAmount = ChartErrorBarsStyle & {
    /**
     * Which way the bars go from each point: both ways, or only towards higher values (`"plus"`) or lower ones
     * (`"minus"`). Default is `"both"`
     */
    readonly direction?: "both" | "plus" | "minus";
} & (
        | {
              /** The same amount at each point */
              readonly type: "fixed";
              /** The amount, 0 or more */
              readonly value: number;
          }
        | {
              /** A percentage of each point's value */
              readonly type: "percentage";
              /** The percentage, 0 or more */
              readonly value: number;
          }
        | {
              /** A number of standard deviations of the series' values, from their average */
              readonly type: "standardDeviation";
              /** How many standard deviations, 0 or more. Default is 1 */
              readonly value?: number;
          }
        | {
              /** The standard error of the series' values */
              readonly type: "standardError";
          }
    );

/**
 * Error bars of a size of each point's own, such as a range of uncertainty. The amounts are kept in the chart's
 * workbook, beside the data.
 *
 * @publicApi
 */
export type ChartCustomErrorBars = ChartErrorBarsStyle & {
    readonly type: "custom";
    /** How far each bar goes towards higher values, one amount for each value or point, in order. `null` leaves none */
    readonly plus?: readonly (number | null)[];
    /** How far each bar goes towards lower values, one amount for each value or point, in order. `null` leaves none */
    readonly minus?: readonly (number | null)[];
};

/**
 * Error bars: a line from each point of a series, showing how far its value might be off.
 *
 * @publicApi
 */
export type ChartErrorBars = ChartErrorBarsAmount | ChartCustomErrorBars;

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
    /**
     * Labels of single bars or points, in the order of the categories: a label of its own, `false` for none, or
     * `undefined` for the series' own
     */
    readonly pointLabels?: readonly (false | ChartPointLabel | undefined)[];
    /** Lines fitted to the values. Not for stacked series */
    readonly trendlines?: readonly ChartTrendline[];
    /** Error bars along the values: up and down from columns, lines and areas, or left and right from a bar chart's bars */
    readonly errorBars?: ChartErrorBars;
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
    /**
     * Labels of single slices, in the order of the categories: a label of its own, `false` for none, or `undefined` for
     * the series' own
     */
    readonly pointLabels?: readonly (false | PieChartPointLabel | undefined)[];
    /**
     * Pulls the slices out from the centre, by a percentage of the radius from 0 to 400: one amount for every slice, or
     * one for each slice in the order of the categories, where `undefined` leaves a slice in. Default is 0
     */
    readonly explosion?: number | readonly (number | undefined)[];
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
    /**
     * Labels of single points, in the order of the categories: a label of its own, `false` for none, or `undefined` for
     * the series' own
     */
    readonly pointLabels?: readonly (false | ChartPointLabel | undefined)[];
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
    /** Labels of single points, in order: a label of its own, `false` for none, or `undefined` for the series' own */
    readonly pointLabels?: readonly (false | ChartPointLabel | undefined)[];
    /** Lines fitted to the points */
    readonly trendlines?: readonly ChartTrendline[];
    /** Error bars along the x axis, left and right of each point */
    readonly xErrorBars?: ChartErrorBars;
    /** Error bars along the y axis, up and down from each point */
    readonly yErrorBars?: ChartErrorBars;
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
    /** Labels of single bubbles, in order: a label of its own, `false` for none, or `undefined` for the series' own */
    readonly pointLabels?: readonly (false | BubbleChartPointLabel | undefined)[];
    /** Lines fitted to the bubbles' centres */
    readonly trendlines?: readonly ChartTrendline[];
    /** Error bars along the x axis, left and right of each bubble's centre */
    readonly xErrorBars?: ChartErrorBars;
    /** Error bars along the y axis, up and down from each bubble's centre */
    readonly yErrorBars?: ChartErrorBars;
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
    /**
     * Entries to leave out of the legend, by their text: a series' name, a trendline's name, or on a pie or doughnut
     * chart, a category. The series stays in the chart
     */
    readonly hiddenEntries?: readonly (string | number)[];
};

/**
 * A table of the chart's data under its plot, as Word's "Data Table" draws it: a row for each series, and a column for
 * each category.
 *
 * @publicApi
 */
export type ChartDataTable = {
    /** Shows each series' key, as in the legend, beside its name. Default is `true` */
    readonly legendKeys?: boolean;
    /** Lines between the rows. Default is `true` */
    readonly horizontalBorders?: boolean;
    /** Lines between the columns. Default is `true` */
    readonly verticalBorders?: boolean;
    /** A line around the table. Default is `true` */
    readonly outline?: boolean;
    /** The table's font. Default is 9 points */
    readonly font?: ChartFont;
};

/**
 * A group of categories, such as the quarters of a year, labelled below them on the category axis. A group holds
 * categories, or groups of its own, such as the months of each quarter of each year.
 *
 * @publicApi
 */
export type ChartCategoryGroup = {
    /** The group's name, such as `"2025"`, below its categories */
    readonly name: string;
    /** The categories in the group, in order, or the groups in it. Every group at the same depth holds the same kind */
    readonly categories: readonly (string | number)[] | readonly ChartCategoryGroup[];
};

/**
 * How empty values (`null`) are drawn: as gaps, as zero, or, for a line, by joining the points either side.
 *
 * @publicApi
 */
export type ChartEmptyValues = "gap" | "zero" | "connect";

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
    /** Formatting of the run the chart is in, such as `position` to raise or lower it from the text's baseline */
    readonly run?: IRunPropertiesOptions;
};

/**
 * Options of the charts with categories and values: column, bar, line and area charts.
 *
 * @publicApi
 */
export type CategoryChartOptions = ChartBaseOptions & {
    /**
     * The categories along the chart's category axis, in order. If they are all numbers, they are written as numbers.
     * If they are all dates, the axis is a date axis, which spaces them by date. Groups of categories, such as quarters
     * in years, are labelled in rows, the groups below their categories
     */
    readonly categories: readonly (string | number | Date)[] | readonly ChartCategoryGroup[];
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
    /** How empty values (`null`) are drawn: as gaps, as zero, or with a line joining the points either side. Default is `"gap"` */
    readonly emptyValues?: ChartEmptyValues;
    /** A table of the data under the plot, or `true` for one with Office's borders and legend keys. Default is none */
    readonly dataTable?: boolean | ChartDataTable;
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
    /** How empty values (`null`) are drawn: as gaps, as zero, or with a line joining the points either side. Default is `"gap"` */
    readonly emptyValues?: ChartEmptyValues;
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
 * How a pie of pie or bar of pie chart picks the slices it moves from the pie to the second plot:
 *
 * - `"position"`: the last `count` categories;
 * - `"value"`: the slices whose values are less than `lessThan`;
 * - `"percentage"`: the slices less than `lessThan` percent of the whole;
 * - `"categories"`: the slices of the categories given.
 *
 * @publicApi
 */
export type PieChartSplit =
    | {
          readonly by: "position";
          /** How many of the last categories go to the second plot, from 1 to the number of categories */
          readonly count: number;
      }
    | {
          readonly by: "value";
          /** Slices with values less than this go to the second plot */
          readonly lessThan: number;
      }
    | {
          readonly by: "percentage";
          /** Slices less than this percentage of the whole, from 0 to 100, go to the second plot */
          readonly lessThan: number;
      }
    | {
          readonly by: "categories";
          /** The categories whose slices go to the second plot */
          readonly categories: readonly (string | number)[];
      };

/**
 * Options of pie of pie and bar of pie charts: a pie with some of its slices taken out, and drawn beside it as a
 * second pie or a stacked bar, joined to the slice of the pie that stands for them.
 *
 * @publicApi
 */
export type SplitPieChartBaseOptions = Omit<PieChartBaseOptions, "firstSliceAngle"> & {
    /** The series. The chart has one */
    readonly series: readonly PieChartSeries[];
    /** Which slices go to the second plot. Default is the last third of the categories, rounded up */
    readonly split?: PieChartSplit;
    /** The size of the second plot, as a percentage of the pie's, from 5 to 200. Default is 75 */
    readonly secondPlotSize?: number;
    /** The gap between the pie and the second plot, as a percentage of the second plot's width, from 0 to 500. Default is 100 */
    readonly gapWidth?: number;
    /** The lines joining the pie to the second plot. Default is thin grey lines */
    readonly seriesLines?: ChartLine;
};

/**
 * A pie of pie chart (`c:ofPieChart` with `c:ofPieType="pie"`): the small slices of a pie drawn again as a second pie
 * beside it.
 *
 * @publicApi
 */
export type PieOfPieChartOptions = SplitPieChartBaseOptions & {
    readonly type: "pieOfPie";
};

/**
 * A bar of pie chart (`c:ofPieChart` with `c:ofPieType="bar"`): the small slices of a pie drawn again as a stacked bar
 * beside it.
 *
 * @publicApi
 */
export type BarOfPieChartOptions = SplitPieChartBaseOptions & {
    readonly type: "barOfPie";
};

/**
 * The names of a stock chart's series, as the legend shows them.
 *
 * @publicApi
 */
export type StockChartSeriesNames = {
    /** Default is `"Volume"` */
    readonly volume?: string;
    /** Default is `"Open"` */
    readonly open?: string;
    /** Default is `"High"` */
    readonly high?: string;
    /** Default is `"Low"` */
    readonly low?: string;
    /** Default is `"Close"` */
    readonly close?: string;
};

/**
 * A stock chart (`c:stockChart`): each category's high and low prices joined by a line, with its closing price, and if
 * given, its opening price and the volume traded, as Word's "High-Low-Close", "Open-High-Low-Close",
 * "Volume-High-Low-Close" and "Volume-Open-High-Low-Close" charts. Each price list has one value for each category, in
 * order, and `null` leaves a gap.
 *
 * @publicApi
 */
export type StockChartOptions = ChartBaseOptions & {
    readonly type: "stock";
    /**
     * The categories, such as trading days, in order. Dates are spaced evenly, one for each category, so days without
     * trading, such as weekends, leave no gaps
     */
    readonly categories: readonly (string | number | Date)[];
    /**
     * Each category's opening price. With it, a bar goes from the open to the close: hollow when the price rose, and
     * filled when it fell
     */
    readonly open?: readonly (number | null)[];
    /** Each category's highest price */
    readonly high: readonly (number | null)[];
    /** Each category's lowest price */
    readonly low: readonly (number | null)[];
    /** Each category's closing price */
    readonly close: readonly (number | null)[];
    /** Each category's volume traded, drawn as columns against an axis of its own on the left, with the prices' on the right */
    readonly volume?: readonly (number | null)[];
    /** The series' names, as the legend shows them */
    readonly names?: StockChartSeriesNames;
    /** The axis of categories */
    readonly categoryAxis?: ChartAxis;
    /** The axis of prices */
    readonly valueAxis?: ChartValueAxis;
    /** The axis of volumes, when there are volumes */
    readonly volumeAxis?: ChartValueAxis;
    /** The line from each high to each low. Default is a thin dark grey line */
    readonly highLowLines?: ChartLine;
    /** The fill and border of the bars where the price rose, when there are opening prices. Default is white, with a grey border */
    readonly upBars?: ChartAreaStyle;
    /** The fill and border of the bars where the price fell, when there are opening prices. Default is dark grey */
    readonly downBars?: ChartAreaStyle;
    /** How empty values (`null`) are drawn: as gaps, or as zero. Default is `"gap"` */
    readonly emptyValues?: ChartEmptyValues;
    /** A table of the data under the plot, or `true` for one with Office's borders and legend keys. Default is none */
    readonly dataTable?: boolean | ChartDataTable;
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
    | PieOfPieChartOptions
    | BarOfPieChartOptions
    | RadarChartOptions
    | ScatterChartOptions
    | BubbleChartOptions
    | StockChartOptions;

/**
 * The type of a chart, by the name Word gives it in Insert Chart.
 *
 * @publicApi
 */
export type ChartType = ChartRunOptions["type"];
