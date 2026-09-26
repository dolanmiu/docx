import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { RadarChartOptions } from "../chart-options";
import { createRadarChart } from "./radar-chart";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;

const create = (options: Partial<RadarChartOptions> = {}): { readonly group: XmlComponent; readonly axes: readonly XmlComponent[] } => {
    const full: RadarChartOptions = {
        type: "radar",
        categories: ["Speed", "Power", "Range"],
        series: [
            { name: "A", values: [1, 2, 3] },
            { name: "B", values: [3, 2, 1], color: "FF0000" },
        ],
        ...options,
    };
    const { groups, axes } = createRadarChart(full, createChartData(full), undefined);
    return { group: groups[0], axes };
};

describe("createRadarChart", () => {
    it("should write a radar chart in the schema's order, as Excel's Radar: lines without markers", () => {
        const group = parse(create().group);
        const series = children(group, "c:ser")[0];

        expect(group.name).to.equal("c:radarChart");
        expect(names(group)).to.deep.equal(["c:radarStyle", "c:varyColors", "c:ser", "c:ser", "c:dLbls", "c:axId", "c:axId"]);
        expect(value(group, "c:radarStyle")).to.equal("marker");
        expect(value(group, "c:varyColors")).to.equal("0");
        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:marker", "c:cat", "c:val"]);
        expect(value(children(series, "c:marker")[0], "c:symbol")).to.equal("none");
        expect(xml(new Formatter().format(create().group))).to.contain(
            '<c:spPr><a:ln w="28575" cap="rnd"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill><a:round/></a:ln><a:effectLst/></c:spPr>',
        );
    });

    it("should draw markers, the chart's or a series' own, and a series' own line", () => {
        const group = parse(
            create({
                markers: true,
                series: [
                    { name: "A", values: [1, 2, 3], markers: { shape: "diamond" }, line: { dash: "dot" } },
                    { name: "B", values: [3, 2, 1] },
                    { name: "C", values: [3, 2, 1], markers: false },
                ],
            }).group,
        );
        const symbols = children(group, "c:ser").map((series) => value(children(series, "c:marker")[0], "c:symbol"));

        expect(symbols).to.deep.equal(["diamond", "circle", "none"]);
        expect(xml(new Formatter().format(create({ series: [{ name: "A", values: [1], line: { dash: "dot" } }] }).group))).to.contain(
            '<a:prstDash val="dot"/>',
        );
    });

    it("should fill the series of a filled radar chart, without lines or markers", () => {
        const group = parse(create({ filled: true }).group);
        const series = children(group, "c:ser")[0];

        expect(value(group, "c:radarStyle")).to.equal("filled");
        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:cat", "c:val"]);
        expect(names(children(series, "c:spPr")[0])).to.deep.equal(["a:solidFill", "a:ln", "a:effectLst"]);
    });

    it("should write labels without a position, as Office does", () => {
        const series = children(parse(create({ dataLabels: { value: true } }).group), "c:ser")[0];

        expect(names(series)).to.include("c:dLbls");
        expect(names(children(series, "c:dLbls")[0])).to.not.include("c:dLblPos");
        expect(() => create({ dataLabels: { value: true, position: "center" } })).to.throw("Labels on a radar chart have no position");
    });

    it("should write a category axis with the spokes as its gridlines, and a value axis with the rings", () => {
        const axes = create({ valueAxis: { maximum: 5 } }).axes.map(parse);

        expect(axes.map(({ name }) => name)).to.deep.equal(["c:catAx", "c:valAx"]);
        expect(axes.map((axis) => names(axis).includes("c:majorGridlines"))).to.deep.equal([true, true]);
        expect(axes.map((axis) => value(axis, "c:majorTickMark"))).to.deep.equal(["cross", "cross"]);
        expect(value(children(axes[1], "c:scaling")[0], "c:max")).to.equal("5");
        expect(value(axes[1], "c:crossBetween")).to.equal("between");
    });
});
