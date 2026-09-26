// cspell:ignore cmpd cust
import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { BarOfPieChartOptions, DoughnutChartOptions, PieChartOptions, PieOfPieChartOptions } from "../chart-options";
import { createPieChart } from "./pie-chart";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;

const create = (
    options: PieChartOptions | DoughnutChartOptions | PieOfPieChartOptions | BarOfPieChartOptions,
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

describe("createPieChart's pulled-out slices and labels of single slices", () => {
    it("should pull out every slice by one amount, after the series' name", () => {
        const series = children(
            parse(create({ ...pie, series: [{ name: "Share", values: [3, 2, 1], explosion: 12.6 }] }).group),
            "c:ser",
        )[0];

        expect(names(series).slice(0, 5)).to.deep.equal(["c:idx", "c:order", "c:tx", "c:explosion", "c:dPt"]);
        expect(value(series, "c:explosion")).to.equal("13");
        expect(children(series, "c:dPt").map((point) => names(point))).to.deep.equal([
            ["c:idx", "c:bubble3D", "c:spPr"],
            ["c:idx", "c:bubble3D", "c:spPr"],
            ["c:idx", "c:bubble3D", "c:spPr"],
        ]);
    });

    it("should pull out slices by their own amounts, in their data points, in the schema's order", () => {
        const series = children(
            parse(create({ ...pie, series: [{ name: "Share", values: [3, 2, 1], explosion: [undefined, 0, 25] }] }).group),
            "c:ser",
        )[0];
        const points = children(series, "c:dPt");

        expect(names(series)).to.not.include("c:explosion");
        expect(names(points[0])).to.deep.equal(["c:idx", "c:bubble3D", "c:spPr"]);
        expect(names(points[1])).to.deep.equal(["c:idx", "c:bubble3D", "c:explosion", "c:spPr"]);
        expect([value(points[1], "c:explosion"), value(points[2], "c:explosion")]).to.deep.equal(["0", "25"]);
    });

    it("should write the labels of single slices in the series' labels", () => {
        const series = children(
            parse(create({ ...pie, series: [{ name: "Share", values: [3, 2, 1], pointLabels: [undefined, { percentage: true }] }] }).group),
            "c:ser",
        )[0];
        const labels = children(series, "c:dLbls")[0];

        expect(names(labels)[0]).to.equal("c:dLbl");
        expect(value(children(labels, "c:dLbl")[0], "c:idx")).to.equal("1");
        expect(value(labels, "c:showLeaderLines")).to.equal("1");
    });
});

describe("createPieChart for a pie of pie or bar of pie chart", () => {
    const categories = ["A", "B", "C", "D", "E", "F", "G"];
    const split = (options: Partial<PieOfPieChartOptions> = {}): Element =>
        parse(create({ type: "pieOfPie", categories, series: [{ name: "S", values: [7, 6, 5, 4, 3, 2, 1] }], ...options }).group);

    it("should write a pie of pie in the schema's order, splitting off the last third of the categories, rounded up", () => {
        const element = split();

        expect(element.name).to.equal("c:ofPieChart");
        expect(names(element)).to.deep.equal([
            "c:ofPieType",
            "c:varyColors",
            "c:ser",
            "c:dLbls",
            "c:gapWidth",
            "c:splitType",
            "c:splitPos",
            "c:secondPieSize",
            "c:serLines",
        ]);
        expect(value(element, "c:ofPieType")).to.equal("pie");
        expect(value(element, "c:varyColors")).to.equal("1");
        expect(value(element, "c:gapWidth")).to.equal("100");
        expect(value(element, "c:splitType")).to.equal("pos");
        expect(value(element, "c:splitPos")).to.equal("3");
        expect(value(element, "c:secondPieSize")).to.equal("75");
        expect(children(children(element, "c:ser")[0], "c:dPt")).to.have.length(7);
    });

    it("should split off at least one category", () => {
        expect(value(split({ categories: ["A"], series: [{ name: "S", values: [1] }] }), "c:splitPos")).to.equal("1");
        expect(value(split({ categories: ["A", "B", "C"], series: [{ name: "S", values: [1] }] }), "c:splitPos")).to.equal("1");
        expect(value(split({ categories: ["A", "B", "C", "D"], series: [{ name: "S", values: [1] }] }), "c:splitPos")).to.equal("2");
    });

    it("should write a bar of pie as the same chart with a bar", () => {
        const element = parse(create({ type: "barOfPie", categories: ["A", "B"], series: [{ name: "S", values: [2, 1] }] }).group);
        expect(element.name).to.equal("c:ofPieChart");
        expect(value(element, "c:ofPieType")).to.equal("bar");
    });

    it("should split by position, value or percentage, as given", () => {
        expect(value(split({ split: { by: "position", count: 5 } }), "c:splitPos")).to.equal("5");
        const byValue = split({ split: { by: "value", lessThan: 4.5 } });
        expect([value(byValue, "c:splitType"), value(byValue, "c:splitPos")]).to.deep.equal(["val", "4.5"]);
        const byPercentage = split({ split: { by: "percentage", lessThan: 10 } });
        expect([value(byPercentage, "c:splitType"), value(byPercentage, "c:splitPos")]).to.deep.equal(["percent", "10"]);
    });

    it("should split off the categories given, by their indexes, in order, and every category of the same name", () => {
        const element = split({
            categories: ["A", "B", "C", 4, "B"],
            series: [{ name: "S", values: [5, 4, 3, 2, 1] }],
            split: { by: "categories", categories: ["4", "B"] },
        });

        expect(names(element)).to.deep.equal([
            "c:ofPieType",
            "c:varyColors",
            "c:ser",
            "c:dLbls",
            "c:gapWidth",
            "c:splitType",
            "c:custSplit",
            "c:secondPieSize",
            "c:serLines",
        ]);
        expect(value(element, "c:splitType")).to.equal("cust");
        expect(children(children(element, "c:custSplit")[0], "c:secondPiePt").map((point) => point.attributes!.val)).to.deep.equal([
            "1",
            "3",
            "4",
        ]);
    });

    it("should size the second plot, set the gap to it, and draw the lines joining them, as given", () => {
        const element = split({ secondPlotSize: 150.4, gapWidth: 250.6 });
        expect([value(element, "c:secondPieSize"), value(element, "c:gapWidth")]).to.deep.equal(["150", "251"]);
        const written = (options: Partial<PieOfPieChartOptions>): string =>
            xml(new Formatter().format(create({ type: "pieOfPie", categories, series: [{ name: "S", values: [1] }], ...options }).group));
        expect(written({})).to.contain(
            '<c:serLines><c:spPr><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="35000"/><a:lumOff val="65000"/></a:schemeClr></a:solidFill><a:round/></a:ln><a:effectLst/></c:spPr></c:serLines>',
        );
        expect(written({ seriesLines: { color: "FF0000", dash: "dash" } })).to.contain(
            '<c:serLines><c:spPr><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill><a:prstDash val="dash"/>',
        );
    });

    it("should put labels where they fit best, with leader lines, as on a pie", () => {
        const labels = children(children(split({ dataLabels: { value: true } }), "c:ser")[0], "c:dLbls")[0];
        expect(value(labels, "c:dLblPos")).to.equal("bestFit");
        expect(value(labels, "c:showLeaderLines")).to.equal("1");
    });
});
