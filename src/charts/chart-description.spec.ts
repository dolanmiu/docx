import { describe, expect, it } from "vitest";

import { MAX_DESCRIPTION_LENGTH, chartAltText, describeChart } from "./chart-description";
import type { ChartRunOptions } from "./chart-options";

const column: ChartRunOptions = {
    type: "column",
    title: "Sales",
    categories: ["Jan", "Feb", "Mar"],
    series: [
        { name: "2024", values: [10, 20, 30] },
        { name: "2025", values: [15, 25, null] },
    ],
};

describe("describeChart", () => {
    it("should describe a chart's type, title and each series' values, leaving out gaps", () => {
        expect(describeChart(column)).to.equal("Column chart, Sales. 2024: Jan 10, Feb 20, Mar 30. 2025: Jan 15, Feb 25.");
    });

    it("should describe a chart without a title, a title of several lines, and a series with no values", () => {
        expect(describeChart({ type: "pie", categories: ["A"], series: [{ name: "Share", values: [null] }] })).to.equal(
            "Pie chart. Share: no values.",
        );
        expect(describeChart({ ...column, title: { text: "Sales\n  by month" }, series: [column.series[0]] } as ChartRunOptions)).to.equal(
            "Column chart, Sales by month. 2024: Jan 10, Feb 20, Mar 30.",
        );
    });

    it("should describe dates as the axis labels them", () => {
        const dated = (categories: readonly Date[]): string =>
            describeChart({ type: "line", categories, series: [{ name: "V", values: categories.map((_, index) => index) }] });

        expect(dated([new Date("2025-01-31"), new Date("2025-02-01")])).to.equal("Line chart. V: 31 Jan 2025 0, 1 Feb 2025 1.");
        expect(dated([new Date("2025-01-01"), new Date("2025-02-01")])).to.equal("Line chart. V: Jan 2025 0, Feb 2025 1.");
        expect(dated([new Date("2024-01-01"), new Date("2025-01-01")])).to.equal("Line chart. V: 2024 0, 2025 1.");
    });

    it("should describe the points of scatter and bubble charts", () => {
        expect(
            describeChart({
                type: "scatter",
                series: [
                    {
                        name: "A",
                        points: [
                            { x: 1, y: 2 },
                            { x: 3, y: -4 },
                        ],
                    },
                ],
            }),
        ).to.equal("Scatter chart. A: (1, 2), (3, -4).");
        expect(
            describeChart({ type: "bubble", title: "Markets", series: [{ name: "Europe", points: [{ x: 1, y: 2, size: 10 }] }] }),
        ).to.equal("Bubble chart, Markets. Europe: (1, 2) size 10.");
    });

    it("should name every type as Word does", () => {
        const categories = ["A"];
        const series = [{ name: "S", values: [1] }];
        expect(
            (["bar", "area", "doughnut", "radar"] as const).map((type) => describeChart({ type, categories, series } as ChartRunOptions)),
        ).to.deep.equal(["Bar chart. S: A 1.", "Area chart. S: A 1.", "Doughnut chart. S: A 1.", "Radar chart. S: A 1."]);
    });

    it("should cut a long description at the end of a value, with an ellipsis", () => {
        const values = Array.from({ length: 300 }, (_, index) => index * 1000);
        const description = describeChart({ type: "line", categories: values.map(String), series: [{ name: "Long", values }] });

        expect(description.length).to.be.at.most(MAX_DESCRIPTION_LENGTH);
        expect(description).to.match(/, \d+ \d+…$/);
        expect(description.startsWith("Line chart. Long: 0 0, 1000 1000")).to.equal(true);
    });

    it("should cut a long description without a place to cut it at its length", () => {
        const description = describeChart({
            type: "pie",
            title: "x".repeat(2000),
            categories: ["A"],
            series: [{ name: "S", values: [1] }],
        });

        expect(description).to.have.length(MAX_DESCRIPTION_LENGTH);
        expect(description.endsWith("x…")).to.equal(true);
    });
});

describe("chartAltText", () => {
    it("should describe a chart without a description, keeping its name and title", () => {
        expect(chartAltText(column)).to.deep.equal({
            name: "",
            description: "Column chart, Sales. 2024: Jan 10, Feb 20, Mar 30. 2025: Jan 15, Feb 25.",
            title: "",
        });
        expect(chartAltText({ ...column, altText: { name: "Chart 1", title: "Sales" } })).to.deep.equal({
            name: "Chart 1",
            title: "Sales",
            description: "Column chart, Sales. 2024: Jan 10, Feb 20, Mar 30. 2025: Jan 15, Feb 25.",
        });
    });

    it("should keep a description given, and describe nothing for a decorative chart", () => {
        const altText = { name: "Chart", description: "Sales rose" };
        expect(chartAltText({ ...column, altText })).to.equal(altText);
        expect(chartAltText({ ...column, decorative: true })).to.equal(undefined);
        expect(chartAltText({ ...column, decorative: true, altText })).to.equal(altText);
    });
});
