import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { AreaChartOptions, BarChartOptions, ColumnChartOptions, LineChartOptions } from "../chart-options";
import { createCategoryCharts } from "./category-chart";

type Options = ColumnChartOptions | BarChartOptions | LineChartOptions | AreaChartOptions;

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;
const axisIds = (group: Element): readonly unknown[] => children(group, "c:axId").map(({ attributes }) => attributes!.val);
const seriesIndexes = (group: Element): readonly unknown[] => children(group, "c:ser").map((series) => value(series, "c:idx"));

const charts = (
    options: Partial<Options> & { readonly type?: Options["type"] },
): { readonly groups: readonly Element[]; readonly axes: readonly Element[] } => {
    const full = { type: "column", categories: ["Jan", "Feb"], series: [{ name: "A", values: [1, 2] }], ...options } as Options;
    const { groups, axes } = createCategoryCharts(full, createChartData(full), undefined);
    return { groups: groups.map(parse), axes: axes.map(parse) };
};

const withOptions = (options: Options): Parameters<typeof createCategoryCharts> => [options, createChartData(options), undefined];

const colored = (): Parameters<typeof createCategoryCharts> =>
    withOptions({ type: "column", categories: ["A", "B"], series: [{ name: "A", values: [1, 2], colors: [undefined, "FF0000"] }] });

const dashed = (): Parameters<typeof createCategoryCharts> =>
    withOptions({
        type: "line",
        categories: ["A", "B"],
        series: [{ name: "A", values: [1, 2], line: { width: 1, dash: "dash", color: "00FF00" } }],
    });

describe("createCategoryCharts", () => {
    it("should write a group for each way series are drawn: areas, then bars, then lines, each series keeping its index", () => {
        const { groups, axes } = charts({
            type: "line",
            series: [
                { name: "Line", values: [1, 2] },
                { name: "Column", values: [3, 4], type: "column" },
                { name: "Area", values: [5, 6], type: "area" },
                { name: "Another line", values: [7, 8] },
            ],
        });

        expect(groups.map(({ name }) => name)).to.deep.equal(["c:areaChart", "c:barChart", "c:lineChart"]);
        expect(groups.map(seriesIndexes)).to.deep.equal([["2"], ["1"], ["0", "3"]]);
        // All against the primary axes
        expect(groups.map(axisIds)).to.deep.equal([
            ["1", "2"],
            ["1", "2"],
            ["1", "2"],
        ]);
        expect(axes.map(({ name }) => name)).to.deep.equal(["c:catAx", "c:valAx"]);
        // Columns are drawn between the categories, so the areas are too
        expect(value(axes[1], "c:crossBetween")).to.equal("between");
    });

    it("should stack only the groups drawn as the chart's type", () => {
        const { groups, axes } = charts({
            stacking: "percent",
            series: [
                { name: "A", values: [1, 2] },
                { name: "B", values: [3, 4] },
                { name: "Total", values: [4, 6], type: "line" },
            ],
        });

        expect(value(groups[0], "c:grouping")).to.equal("percentStacked");
        expect(value(groups[1], "c:grouping")).to.equal("standard");
        expect(children(axes[1], "c:numFmt")[0].attributes).to.deep.equal({ formatCode: "0%", sourceLinked: "1" });
    });

    it("should give a line chart's options to its line series and a column chart's to its bars, and Office's to the others", () => {
        const line = charts({
            type: "line",
            markers: true,
            smooth: true,
            series: [
                { name: "Line", values: [1, 2] },
                { name: "Column", values: [3, 4], type: "column" },
            ],
        });
        expect(value(line.groups[0], "c:gapWidth")).to.equal("219");
        expect(value(line.groups[1], "c:marker")).to.equal("1");
        expect(value(children(line.groups[1], "c:ser")[0], "c:smooth")).to.equal("1");

        const column = charts({
            gapWidth: 50,
            series: [
                { name: "Column", values: [1, 2] },
                { name: "Line", values: [3, 4], type: "line" },
            ],
        });
        expect(value(column.groups[0], "c:gapWidth")).to.equal("50");
        expect(names(column.groups[1])).to.not.include("c:marker");
        expect(value(children(column.groups[1], "c:ser")[0], "c:smooth")).to.equal("0");
    });

    it("should draw series against a secondary value axis on the right, which crosses a hidden secondary category axis", () => {
        const { groups, axes } = charts({
            series: [
                { name: "Sales", values: [1, 2] },
                { name: "Growth", values: [0.1, 0.2], type: "line", axis: "secondary" },
                { name: "Returns", values: [1, 1], axis: "secondary" },
            ],
            categoryAxis: { reverseOrder: true, title: "Month" },
            secondaryValueAxis: { title: "Growth" },
        });

        // The primary groups, then the secondary ones
        expect(groups.map(({ name }) => name)).to.deep.equal(["c:barChart", "c:barChart", "c:lineChart"]);
        expect(groups.map(axisIds)).to.deep.equal([
            ["1", "2"],
            ["3", "4"],
            ["3", "4"],
        ]);
        expect(axes.map(({ name }) => name)).to.deep.equal(["c:catAx", "c:valAx", "c:valAx", "c:catAx"]);
        expect(axes.map((axis) => [value(axis, "c:axId"), value(axis, "c:crossAx"), value(axis, "c:axPos")])).to.deep.equal([
            ["1", "2", "b"],
            ["2", "1", "l"],
            ["4", "3", "r"],
            ["3", "4", "b"],
        ]);

        const [primaryCategories, , secondaryValues, secondaryCategories] = axes;
        // At the first of the reversed categories, on the right, opposite the primary value axis
        expect(value(secondaryValues, "c:crosses")).to.equal("min");
        expect(names(secondaryValues)).to.not.include("c:majorGridlines");
        expect(names(secondaryValues)).to.include("c:title");
        // Hidden, without the primary's title, and in the same order, so each series lines up with its category
        expect(value(secondaryCategories, "c:delete")).to.equal("1");
        expect(names(secondaryCategories)).to.not.include("c:title");
        expect(value(children(secondaryCategories, "c:scaling")[0], "c:orientation")).to.equal("maxMin");
        expect(value(children(primaryCategories, "c:scaling")[0], "c:orientation")).to.equal("maxMin");
    });

    it("should cross a date axis at a date", () => {
        const { axes } = charts({
            categories: [new Date("2025-01-01"), new Date("2025-02-01")],
            valueAxis: { crossesAt: new Date("2025-02-01") },
        });

        expect(value(axes[1], "c:crossesAt")).to.equal("45689");
    });

    it("should put a bar chart's secondary value axis at the top", () => {
        const { axes } = charts({
            type: "bar",
            series: [
                { name: "A", values: [1, 2] },
                { name: "B", values: [3, 4], axis: "secondary" },
            ],
            secondaryValueAxis: { crossesAt: "auto" },
        });

        expect(axes.map((axis) => value(axis, "c:axPos"))).to.deep.equal(["l", "b", "t", "l"]);
        expect(value(axes[2], "c:crosses")).to.equal("autoZero");
    });

    it("should label a value axis as percentages only when a group against it is stacked to 100%", () => {
        const { axes } = charts({
            stacking: "percent",
            series: [
                { name: "A", values: [1, 2] },
                { name: "Line", values: [3, 4], type: "line", axis: "secondary" },
            ],
            categoryAxis: { crossesAt: 50 },
        });

        expect(children(axes[1], "c:numFmt")[0].attributes).to.include({ formatCode: "0%" });
        expect(children(axes[2], "c:numFmt")[0].attributes).to.include({ formatCode: "General" });
        // The secondary value axis at the last category, on the right
        expect(value(axes[2], "c:crosses")).to.equal("max");
        // The category axis crosses the percentage axis at a fraction of 1
        expect(value(axes[0], "c:crossesAt")).to.equal("0.5");

        const secondaryPercent = charts({
            stacking: "percent",
            series: [
                { name: "Line", values: [3, 4], type: "line" },
                { name: "A", values: [1, 2], axis: "secondary" },
            ],
        });
        expect(children(secondaryPercent.axes[1], "c:numFmt")[0].attributes).to.include({ formatCode: "General" });
        expect(children(secondaryPercent.axes[2], "c:numFmt")[0].attributes).to.include({ formatCode: "0%" });
    });

    it("should let areas reach both sides of the plot only when every series is an area", () => {
        expect(value(charts({ type: "area" }).axes[1], "c:crossBetween")).to.equal("midCat");
        const mixed = charts({
            type: "area",
            series: [
                { name: "A", values: [1, 2] },
                { name: "B", values: [1, 2], type: "line", axis: "secondary" },
            ],
        });
        expect(value(mixed.axes[1], "c:crossBetween")).to.equal("between");
        expect(value(mixed.axes[2], "c:crossBetween")).to.equal("between");
    });

    it("should write date axes for dates, spaced by the unit the dates are", () => {
        const { axes } = charts({
            categories: [new Date("2025-01-01"), new Date("2025-02-01")],
            series: [
                { name: "A", values: [1, 2] },
                { name: "B", values: [3, 4], type: "line", axis: "secondary" },
            ],
        });

        expect(axes.map(({ name }) => name)).to.deep.equal(["c:dateAx", "c:valAx", "c:valAx", "c:dateAx"]);
        expect(value(axes[0], "c:baseTimeUnit")).to.equal("months");
        expect(children(axes[0], "c:numFmt")[0].attributes).to.deep.equal({ formatCode: "mmm yyyy", sourceLinked: "1" });
    });

    it("should write the chart's font on its axes", () => {
        const full: ColumnChartOptions = { type: "column", categories: ["A"], series: [{ name: "A", values: [1] }] };
        const written = createCategoryCharts(full, createChartData(full), { name: "Arial" })
            .axes.map((axis) => xml(new Formatter().format(axis)))
            .join("");

        expect(written.match(/<a:latin typeface="Arial"\/>/g)).to.have.length(2);
    });
});

describe("createCategoryCharts' series", () => {
    it("should colour single bars with their own colours, and leave the others the series' colour", () => {
        const [series] = children(charts({ series: [{ name: "A", values: [1, 2], colors: [undefined, "FF0000"] }] }).groups[0], "c:ser");

        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:invertIfNegative", "c:dPt", "c:cat", "c:val"]);
        const point = children(series, "c:dPt")[0];
        expect(names(point)).to.deep.equal(["c:idx", "c:invertIfNegative", "c:bubble3D", "c:spPr"]);
        expect(value(point, "c:idx")).to.equal("1");
        expect(xml(new Formatter().format(createCategoryCharts(...colored()).groups[0]))).to.contain(
            '<c:dPt><c:idx val="1"/><c:invertIfNegative val="0"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr></c:dPt>',
        );
    });

    it("should give a series its own labels instead of the chart's, or none", () => {
        const { groups } = charts({
            dataLabels: { value: true },
            series: [
                { name: "Chart's", values: [1, 2] },
                { name: "Own", values: [1, 2], dataLabels: { category: true, position: "insideBase" } },
                { name: "None", values: [1, 2], dataLabels: false },
            ],
        });
        const labels = children(groups[0], "c:ser").map((series) => children(series, "c:dLbls")[0]);

        expect(value(labels[0], "c:showVal")).to.equal("1");
        expect(value(labels[0], "c:dLblPos")).to.equal("outEnd");
        expect(value(labels[1], "c:showVal")).to.equal("0");
        expect(value(labels[1], "c:showCatName")).to.equal("1");
        expect(value(labels[1], "c:dLblPos")).to.equal("inBase");
        expect(labels[2]).to.equal(undefined);
    });

    it("should give the chart's label position to the series drawn as its type, and Office's to the others", () => {
        const { groups } = charts({
            dataLabels: { value: true, position: "insideEnd" },
            series: [
                { name: "Bars", values: [1, 2] },
                { name: "Line", values: [1, 2], type: "line" },
                { name: "Area", values: [1, 2], type: "area" },
            ],
        });
        const position = (group: Element): unknown => value(children(children(group, "c:ser")[0], "c:dLbls")[0], "c:dLblPos");

        expect(groups.map(({ name }) => name)).to.deep.equal(["c:areaChart", "c:barChart", "c:lineChart"]);
        expect(groups.map(position)).to.deep.equal([undefined, "inEnd", "r"]);
    });

    it("should check each series' label position against the way it is drawn", () => {
        expect(() =>
            charts({
                series: [
                    { name: "Bars", values: [1, 2], dataLabels: { value: true, position: "outsideEnd" } },
                    { name: "Line", values: [1, 2], type: "line", dataLabels: { value: true, position: "outsideEnd" } },
                ],
            }),
        ).to.throw('Invalid data label position "outsideEnd" for series "Line". Labels on a line can be at');
        expect(() =>
            charts({
                stacking: "stacked",
                series: [{ name: "Stacked", values: [1, 2], dataLabels: { value: true, position: "outsideEnd" } }],
            }),
        ).to.throw("Labels on stacked bars can be at");
    });

    it("should draw a line series' own markers, smoothness and line", () => {
        const [series] = children(
            charts({
                type: "line",
                series: [
                    {
                        name: "A",
                        values: [1, 2],
                        markers: { shape: "square", size: 8 },
                        smooth: true,
                        line: { width: 1, dash: "dash", color: "00FF00" },
                    },
                ],
            }).groups[0],
            "c:ser",
        );
        const marker = children(series, "c:marker")[0];

        expect(value(marker, "c:symbol")).to.equal("square");
        expect(value(marker, "c:size")).to.equal("8");
        expect(value(series, "c:smooth")).to.equal("1");
        expect(xml(new Formatter().format(createCategoryCharts(...dashed()).groups[0]))).to.contain(
            '<c:spPr><a:ln w="12700" cap="rnd"><a:solidFill><a:srgbClr val="00FF00"/></a:solidFill><a:prstDash val="dash"/><a:round/></a:ln>',
        );
    });
});
