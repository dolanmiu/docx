import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { AreaChartOptions } from "../chart-options";
import { createAreaChart } from "./area-chart";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;

const chart = (options: Partial<AreaChartOptions> = {}): { readonly group: Element; readonly axes: readonly Element[] } => {
    const full: AreaChartOptions = { type: "area", categories: ["Jan", "Feb"], series: [{ name: "2025", values: [1, 2] }], ...options };
    const { group, axes } = createAreaChart(full, createChartData(full));
    return { group: parse(group), axes: axes.map(parse) };
};

describe("createAreaChart", () => {
    it("should write an area chart in the schema's order, filled, with the areas reaching both sides of the plot", () => {
        const { group, axes } = chart();
        const series = children(group, "c:ser")[0];

        expect(group.name).to.equal("c:areaChart");
        expect(names(group)).to.deep.equal(["c:grouping", "c:varyColors", "c:ser", "c:dLbls", "c:axId", "c:axId"]);
        expect(value(group, "c:grouping")).to.equal("standard");
        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:cat", "c:val"]);
        expect(names(children(series, "c:spPr")[0])).to.deep.equal(["a:solidFill", "a:ln", "a:effectLst"]);
        expect(axes.map((axis) => value(axis, "c:axPos"))).to.deep.equal(["b", "l"]);
        expect(value(axes[1], "c:crossBetween")).to.equal("midCat");
    });

    it("should stack the areas, and write labels without a position, as Office does", () => {
        const { group, axes } = chart({ stacking: "percent", dataLabels: { value: true } });
        const series = children(group, "c:ser")[0];

        expect(value(group, "c:grouping")).to.equal("percentStacked");
        expect(value(chart({ stacking: "stacked" }).group, "c:grouping")).to.equal("stacked");
        expect(children(axes[1], "c:numFmt")[0].attributes).to.deep.equal({ formatCode: "0%", sourceLinked: "1" });
        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:dLbls", "c:cat", "c:val"]);
        expect(names(children(series, "c:dLbls")[0])).to.not.include("c:dLblPos");
    });
});
