// cspell:ignore Expon
import { describe, expect, it } from "vitest";

import { legendEntriesOf, trendlineNameOf } from "./chart-legend";
import type { ChartRunOptions } from "./chart-options";

describe("chart-legend", () => {
    describe("trendlineNameOf", () => {
        it("should name a trendline as Office does, after its type and series", () => {
            expect(
                (["linear", "exponential", "logarithmic", "polynomial", "power"] as const).map((type) =>
                    trendlineNameOf({ type }, "Sales"),
                ),
            ).to.deep.equal(["Linear (Sales)", "Expon. (Sales)", "Log. (Sales)", "Poly. (Sales)", "Power (Sales)"]);
        });

        it("should name a moving average after its period, 2 unless it has one", () => {
            expect(trendlineNameOf({ type: "movingAverage" }, "Sales")).to.equal("2 per. Mov. Avg. (Sales)");
            expect(trendlineNameOf({ type: "movingAverage", period: 7 }, "Sales")).to.equal("7 per. Mov. Avg. (Sales)");
        });

        it("should give a trendline's own name, even an empty one", () => {
            expect(trendlineNameOf({ type: "linear", name: "Trend" }, "Sales")).to.equal("Trend");
            expect(trendlineNameOf({ type: "linear", name: "" }, "Sales")).to.equal("");
        });
    });

    describe("legendEntriesOf", () => {
        it("should give a series' chart its series, then every series' trendlines, numbered on from them", () => {
            const options: ChartRunOptions = {
                type: "line",
                categories: ["A", "B", "C"],
                series: [
                    { name: "One", values: [1, 2, 3], trendlines: [{ type: "linear" }, { type: "movingAverage", name: "Smooth" }] },
                    { name: "Two", values: [1, 2, 3] },
                    { name: "Three", values: [1, 2, 3], trendlines: [{ type: "power" }] },
                ],
            };

            expect(legendEntriesOf(options)).to.deep.equal([
                { text: "One", index: 0 },
                { text: "Two", index: 1 },
                { text: "Three", index: 2 },
                { text: "Linear (One)", index: 3 },
                { text: "Smooth", index: 4 },
                { text: "Power (Three)", index: 5 },
            ]);
        });

        it("should give a scatter or bubble chart its series and trendlines", () => {
            expect(
                legendEntriesOf({
                    type: "scatter",
                    series: [{ name: "P", points: [{ x: 1, y: 1 }], trendlines: [{ type: "linear" }] }],
                }),
            ).to.deep.equal([
                { text: "P", index: 0 },
                { text: "Linear (P)", index: 1 },
            ]);
        });

        it("should give a pie, doughnut, pie of pie or bar of pie chart its categories, as text", () => {
            for (const type of ["pie", "doughnut", "pieOfPie", "barOfPie"] as const) {
                expect(
                    legendEntriesOf({ type, categories: ["North", 2025], series: [{ name: "S", values: [1, 2] }] } as ChartRunOptions),
                    type,
                ).to.deep.equal([
                    { text: "North", index: 0 },
                    { text: "2025", index: 1 },
                ]);
            }
        });

        it("should give a stock chart its series, in Word's order, with their names", () => {
            expect(
                legendEntriesOf({ type: "stock", categories: ["A"], volume: [1], high: [2], low: [1], close: [1], names: { low: "Min" } }),
            ).to.deep.equal([
                { text: "Volume", index: 0 },
                { text: "High", index: 1 },
                { text: "Min", index: 2 },
                { text: "Close", index: 3 },
            ]);
        });
    });
});
