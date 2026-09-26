import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { BarChartOptions, ColumnChartOptions } from "../chart-options";
import { createBarChart } from "./bar-chart";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;

const chart = (
    options: Partial<ColumnChartOptions> | (Partial<BarChartOptions> & { readonly type: "bar" }) = {},
): {
    readonly group: Element;
    readonly axes: readonly Element[];
} => {
    const full = {
        type: "column",
        categories: ["Jan", "Feb"],
        series: [
            { name: "2024", values: [1, 2] },
            { name: "2025", values: [3, 4] },
        ],
        ...options,
    } as ColumnChartOptions | BarChartOptions;
    const { group, axes } = createBarChart(full, createChartData(full));
    return { group: parse(group), axes: axes.map(parse) };
};

describe("createBarChart", () => {
    it("should write a column chart in the schema's order, with Office's gap and overlap", () => {
        const { group } = chart();

        expect(group.name).to.equal("c:barChart");
        expect(names(group)).to.deep.equal([
            "c:barDir",
            "c:grouping",
            "c:varyColors",
            "c:ser",
            "c:ser",
            "c:dLbls",
            "c:gapWidth",
            "c:overlap",
            "c:axId",
            "c:axId",
        ]);
        expect(value(group, "c:barDir")).to.equal("col");
        expect(value(group, "c:grouping")).to.equal("clustered");
        expect(value(group, "c:varyColors")).to.equal("0");
        expect(value(group, "c:gapWidth")).to.equal("219");
        expect(value(group, "c:overlap")).to.equal("-27");
    });

    it("should write each series in the schema's order, with an index and order of its own and the next accent colour", () => {
        const series = children(chart().group, "c:ser");

        expect(names(series[0])).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:invertIfNegative", "c:cat", "c:val"]);
        expect(series.map((one) => [value(one, "c:idx"), value(one, "c:order")])).to.deep.equal([
            ["0", "0"],
            ["1", "1"],
        ]);
        expect(value(series[0], "c:invertIfNegative")).to.equal("0");
        expect(
            xml(
                new Formatter().format(
                    createBarChart(
                        {
                            type: "column",
                            categories: ["A"],
                            series: [
                                { name: "A", values: [1] },
                                { name: "B", values: [2], color: "FF0000" },
                            ],
                        },
                        createChartData({
                            type: "column",
                            categories: ["A"],
                            series: [
                                { name: "A", values: [1] },
                                { name: "B", values: [2], color: "FF0000" },
                            ],
                        }),
                    ).group,
                ),
            ),
        )
            .to.contain('<a:schemeClr val="accent1"/>')
            .and.contain('<a:srgbClr val="FF0000"/>');
    });

    it("should put a column chart's categories along the bottom and its values on the left", () => {
        const { axes } = chart();

        expect(axes.map(({ name }) => name)).to.deep.equal(["c:catAx", "c:valAx"]);
        expect(axes.map((axis) => value(axis, "c:axPos"))).to.deep.equal(["b", "l"]);
        expect(value(axes[1], "c:crossBetween")).to.equal("between");
    });

    it("should write a bar chart with horizontal bars, its categories on the left, and Office's gap and overlap", () => {
        const { group, axes } = chart({ type: "bar" });

        expect(value(group, "c:barDir")).to.equal("bar");
        expect(value(group, "c:gapWidth")).to.equal("182");
        expect(value(group, "c:overlap")).to.equal("0");
        expect(axes.map((axis) => value(axis, "c:axPos"))).to.deep.equal(["l", "b"]);
    });

    it("should stack series with a gap of 150, overlapping fully whatever overlap is given", () => {
        const stacked = chart({ stacking: "stacked", overlap: -50 }).group;
        expect(value(stacked, "c:grouping")).to.equal("stacked");
        expect(value(stacked, "c:gapWidth")).to.equal("150");
        expect(value(stacked, "c:overlap")).to.equal("100");

        const { group, axes } = chart({ type: "bar", stacking: "percent" });
        expect(value(group, "c:grouping")).to.equal("percentStacked");
        expect(value(group, "c:overlap")).to.equal("100");
        expect(children(axes[1], "c:numFmt")[0].attributes).to.deep.equal({ formatCode: "0%", sourceLinked: "1" });
    });

    it("should write the gap and overlap given, rounded", () => {
        const { group } = chart({ gapWidth: 80.4, overlap: -10.6, stacking: "none" });
        expect(value(group, "c:gapWidth")).to.equal("80");
        expect(value(group, "c:overlap")).to.equal("-11");
    });

    it("should put labels outside the end of bars, or in the middle of stacked bars", () => {
        const labelled = children(chart({ dataLabels: { value: true } }).group, "c:ser")[0];
        expect(names(labelled)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:invertIfNegative", "c:dLbls", "c:cat", "c:val"]);
        expect(value(children(labelled, "c:dLbls")[0], "c:dLblPos")).to.equal("outEnd");

        const stacked = children(chart({ dataLabels: { value: true }, stacking: "stacked" }).group, "c:ser")[0];
        expect(value(children(stacked, "c:dLbls")[0], "c:dLblPos")).to.equal("ctr");
    });
});
