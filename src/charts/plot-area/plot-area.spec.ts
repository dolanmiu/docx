// cspell:ignore cmpd
import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";

import { createChartData } from "../chart-data";
import type { ChartRunOptions } from "../chart-options";
import { createPlotArea } from "./plot-area";

const plotArea = (options: ChartRunOptions): Element =>
    (xml2js(xml(new Formatter().format(createPlotArea(options, createChartData(options))))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;

const categories = ["A", "B"];
const series = [{ name: "S", values: [1, 2] }];
const CHARTS: readonly (readonly [ChartRunOptions, string, readonly string[]])[] = [
    [{ type: "column", categories, series }, "c:barChart", ["c:catAx", "c:valAx"]],
    [{ type: "bar", categories, series }, "c:barChart", ["c:catAx", "c:valAx"]],
    [{ type: "line", categories, series }, "c:lineChart", ["c:catAx", "c:valAx"]],
    [{ type: "area", categories, series }, "c:areaChart", ["c:catAx", "c:valAx"]],
    [{ type: "pie", categories, series }, "c:pieChart", []],
    [{ type: "doughnut", categories, series }, "c:doughnutChart", []],
    [{ type: "radar", categories, series }, "c:radarChart", ["c:catAx", "c:valAx"]],
    [{ type: "scatter", series: [{ name: "S", points: [{ x: 1, y: 1 }] }] }, "c:scatterChart", ["c:valAx", "c:valAx"]],
    [{ type: "bubble", series: [{ name: "S", points: [{ x: 1, y: 1, size: 1 }] }] }, "c:bubbleChart", ["c:valAx", "c:valAx"]],
    [{ type: "pieOfPie", categories, series }, "c:ofPieChart", []],
    [{ type: "barOfPie", categories, series }, "c:ofPieChart", []],
    [{ type: "stock", categories, high: [2, 3], low: [1, 2], close: [1.5, 2.5] }, "c:stockChart", ["c:catAx", "c:valAx"]],
];

describe("createPlotArea", () => {
    it("should write the layout, the chart group of each type, its axes, and no fill", () => {
        for (const [options, group, axes] of CHARTS) {
            const area = plotArea(options);
            expect(names(area)).to.deep.equal(["c:layout", group, ...axes, "c:spPr"]);
            expect(names(children(area, "c:spPr")[0])).to.deep.equal(["a:noFill", "a:ln", "a:effectLst"]);
        }
    });

    // The Open XML SDK validator doesn't check that axis ids refer to axes, so this does
    it("should give each chart group the ids of its two axes, and each axis the id of the other", () => {
        for (const [options] of CHARTS.filter(([, , axes]) => axes.length > 0)) {
            const area = plotArea(options);
            const group = area.elements![1];
            const axes = area.elements!.slice(2, 4);
            const ids = axes.map((axis) => value(axis, "c:axId"));

            expect(children(group, "c:axId").map(({ attributes }) => attributes!.val)).to.deep.equal(ids);
            expect(new Set(ids).size).to.equal(2);
            expect(axes.map((axis) => value(axis, "c:crossAx"))).to.deep.equal([...ids].reverse());
        }
    });
});

describe("createPlotArea's style", () => {
    it("should fill and border the plot area as asked", () => {
        const area = plotArea({ type: "column", categories, series, plotArea: { fill: "FFFFFF" } });
        expect(names(children(area, "c:spPr")[0])).to.deep.equal(["a:solidFill", "a:ln", "a:effectLst"]);
    });

    it("should write each group of a combo chart before the axes", () => {
        const area = plotArea({
            type: "column",
            categories,
            series: [
                { name: "A", values: [1, 2] },
                { name: "B", values: [1, 2], type: "line", axis: "secondary" },
            ],
        });
        expect(names(area)).to.deep.equal(["c:layout", "c:barChart", "c:lineChart", "c:catAx", "c:valAx", "c:valAx", "c:catAx", "c:spPr"]);
    });
});

describe("createPlotArea's data table", () => {
    it("should write a data table after the axes, before the plot area's fill, with Office's borders and legend keys", () => {
        const area = plotArea({ type: "column", categories, series, dataTable: true });
        expect(names(area)).to.deep.equal(["c:layout", "c:barChart", "c:catAx", "c:valAx", "c:dTable", "c:spPr"]);
        const table = children(area, "c:dTable")[0];
        expect(names(table)).to.deep.equal(["c:showHorzBorder", "c:showVertBorder", "c:showOutline", "c:showKeys", "c:spPr", "c:txPr"]);
        expect(["c:showHorzBorder", "c:showVertBorder", "c:showOutline", "c:showKeys"].map((name) => value(table, name))).to.deep.equal([
            "1",
            "1",
            "1",
            "1",
        ]);
        const written = xml(
            new Formatter().format(
                createPlotArea(
                    { type: "column", categories, series, dataTable: true },
                    createChartData({ type: "column", categories, series }),
                ),
            ),
        );
        expect(written).to.contain(
            '<c:spPr><a:noFill/><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="15000"/><a:lumOff val="85000"/></a:schemeClr></a:solidFill><a:round/></a:ln><a:effectLst/></c:spPr><c:txPr>',
        );
    });

    it("should leave out the borders and keys asked, and write its font over the chart's", () => {
        const options: ChartRunOptions = {
            type: "line",
            categories,
            series,
            font: { name: "Arial" },
            dataTable: { legendKeys: false, horizontalBorders: false, verticalBorders: false, outline: false, font: { size: 8 } },
        };
        const table = children(plotArea(options), "c:dTable")[0];
        expect(["c:showHorzBorder", "c:showVertBorder", "c:showOutline", "c:showKeys"].map((name) => value(table, name))).to.deep.equal([
            "0",
            "0",
            "0",
            "0",
        ]);
        const written = xml(new Formatter().format(createPlotArea(options, createChartData(options))));
        expect(written).to.contain('<a:defRPr sz="800"');
        expect(written).to.contain('<a:latin typeface="Arial"/>');
    });

    it("should write no data table for false, and put a stock chart's after its axes", () => {
        expect(names(plotArea({ type: "area", categories, series, dataTable: false }))).to.not.include("c:dTable");
        expect(
            names(plotArea({ type: "stock", categories, high: [2, 3], low: [1, 2], close: [1.5, 2.5], volume: [5, 6], dataTable: true })),
        ).to.deep.equal(["c:layout", "c:barChart", "c:stockChart", "c:catAx", "c:valAx", "c:valAx", "c:catAx", "c:dTable", "c:spPr"]);
    });
});
