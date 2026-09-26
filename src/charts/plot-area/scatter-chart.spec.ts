import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { ScatterChartOptions } from "../chart-options";
import { createScatterChart } from "./scatter-chart";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;

const chart = (options: Partial<ScatterChartOptions> = {}): { readonly group: Element; readonly axes: readonly Element[] } => {
    const full: ScatterChartOptions = {
        type: "scatter",
        series: [
            {
                name: "A",
                points: [
                    { x: 1, y: 2 },
                    { x: 2, y: 3 },
                ],
            },
        ],
        ...options,
    };
    const { groups, axes } = createScatterChart(full, createChartData(full), undefined);
    return { group: parse(groups[0]), axes: axes.map(parse) };
};

describe("createScatterChart", () => {
    it("should write a scatter chart in the schema's order, as Word's Scatter: markers and no lines", () => {
        const { group } = chart();
        const series = children(group, "c:ser")[0];

        expect(group.name).to.equal("c:scatterChart");
        expect(names(group)).to.deep.equal(["c:scatterStyle", "c:varyColors", "c:ser", "c:dLbls", "c:axId", "c:axId"]);
        expect(value(group, "c:scatterStyle")).to.equal("lineMarker");
        expect(value(group, "c:varyColors")).to.equal("0");
        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:marker", "c:xVal", "c:yVal", "c:smooth"]);
        expect(value(children(series, "c:marker")[0], "c:symbol")).to.equal("circle");
        // Applications draw the series' line whatever the scatter style is, so it has no fill
        expect(names(children(children(series, "c:spPr")[0], "a:ln")[0])).to.deep.equal(["a:noFill", "a:round"]);
        expect(value(series, "c:smooth")).to.equal("0");
    });

    it("should refer to each point's x and y as numbers", () => {
        const series = children(chart().group, "c:ser")[0];
        expect(names(children(children(series, "c:xVal")[0], "c:numRef")[0])).to.deep.equal(["c:f", "c:numCache"]);
        expect(names(children(children(series, "c:yVal")[0], "c:numRef")[0])).to.deep.equal(["c:f", "c:numCache"]);
    });

    it("should join the points with straight or smooth lines, and leave out the markers", () => {
        const straight = children(
            chart({ lines: "straight", markers: false, series: [{ name: "Red", points: [{ x: 1, y: 1 }], color: "FF0000" }] }).group,
            "c:ser",
        )[0];
        expect(names(children(children(straight, "c:spPr")[0], "a:ln")[0])).to.deep.equal(["a:solidFill", "a:round"]);
        expect(value(children(straight, "c:marker")[0], "c:symbol")).to.equal("none");

        const { group } = chart({ lines: "smooth" });
        expect(value(group, "c:scatterStyle")).to.equal("smoothMarker");
        expect(value(children(group, "c:ser")[0], "c:smooth")).to.equal("1");
    });

    it("should put labels to the right of the points", () => {
        const series = children(chart({ dataLabels: { value: true } }).group, "c:ser")[0];
        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:marker", "c:dLbls", "c:xVal", "c:yVal", "c:smooth"]);
        expect(value(children(series, "c:dLbls")[0], "c:dLblPos")).to.equal("r");
    });

    it("should write two value axes, x along the bottom and y on the left, both with gridlines and crossing at the data", () => {
        const { axes } = chart({ xAxis: { title: "Time" }, yAxis: { minimum: 0 } });

        expect(axes.map(({ name }) => name)).to.deep.equal(["c:valAx", "c:valAx"]);
        expect(axes.map((axis) => value(axis, "c:axPos"))).to.deep.equal(["b", "l"]);
        expect(axes.map((axis) => value(axis, "c:crossBetween"))).to.deep.equal(["midCat", "midCat"]);
        expect(axes.map((axis) => names(axis).includes("c:majorGridlines"))).to.deep.equal([true, true]);
        expect(names(axes[0])).to.include("c:title");
        expect(value(children(axes[1], "c:scaling")[0], "c:min")).to.equal("0");
    });
});
