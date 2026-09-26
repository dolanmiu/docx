/**
 * A stock chart's series: its volumes and prices, in the order Word lays them out.
 *
 * @module
 */
import type { StockChartOptions } from "./chart-options";

/**
 * What a stock chart's series is.
 */
export type StockSeriesRole = "volume" | "open" | "high" | "low" | "close";

/**
 * A series of a stock chart.
 */
export type StockSeries = {
    readonly role: StockSeriesRole;
    /** Its name, as the legend shows it */
    readonly name: string;
    readonly values: readonly (number | null)[];
};

const DEFAULT_NAMES: Readonly<Record<StockSeriesRole, string>> = {
    volume: "Volume",
    open: "Open",
    high: "High",
    low: "Low",
    close: "Close",
};

const ROLES: readonly StockSeriesRole[] = ["volume", "open", "high", "low", "close"];

/**
 * A stock chart's series, in Word's order, which is the order its sheet's columns are in and its series are plotted in:
 * the volumes, the opening prices, the highs, the lows and the closing prices. Those not given are left out.
 */
export const stockSeriesOf = (options: StockChartOptions): readonly StockSeries[] =>
    ROLES.flatMap((role) => {
        const values = options[role];
        return values === undefined ? [] : [{ role, name: options.names?.[role] ?? DEFAULT_NAMES[role], values }];
    });
