import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { LineChartOptions } from "../chart-options";
import { createCategoryCharts } from "./category-chart";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;

const chart = (options: Partial<LineChartOptions> = {}): { readonly group: Element; readonly axes: readonly Element[] } => {
    const full: LineChartOptions = { type: "line", categories: ["Jan", "Feb"], series: [{ name: "2025", values: [1, 2] }], ...options };
    const { groups, axes } = createCategoryCharts(full, createChartData(full), undefined);
    return { group: parse(groups[0]), axes: axes.map(parse) };
};

describe("createLineChart", () => {
    it("should write a line chart in the schema's order, as Word's plain Line", () => {
        const { group, axes } = chart();

        expect(group.name).to.equal("c:lineChart");
        expect(names(group)).to.deep.equal(["c:grouping", "c:varyColors", "c:ser", "c:dLbls", "c:axId", "c:axId"]);
        expect(value(group, "c:grouping")).to.equal("standard");
        expect(value(group, "c:varyColors")).to.equal("0");
        expect(axes.map(({ name }) => name)).to.deep.equal(["c:catAx", "c:valAx"]);
        expect(axes.map((axis) => value(axis, "c:axPos"))).to.deep.equal(["b", "l"]);
        expect(value(axes[1], "c:crossBetween")).to.equal("between");
    });

    it("should write each series with its line, no marker, and not smooth", () => {
        const series = children(chart().group, "c:ser")[0];

        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:marker", "c:cat", "c:val", "c:smooth"]);
        expect(value(children(series, "c:marker")[0], "c:symbol")).to.equal("none");
        expect(value(series, "c:smooth")).to.equal("0");
        expect(
            xml(
                new Formatter().format(
                    createCategoryCharts(
                        { type: "line", categories: ["A"], series: [{ name: "A", values: [1] }] },
                        createChartData({ type: "line", categories: ["A"], series: [{ name: "A", values: [1] }] }),
                        undefined,
                    ).groups[0],
                ),
            ),
        ).to.contain('<c:spPr><a:ln w="28575" cap="rnd"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill><a:round/></a:ln>');
    });

    it("should draw markers in the series' colour, as Word's Line with Markers does", () => {
        const { group } = chart({ markers: true, series: [{ name: "Red", values: [1], color: "FF0000" }] });

        expect(names(group)).to.deep.equal(["c:grouping", "c:varyColors", "c:ser", "c:dLbls", "c:marker", "c:axId", "c:axId"]);
        expect(value(group, "c:marker")).to.equal("1");
        const marker = xml(
            new Formatter().format(
                createCategoryCharts(
                    { type: "line", markers: true, categories: ["A"], series: [{ name: "Red", values: [1], color: "FF0000" }] },
                    createChartData({ type: "line", categories: ["A"], series: [{ name: "Red", values: [1] }] }),
                    undefined,
                ).groups[0],
            ),
        );
        expect(marker).to.contain(
            '<c:marker><c:symbol val="circle"/><c:size val="5"/><c:spPr><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></a:ln><a:effectLst/></c:spPr></c:marker>',
        );
    });

    it("should smooth the lines, stack them, and put labels to the right of the points", () => {
        const { group, axes } = chart({ smooth: true, stacking: "percent", dataLabels: { value: true } });
        const series = children(group, "c:ser")[0];

        expect(value(series, "c:smooth")).to.equal("1");
        expect(value(group, "c:grouping")).to.equal("percentStacked");
        expect(value(chart({ stacking: "stacked" }).group, "c:grouping")).to.equal("stacked");
        expect(children(axes[1], "c:numFmt")[0].attributes).to.deep.equal({ formatCode: "0%", sourceLinked: "1" });
        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:marker", "c:dLbls", "c:cat", "c:val", "c:smooth"]);
        expect(value(children(series, "c:dLbls")[0], "c:dLblPos")).to.equal("r");
    });
});
