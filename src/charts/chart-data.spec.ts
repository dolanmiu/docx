import { describe, expect, it } from "vitest";

import { checkRange, createChartData } from "./chart-data";
import type { ChartRunOptions } from "./chart-options";

const column = (options: Partial<Extract<ChartRunOptions, { readonly type: "column" }>> = {}): ChartRunOptions => ({
    type: "column",
    categories: ["Jan", "Feb", "Mar"],
    series: [{ name: "2025", values: [1, 2, 3] }],
    ...options,
});

describe("createChartData", () => {
    describe("a chart with categories", () => {
        it("should lay out the sheet as Word does: names in row 1, categories in column A and values below each name", () => {
            const data = createChartData(
                column({
                    series: [
                        { name: "2024", values: [10, 20, 30] },
                        { name: "2025", values: [15, null] },
                    ],
                }),
            );

            expect(data.sheet).to.deep.equal([
                [undefined, "2024", "2025"],
                ["Jan", 10, 15],
                ["Feb", 20, undefined],
                ["Mar", 30, undefined],
            ]);
        });

        it("should refer each series to its name, the categories and its values, with the values each cell holds", () => {
            const data = createChartData(
                column({
                    series: [
                        { name: "2024", values: [10, 20, 30] },
                        { name: "2025", values: [15, null] },
                    ],
                }),
            );

            expect(data.series).to.deep.equal([
                {
                    name: { type: "text", formula: "Sheet1!$B$1", points: ["2024"] },
                    categories: { type: "text", formula: "Sheet1!$A$2:$A$4", points: ["Jan", "Feb", "Mar"] },
                    values: { type: "number", formula: "Sheet1!$B$2:$B$4", points: [10, 20, 30] },
                },
                {
                    name: { type: "text", formula: "Sheet1!$C$1", points: ["2025"] },
                    categories: { type: "text", formula: "Sheet1!$A$2:$A$4", points: ["Jan", "Feb", "Mar"] },
                    // A null and a missing value are both gaps
                    values: { type: "number", formula: "Sheet1!$C$2:$C$4", points: [15, undefined, undefined] },
                },
            ]);
        });

        it("should write categories that are all numbers as numbers, and otherwise as text", () => {
            expect(createChartData(column({ categories: [2024, 2025, 2026] })).series[0].categories).to.deep.equal({
                type: "number",
                formula: "Sheet1!$A$2:$A$4",
                points: [2024, 2025, 2026],
            });
            const mixed = createChartData(column({ categories: [2024, "2025", 2026] }));
            expect(mixed.series[0].categories).to.deep.equal({
                type: "text",
                formula: "Sheet1!$A$2:$A$4",
                points: ["2024", "2025", "2026"],
            });
            // The cells keep their own types
            expect(mixed.sheet.map((row) => row[0])).to.deep.equal([undefined, 2024, "2025", 2026]);
        });

        it("should refer to a single category as one cell", () => {
            expect(createChartData(column({ categories: ["Only"], series: [{ name: "A", values: [1] }] })).series[0]).to.deep.equal({
                name: { type: "text", formula: "Sheet1!$B$1", points: ["A"] },
                categories: { type: "text", formula: "Sheet1!$A$2", points: ["Only"] },
                values: { type: "number", formula: "Sheet1!$B$2", points: [1] },
            });
        });

        it("should lay out the series of pie and doughnut charts in the same way", () => {
            const data = createChartData({
                type: "doughnut",
                categories: ["A", "B"],
                series: [
                    { name: "Inner", values: [1, 2] },
                    { name: "Outer", values: [3, 4] },
                ],
            });

            expect(data.sheet).to.deep.equal([
                [undefined, "Inner", "Outer"],
                ["A", 1, 3],
                ["B", 2, 4],
            ]);
        });

        it("should name columns after Z with two letters", () => {
            const data = createChartData(
                column({ series: Array.from({ length: 27 }, (_, index) => ({ name: `${index}`, values: [index] })) }),
            );

            expect(data.series[25].values.formula).to.equal("Sheet1!$AA$2:$AA$4");
            expect(data.series[26].name.formula).to.equal("Sheet1!$AB$1");
        });
    });

    describe("a scatter chart", () => {
        it("should give each series two columns, X above its x values and its name above its y values", () => {
            const data = createChartData({
                type: "scatter",
                series: [
                    {
                        name: "A",
                        points: [
                            { x: 1, y: 2 },
                            { x: 3, y: 4 },
                        ],
                    },
                    { name: "B", points: [{ x: 0.5, y: -1 }] },
                ],
            });

            expect(data.sheet).to.deep.equal([
                ["X", "A", "X", "B"],
                [1, 2, 0.5, -1],
                [3, 4, undefined, undefined],
            ]);
            expect(data.series).to.deep.equal([
                {
                    name: { type: "text", formula: "Sheet1!$B$1", points: ["A"] },
                    categories: { type: "number", formula: "Sheet1!$A$2:$A$3", points: [1, 3] },
                    values: { type: "number", formula: "Sheet1!$B$2:$B$3", points: [2, 4] },
                },
                {
                    name: { type: "text", formula: "Sheet1!$D$1", points: ["B"] },
                    categories: { type: "number", formula: "Sheet1!$C$2", points: [0.5] },
                    values: { type: "number", formula: "Sheet1!$D$2", points: [-1] },
                },
            ]);
        });
    });

    describe("checks", () => {
        it("should throw when there are no series or no categories", () => {
            expect(() => createChartData(column({ series: [] }))).to.throw("A chart needs at least one series");
            expect(() => createChartData({ type: "scatter", series: [] })).to.throw("A chart needs at least one series");
            expect(() => createChartData(column({ categories: [] }))).to.throw("A chart needs at least one category");
            expect(() => createChartData({ type: "pie", categories: [], series: [{ name: "A", values: [] }] })).to.throw(
                "A chart needs at least one category",
            );
        });

        it("should throw for a category that is a number but not a finite one", () => {
            expect(() => createChartData(column({ categories: [1, Number.NaN] }))).to.throw(
                "Invalid category NaN. Expected text or a finite number",
            );
        });

        it("should throw when a series has more values than there are categories", () => {
            expect(() => createChartData(column({ series: [{ name: "Long", values: [1, 2, 3, 4] }] }))).to.throw(
                'Series "Long" has 4 values, but there are 3 categories',
            );
        });

        it("should throw for a value that isn't a finite number or null", () => {
            for (const value of [Number.NaN, Infinity, "5" as unknown as number, undefined as unknown as number]) {
                expect(() => createChartData(column({ series: [{ name: "Bad", values: [1, value] }] }))).to.throw(
                    `Invalid value ${value} in series "Bad". Expected a finite number or null`,
                );
            }
        });

        it("should throw for a pie chart with more than one series, or a negative value in a pie or doughnut chart", () => {
            const categories = ["A", "B"];
            expect(() =>
                createChartData({
                    type: "pie",
                    categories,
                    series: [
                        { name: "A", values: [1, 2] },
                        { name: "B", values: [1, 2] },
                    ],
                }),
            ).to.throw("A pie chart has one series, but 2 were given. A doughnut chart can have more");
            expect(() => createChartData({ type: "pie", categories, series: [{ name: "Loss", values: [1, -2] }] })).to.throw(
                "Invalid value -2 in series \"Loss\". A pie chart's values can't be negative",
            );
            expect(() => createChartData({ type: "doughnut", categories, series: [{ name: "Loss", values: [null, -1] }] })).to.throw(
                "Invalid value -1 in series \"Loss\". A doughnut chart's values can't be negative",
            );
            expect(() => createChartData({ type: "pie", categories, series: [{ name: "Long", values: [1, 2, 3] }] })).to.throw(
                'Series "Long" has 3 values, but there are 2 categories',
            );
        });

        it("should throw when a pie's series has more colours than there are slices", () => {
            expect(() =>
                createChartData({
                    type: "pie",
                    categories: ["A"],
                    series: [{ name: "Colours", values: [1], colors: ["FF0000", "00FF00"] }],
                }),
            ).to.throw('Series "Colours" has 2 colors, but there are 1 categories');
        });

        it("should throw for a scatter series without points, or a point that isn't two finite numbers", () => {
            expect(() => createChartData({ type: "scatter", series: [{ name: "Empty", points: [] }] })).to.throw(
                'Series "Empty" has no points',
            );
            expect(() => createChartData({ type: "scatter", series: [{ name: "Bad", points: [{ x: 1, y: Number.NaN }] }] })).to.throw(
                'Invalid point (1, NaN) in series "Bad". Expected a finite x and y',
            );
            expect(() => createChartData({ type: "scatter", series: [{ name: "Bad", points: [{ x: Infinity, y: 1 }] }] })).to.throw(
                'Invalid point (Infinity, 1) in series "Bad"',
            );
        });

        it("should throw for a size that isn't a positive number of pixels", () => {
            expect(() => createChartData(column({ transformation: { width: 0, height: 100 } }))).to.throw(
                "Invalid chart width 0. Expected a positive number of pixels",
            );
            expect(() => createChartData(column({ transformation: { width: 100, height: Infinity } }))).to.throw(
                "Invalid chart height Infinity. Expected a positive number of pixels",
            );
        });

        it("should throw for a value axis whose range or interval isn't one", () => {
            expect(() => createChartData(column({ valueAxis: { minimum: Number.NaN } }))).to.throw(
                "Invalid value axis minimum NaN. Expected a finite number",
            );
            expect(() => createChartData(column({ valueAxis: { minimum: 10, maximum: 10 } }))).to.throw(
                "Invalid value axis range from 10 to 10. Expected the minimum to be less than the maximum",
            );
            expect(() => createChartData(column({ valueAxis: { interval: 0 } }))).to.throw(
                "Invalid value axis interval 0. Expected a number greater than 0",
            );
            expect(() =>
                createChartData({ type: "scatter", series: [{ name: "A", points: [{ x: 1, y: 1 }] }], xAxis: { maximum: -1, minimum: 0 } }),
            ).to.throw("Invalid x axis range from 0 to -1");
            expect(() =>
                createChartData({ type: "scatter", series: [{ name: "A", points: [{ x: 1, y: 1 }] }], yAxis: { interval: -2 } }),
            ).to.throw("Invalid y axis interval -2");
            // A range with only one end, and an interval, are fine
            expect(() => createChartData(column({ valueAxis: { minimum: 0, interval: 5 } }))).to.not.throw();
            expect(() => createChartData(column({ valueAxis: { maximum: 0 } }))).to.not.throw();
        });

        it("should throw for a gap width, overlap, first slice angle or hole size outside its range", () => {
            expect(() => createChartData(column({ gapWidth: 501 }))).to.throw("Invalid gap width 501. Expected a number from 0 to 500");
            expect(() => createChartData({ type: "bar", categories: ["A"], series: [{ name: "A", values: [1] }], overlap: -101 })).to.throw(
                "Invalid overlap -101. Expected a number from -100 to 100",
            );
            const pie = { categories: ["A"], series: [{ name: "A", values: [1] }] };
            expect(() => createChartData({ type: "pie", ...pie, firstSliceAngle: 361 })).to.throw(
                "Invalid first slice angle 361. Expected a number from 0 to 360",
            );
            expect(() => createChartData({ type: "doughnut", ...pie, holeSize: 5 })).to.throw(
                "Invalid hole size 5. Expected a number from 10 to 90",
            );
            expect(() => createChartData({ type: "doughnut", ...pie, holeSize: 90, firstSliceAngle: 360 })).to.not.throw();
        });
    });
});

describe("checkRange", () => {
    it("should accept a number in the range, or nothing", () => {
        expect(() => checkRange(undefined, "size", 0, 1)).to.not.throw();
        expect(() => checkRange(0, "size", 0, 1)).to.not.throw();
        expect(() => checkRange(Number.NaN, "size", 0, 1)).to.throw("Invalid size NaN. Expected a number from 0 to 1");
    });
});
