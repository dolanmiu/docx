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
});
