/**
 * A chart's legend entries: their text, and their index, by which an entry is hidden (`c:legendEntry`).
 *
 * @module
 */
// cspell:ignore Expon
import type { ChartRunOptions, ChartTrendline, ChartTrendlineType } from "./chart-options";
import { stockSeriesOf } from "./chart-stock";

/**
 * An entry of the legend.
 */
export type LegendEntry = {
    /** Its text, as the legend shows it */
    readonly text: string;
    /** Its index (`c:idx` of `c:legendEntry`) */
    readonly index: number;
};

// The start of the name Office gives a trendline in the legend, for each type
const TRENDLINE_NAMES: Readonly<Record<Exclude<ChartTrendlineType, "movingAverage">, string>> = {
    linear: "Linear",
    exponential: "Expon.",
    logarithmic: "Log.",
    polynomial: "Poly.",
    power: "Power",
};

/**
 * A trendline's name in the legend: its own, or Office's, such as "Linear (Sales)" or "3 per. Mov. Avg. (Sales)".
 *
 * @param series - The series' name
 */
export const trendlineNameOf = (trendline: ChartTrendline, series: string): string => {
    if (trendline.name !== undefined) {
        return trendline.name;
    }
    const type = trendline.type === "movingAverage" ? `${trendline.period ?? 2} per. Mov. Avg.` : TRENDLINE_NAMES[trendline.type];
    return `${type} (${series})`;
};

/**
 * The legend's entries, in order. A pie's or doughnut's are its categories. Other charts' are their series, in order,
 * then their trendlines, which Office numbers after every series.
 */
export const legendEntriesOf = (options: ChartRunOptions): readonly LegendEntry[] => {
    switch (options.type) {
        case "pie":
        case "doughnut":
        case "pieOfPie":
        case "barOfPie":
            return options.categories.map((category, index) => ({ text: String(category), index }));
        case "stock":
            return stockSeriesOf(options).map(({ name }, index) => ({ text: name, index }));
        default: {
            const { series }: { readonly series: readonly { readonly name: string; readonly trendlines?: readonly ChartTrendline[] }[] } =
                options;
            const trendlines = series.flatMap(({ name, trendlines: own = [] }) => own.map((trendline) => trendlineNameOf(trendline, name)));
            return [...series.map(({ name }) => name), ...trendlines].map((text, index) => ({ text, index }));
        }
    }
};
