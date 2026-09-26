import { describe, expect, it } from "vitest";

import { createChartData } from "./chart-data";
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

        it("should write dates as Excel's serial numbers, in a date format for the unit they are spaced by", () => {
            const days = createChartData(column({ categories: [new Date("2025-01-31"), new Date("2025-02-01"), new Date("2025-02-03")] }));
            const format = "d mmm yyyy";

            expect(days.series[0].categories).to.deep.equal({
                type: "number",
                formula: "Sheet1!$A$2:$A$4",
                points: [45688, 45689, 45691],
                format,
            });
            expect(days.sheet.map((row) => row[0])).to.deep.equal([
                undefined,
                { value: 45688, format },
                { value: 45689, format },
                { value: 45691, format },
            ]);

            const months = createChartData(
                column({ categories: [new Date("2025-01-01"), new Date("2025-04-01"), new Date("2025-07-01")] }),
            );
            expect(months.series[0].categories).to.include({ format: "mmm yyyy" });
            const years = createChartData(column({ categories: [new Date("2024-01-01"), new Date("2025-01-01"), new Date("2026-01-01")] }));
            expect(years.series[0].categories).to.include({ format: "yyyy" });
        });

        it("should name columns after Z with two letters", () => {
            const data = createChartData(
                column({ series: Array.from({ length: 27 }, (_, index) => ({ name: `${index}`, values: [index] })) }),
            );

            expect(data.series[25].values.formula).to.equal("Sheet1!$AA$2:$AA$4");
            expect(data.series[26].name.formula).to.equal("Sheet1!$AB$1");
        });
    });

    describe("a radar chart", () => {
        it("should lay out its series as a chart with categories does", () => {
            const data = createChartData({ type: "radar", categories: ["A", "B"], series: [{ name: "S", values: [1, 2] }] });

            expect(data.sheet).to.deep.equal([
                [undefined, "S"],
                ["A", 1],
                ["B", 2],
            ]);
        });
    });

    describe("a bubble chart", () => {
        it("should give each series three columns: X, its name above its y values, and Size", () => {
            const data = createChartData({
                type: "bubble",
                series: [
                    {
                        name: "A",
                        points: [
                            { x: 1, y: 2, size: 10 },
                            { x: 3, y: 4, size: 0 },
                        ],
                    },
                    { name: "B", points: [{ x: 0.5, y: -1, size: 2.5 }] },
                ],
            });

            expect(data.sheet).to.deep.equal([
                ["X", "A", "Size", "X", "B", "Size"],
                [1, 2, 10, 0.5, -1, 2.5],
                [3, 4, 0, undefined, undefined, undefined],
            ]);
            expect(data.series[1]).to.deep.equal({
                name: { type: "text", formula: "Sheet1!$E$1", points: ["B"] },
                categories: { type: "number", formula: "Sheet1!$D$2", points: [0.5] },
                values: { type: "number", formula: "Sheet1!$E$2", points: [-1] },
                sizes: { type: "number", formula: "Sheet1!$F$2", points: [2.5] },
            });
            expect(data.series[0].sizes).to.deep.equal({ type: "number", formula: "Sheet1!$C$2:$C$3", points: [10, 0] });
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

    describe("categories in groups", () => {
        const quarters = column({
            categories: [
                { name: "2024", categories: ["Q1", "Q2", "Q3"] },
                { name: "2025", categories: ["Q1"] },
            ],
            series: [
                { name: "North", values: [10, 20, 30, 40] },
                { name: "South", values: [5, null] },
            ],
        });

        it("should lay out a column for each level, the groups' names in the row of their first category, and the series after", () => {
            expect(createChartData(quarters).sheet).to.deep.equal([
                [undefined, undefined, "North", "South"],
                ["2024", "Q1", 10, 5],
                [undefined, "Q2", 20, undefined],
                [undefined, "Q3", 30, undefined],
                ["2025", "Q1", 40, undefined],
            ]);
        });

        it("should refer to the categories as a block of cells, with each level's labels, the categories' own first", () => {
            const [north, south] = createChartData(quarters).series;
            expect(north.categories).to.deep.equal({
                type: "levels",
                formula: "Sheet1!$A$2:$B$5",
                count: 4,
                levels: [
                    ["Q1", "Q2", "Q3", "Q1"],
                    ["2024", undefined, undefined, "2025"],
                ],
            });
            expect(south.categories).to.equal(north.categories);
            expect(north.name).to.deep.equal({ type: "text", formula: "Sheet1!$C$1", points: ["North"] });
            expect(south.values).to.deep.equal({
                type: "number",
                formula: "Sheet1!$D$2:$D$5",
                points: [5, undefined, undefined, undefined],
            });
        });

        it("should lay out groups of groups, keeping numbers as numbers in the sheet and text in the chart", () => {
            const data = createChartData(
                column({
                    categories: [
                        { name: "Europe", categories: [{ name: "UK", categories: [1, 2] }] },
                        { name: "Asia", categories: [{ name: "Japan", categories: [3] }] },
                    ],
                    series: [{ name: "S", values: [1, 2, 3] }],
                }),
            );

            expect(data.sheet).to.deep.equal([
                [undefined, undefined, undefined, "S"],
                ["Europe", "UK", 1, 1],
                [undefined, undefined, 2, 2],
                ["Asia", "Japan", 3, 3],
            ]);
            expect(data.series[0].categories).to.deep.equal({
                type: "levels",
                formula: "Sheet1!$A$2:$C$4",
                count: 3,
                levels: [
                    ["1", "2", "3"],
                    ["UK", undefined, "Japan"],
                    ["Europe", undefined, "Asia"],
                ],
            });
            expect(data.series[0].values.formula).to.equal("Sheet1!$D$2:$D$4");
        });

        it("should refer to a single category in a group as a block of one row", () => {
            const data = createChartData(
                column({ categories: [{ name: "2025", categories: ["Q1"] }], series: [{ name: "S", values: [1] }] }),
            );
            expect(data.series[0].categories).to.deep.include({ formula: "Sheet1!$A$2:$B$2", count: 1 });
            expect(data.series[0].values.formula).to.equal("Sheet1!$C$2");
        });
    });

    describe("custom error bars", () => {
        it("should put each series' plus and minus amounts in columns after the series, empty for null or none", () => {
            const data = createChartData(
                column({
                    series: [
                        { name: "A", values: [1, 2, 3], errorBars: { type: "custom", plus: [0.5, null], minus: [1, 1, 1] } },
                        { name: "B", values: [4, 5, 6], errorBars: { type: "fixed", value: 1 } },
                        { name: "C", values: [7, 8, 9], errorBars: { type: "custom", minus: [2] } },
                    ],
                }),
            );

            expect(data.sheet).to.deep.equal([
                [undefined, "A", "B", "C", "A (+)", "A (-)", "C (-)"],
                ["Jan", 1, 4, 7, 0.5, 1, 2],
                ["Feb", 2, 5, 8, undefined, 1, undefined],
                ["Mar", 3, 6, 9, undefined, 1, undefined],
            ]);
            expect(data.series.map(({ errors }) => errors)).to.deep.equal([
                {
                    y: {
                        plus: { type: "number", formula: "Sheet1!$E$2:$E$4", points: [0.5, undefined, undefined] },
                        minus: { type: "number", formula: "Sheet1!$F$2:$F$4", points: [1, 1, 1] },
                    },
                },
                undefined,
                { y: { minus: { type: "number", formula: "Sheet1!$G$2:$G$4", points: [2, undefined, undefined] } } },
            ]);
        });

        it("should put a scatter or bubble series' x amounts, then its y amounts, after every series' points", () => {
            const data = createChartData({
                type: "bubble",
                series: [
                    {
                        name: "A",
                        points: [
                            { x: 1, y: 2, size: 3 },
                            { x: 4, y: 5, size: 6 },
                        ],
                        xErrorBars: { type: "custom", plus: [0.1, 0.2] },
                        yErrorBars: { type: "custom", plus: [1], minus: [2, 3] },
                    },
                    { name: "B", points: [{ x: 7, y: 8, size: 9 }], yErrorBars: { type: "custom", minus: [4] } },
                ],
            });

            expect(data.sheet).to.deep.equal([
                ["X", "A", "Size", "X", "B", "Size", "A x (+)", "A y (+)", "A y (-)", "B y (-)"],
                [1, 2, 3, 7, 8, 9, 0.1, 1, 2, 4],
                [4, 5, 6, undefined, undefined, undefined, 0.2, undefined, 3, undefined],
            ]);
            expect(data.series[0].errors).to.deep.equal({
                x: { plus: { type: "number", formula: "Sheet1!$G$2:$G$3", points: [0.1, 0.2] } },
                y: {
                    plus: { type: "number", formula: "Sheet1!$H$2:$H$3", points: [1, undefined] },
                    minus: { type: "number", formula: "Sheet1!$I$2:$I$3", points: [2, 3] },
                },
            });
            expect(data.series[1].errors).to.deep.equal({ y: { minus: { type: "number", formula: "Sheet1!$J$2", points: [4] } } });
        });

        it("should give a series only the error amounts it has in the sheet", () => {
            const data = createChartData({
                type: "scatter",
                series: [
                    {
                        name: "A",
                        points: [{ x: 1, y: 2 }],
                        xErrorBars: { type: "custom", minus: [1] },
                        yErrorBars: { type: "standardError" },
                    },
                ],
            });
            expect(data.series[0].errors).to.deep.equal({ x: { minus: { type: "number", formula: "Sheet1!$C$2", points: [1] } } });
            expect(data.sheet).to.deep.equal([
                ["X", "A", "A x (-)"],
                [1, 2, 1],
            ]);
        });

        it("should put amounts beside a single category's row", () => {
            const data = createChartData(
                column({ categories: ["A"], series: [{ name: "S", values: [1], errorBars: { type: "custom", plus: [2] } }] }),
            );
            expect(data.sheet).to.deep.equal([
                [undefined, "S", "S (+)"],
                ["A", 1, 2],
            ]);
        });
    });

    describe("a stock chart", () => {
        it("should lay out its volumes, opens, highs, lows and closes in Word's order, with their names", () => {
            const data = createChartData({
                type: "stock",
                categories: ["Mon", "Tue"],
                close: [11, 12],
                low: [10, 11],
                high: [12, 13],
                open: [10.5, null],
                volume: [100, 200],
                names: { open: "Opening" },
            });

            expect(data.sheet).to.deep.equal([
                [undefined, "Volume", "Opening", "High", "Low", "Close"],
                ["Mon", 100, 10.5, 12, 10, 11],
                ["Tue", 200, undefined, 13, 11, 12],
            ]);
            expect(data.series.map(({ name }) => name.formula)).to.deep.equal([
                "Sheet1!$B$1",
                "Sheet1!$C$1",
                "Sheet1!$D$1",
                "Sheet1!$E$1",
                "Sheet1!$F$1",
            ]);
        });

        it("should leave out the opening prices and volumes it doesn't have", () => {
            const data = createChartData({
                type: "stock",
                categories: [new Date("2025-01-06")],
                high: [12],
                low: [10],
                close: [11],
            });

            expect(data.sheet).to.deep.equal([
                [undefined, "High", "Low", "Close"],
                [{ value: 45663, format: "d mmm yyyy" }, 12, 10, 11],
            ]);
        });
    });
});
