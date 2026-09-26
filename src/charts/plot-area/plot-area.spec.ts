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
    [{ type: "scatter", series: [{ name: "S", points: [{ x: 1, y: 1 }] }] }, "c:scatterChart", ["c:valAx", "c:valAx"]],
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
