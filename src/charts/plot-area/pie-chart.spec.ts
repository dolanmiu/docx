import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { DoughnutChartOptions, PieChartOptions } from "../chart-options";
import { createPieChart } from "./pie-chart";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;

const create = (
    options: PieChartOptions | DoughnutChartOptions,
): { readonly group: XmlComponent; readonly axes: readonly XmlComponent[] } => {
    const { groups, axes } = createPieChart(options, createChartData(options), undefined);
    return { group: groups[0], axes };
};

const pie: PieChartOptions = { type: "pie", categories: ["A", "B", "C"], series: [{ name: "Share", values: [3, 2, 1] }] };

describe("createPieChart", () => {
    it("should write a pie chart in the schema's order, with varied colours and no axes", () => {
        const { group, axes } = create(pie);
        const element = parse(group);

        expect(element.name).to.equal("c:pieChart");
        expect(names(element)).to.deep.equal(["c:varyColors", "c:ser", "c:dLbls", "c:firstSliceAng"]);
        expect(value(element, "c:varyColors")).to.equal("1");
        expect(value(element, "c:firstSliceAng")).to.equal("0");
        expect(value(children(element, "c:dLbls")[0], "c:showLeaderLines")).to.equal("1");
        expect(axes).to.deep.equal([]);
    });

    it("should write a data point for each slice, coloured with the theme's accents or its own colour", () => {
        const series = children(
            parse(create({ ...pie, series: [{ name: "Share", values: [3, 2, 1], colors: [undefined, "00FF00"] }] }).group),
            "c:ser",
        )[0];
        const points = children(series, "c:dPt");

        expect(names(series)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:dPt", "c:dPt", "c:dPt", "c:cat", "c:val"]);
        expect(names(points[0])).to.deep.equal(["c:idx", "c:bubble3D", "c:spPr"]);
        expect(points.map((point) => value(point, "c:idx"))).to.deep.equal(["0", "1", "2"]);
        expect(value(points[0], "c:bubble3D")).to.equal("0");
        // Each slice's fill colour
        expect(points.map((point) => children(children(point, "c:spPr")[0], "a:solidFill")[0].elements![0].attributes!.val)).to.deep.equal([
            "accent1",
            "00FF00",
            "accent3",
        ]);
    });

    it("should put labels where they fit best, with leader lines, and start the first slice at the angle given", () => {
        const element = parse(create({ ...pie, dataLabels: { percentage: true }, firstSliceAngle: 89.6 }).group);
        const labels = children(children(element, "c:ser")[0], "c:dLbls")[0];

        expect(value(labels, "c:dLblPos")).to.equal("bestFit");
        expect(value(labels, "c:showPercent")).to.equal("1");
        expect(value(labels, "c:showLeaderLines")).to.equal("1");
        expect(value(element, "c:firstSliceAng")).to.equal("90");
    });
});

describe("createPieChart for a doughnut", () => {
    const doughnut: DoughnutChartOptions = {
        type: "doughnut",
        categories: ["A", "B"],
        series: [
            { name: "Inner", values: [1, 2] },
            { name: "Outer", values: [3, 4] },
        ],
    };

    it("should write a ring for each series, and a hole of half the chart's diameter", () => {
        const element = parse(create(doughnut).group);

        expect(element.name).to.equal("c:doughnutChart");
        expect(names(element)).to.deep.equal(["c:varyColors", "c:ser", "c:ser", "c:dLbls", "c:firstSliceAng", "c:holeSize"]);
        expect(value(element, "c:holeSize")).to.equal("50");
        expect(value(parse(create({ ...doughnut, holeSize: 75.4 }).group), "c:holeSize")).to.equal("75");
    });

    it("should colour each slice the same in every ring, as the legend shows the categories", () => {
        const [inner, outer] = children(parse(create(doughnut).group), "c:ser");
        expect(JSON.stringify(children(inner, "c:dPt"))).to.equal(JSON.stringify(children(outer, "c:dPt")));
    });

    it("should write labels without a position, as Office does for doughnuts", () => {
        const labels = children(children(parse(create({ ...doughnut, dataLabels: { value: true } }).group), "c:ser")[0], "c:dLbls")[0];
        expect(names(labels)).to.not.include("c:dLblPos");
        expect(value(labels, "c:showLeaderLines")).to.equal("1");
    });
});
