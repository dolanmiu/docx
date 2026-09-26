import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import type { ChartDataLabelPosition } from "../chart-options";
import { type LabelledShape, createGroupDataLabels, createSeriesDataLabels } from "./data-labels";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const values = (element: Element): Readonly<Record<string, unknown>> =>
    Object.fromEntries(
        (element.elements ?? [])
            .filter(({ attributes }) => attributes?.val !== undefined)
            .map(({ name, attributes }) => [name, attributes!.val]),
    );

const BARS = { shape: "bars", series: "S" } as const;

describe("createSeriesDataLabels", () => {
    it("should write no labels when they show nothing", () => {
        expect(createSeriesDataLabels(undefined, BARS)).to.deep.equal([]);
        expect(createSeriesDataLabels(false, BARS)).to.deep.equal([]);
        expect(createSeriesDataLabels({}, BARS)).to.deep.equal([]);
        expect(createSeriesDataLabels({ value: false, category: false, position: "center" }, BARS)).to.deep.equal([]);
    });

    it("should write labels in the schema's order, with every flag, where Office puts them", () => {
        const [labels] = createSeriesDataLabels({ value: true, seriesName: true }, BARS).map(parse);

        expect(names(labels)).to.deep.equal([
            "c:spPr",
            "c:txPr",
            "c:dLblPos",
            "c:showLegendKey",
            "c:showVal",
            "c:showCatName",
            "c:showSerName",
            "c:showPercent",
            "c:showBubbleSize",
        ]);
        expect(values(labels)).to.deep.equal({
            "c:dLblPos": "outEnd",
            "c:showLegendKey": "0",
            "c:showVal": "1",
            "c:showCatName": "0",
            "c:showSerName": "1",
            "c:showPercent": "0",
            "c:showBubbleSize": "0",
        });
    });

    it("should write labels without a position, with the categories, percentages and leader lines of a pie", () => {
        const [labels] = createSeriesDataLabels(
            { category: true, percentage: true },
            { shape: "doughnut", series: "S", leaderLines: true },
        ).map(parse);

        expect(names(labels)).to.not.include("c:dLblPos");
        expect(values(labels)).to.include({ "c:showCatName": "1", "c:showPercent": "1", "c:showLeaderLines": "1" });
        expect(names(labels).at(-1)).to.equal("c:showLeaderLines");
    });
});

describe("createSeriesDataLabels' positions", () => {
    const position = (shape: LabelledShape, where?: ChartDataLabelPosition): unknown =>
        values(parse(createSeriesDataLabels({ value: true, position: where }, { shape, series: "S" })[0]))["c:dLblPos"];

    it("should put labels where Office does: outside bars, in stacked bars, right of points, and best fit on a pie", () => {
        expect(position("bars")).to.equal("outEnd");
        expect(position("stackedBars")).to.equal("ctr");
        expect(position("line")).to.equal("r");
        expect(position("points")).to.equal("r");
        expect(position("pie")).to.equal("bestFit");
        for (const shape of ["area", "doughnut", "radar"] as const) {
            expect(position(shape)).to.equal(undefined);
        }
    });

    it("should write each position given by its OOXML name", () => {
        expect(
            ["center", "insideEnd", "insideBase", "outsideEnd"].map((where) => position("bars", where as ChartDataLabelPosition)),
        ).to.deep.equal(["ctr", "inEnd", "inBase", "outEnd"]);
        expect(["left", "right", "above", "below"].map((where) => position("line", where as ChartDataLabelPosition))).to.deep.equal([
            "l",
            "r",
            "t",
            "b",
        ]);
        expect(position("pie", "bestFit")).to.equal("bestFit");
    });

    it("should throw for a position the labelled shape can't have, as Office would repair the file", () => {
        expect(() => position("stackedBars", "outsideEnd")).to.throw(
            'Invalid data label position "outsideEnd" for series "S". Labels on stacked bars can be at "center", "insideEnd" or "insideBase"',
        );
        expect(() => position("points", "insideEnd")).to.throw('Labels on points can be at "center", "left", "right", "above" or "below"');
        expect(() => position("pie", "left")).to.throw('Labels on a pie can be at "center", "insideEnd", "outsideEnd" or "bestFit"');
        expect(() => position("line", "bestFit")).to.throw("Labels on a line can be at");
        expect(() => position("area", "center")).to.throw(
            'Invalid data label position "center" for series "S". Labels on an area have no position',
        );
        expect(() => position("doughnut", "center")).to.throw("Labels on a doughnut have no position");
        expect(() => position("radar", "center")).to.throw("Labels on a radar chart have no position");
    });
});

describe("createSeriesDataLabels' formats and fonts", () => {
    it("should write a number format first, not linked to the data", () => {
        const labels = parse(createSeriesDataLabels({ value: true, numberFormat: "0.0%" }, BARS)[0]);

        expect(names(labels)[0]).to.equal("c:numFmt");
        expect(labels.elements![0].attributes).to.deep.equal({ formatCode: "0.0%", sourceLinked: "0" });
    });

    it("should write the labels' font over the chart's, over Office's 9 point grey", () => {
        const written = xml(
            new Formatter().format(
                createSeriesDataLabels(
                    { value: true, font: { color: "FFFFFF", bold: true } },
                    { ...BARS, font: { name: "Arial", size: 11 } },
                )[0],
            ),
        );

        expect(written).to.contain('<a:defRPr sz="1100" b="1" i="0"');
        expect(written).to.contain('<a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:latin typeface="Arial"/>');
    });

    it("should show a bubble's size", () => {
        expect(values(parse(createSeriesDataLabels({ bubbleSize: true }, { shape: "points", series: "S" })[0]))).to.include({
            "c:showBubbleSize": "1",
            "c:showVal": "0",
        });
    });
});

describe("createGroupDataLabels", () => {
    it("should show nothing, as Word writes a chart group's labels", () => {
        const labels = parse(createGroupDataLabels());
        expect(names(labels)).to.deep.equal([
            "c:showLegendKey",
            "c:showVal",
            "c:showCatName",
            "c:showSerName",
            "c:showPercent",
            "c:showBubbleSize",
        ]);
        expect(new Set(Object.values(values(labels)))).to.deep.equal(new Set(["0"]));
        expect(values(parse(createGroupDataLabels(true)))["c:showLeaderLines"]).to.equal("1");
    });
});

describe("createSeriesDataLabels' labels of single points", () => {
    const labelsOf = (
        series: Parameters<typeof createSeriesDataLabels>[0],
        pointLabels: Parameters<typeof createSeriesDataLabels>[1]["pointLabels"],
        shape: LabelledShape = "bars",
    ): Element | undefined => createSeriesDataLabels(series, { shape, series: "S", pointLabels }).map(parse)[0];
    const points = (labels: Element | undefined): readonly Element[] => (labels?.elements ?? []).filter(({ name }) => name === "c:dLbl");

    it("should write a point's label before the series' own, when the series has none, and the series' as showing nothing", () => {
        const labels = labelsOf(undefined, [undefined, { value: true }])!;

        expect(names(labels)).to.deep.equal([
            "c:dLbl",
            "c:showLegendKey",
            "c:showVal",
            "c:showCatName",
            "c:showSerName",
            "c:showPercent",
            "c:showBubbleSize",
        ]);
        expect(new Set(Object.values(values(labels)))).to.deep.equal(new Set(["0"]));
        const [point] = points(labels);
        expect(names(point)).to.deep.equal([
            "c:idx",
            "c:spPr",
            "c:txPr",
            "c:dLblPos",
            "c:showLegendKey",
            "c:showVal",
            "c:showCatName",
            "c:showSerName",
            "c:showPercent",
            "c:showBubbleSize",
        ]);
        expect(values(point)).to.include({ "c:idx": "1", "c:dLblPos": "outEnd", "c:showVal": "1", "c:showCatName": "0" });
    });

    it("should write a point's own text, in 9 point text, showing the value's place, as Office writes a label edited in Word", () => {
        const [point] = points(labelsOf(undefined, [{ text: "Record\nhigh", position: "center" }]));

        expect(names(point)).to.deep.equal([
            "c:idx",
            "c:tx",
            "c:spPr",
            "c:txPr",
            "c:dLblPos",
            "c:showLegendKey",
            "c:showVal",
            "c:showCatName",
            "c:showSerName",
            "c:showPercent",
            "c:showBubbleSize",
        ]);
        expect(values(point)).to.include({ "c:dLblPos": "ctr", "c:showVal": "1" });
        const written = xml(
            new Formatter().format(createSeriesDataLabels(undefined, { ...BARS, pointLabels: [{ text: "Record\nhigh" }] })[0]),
        );
        expect(written).to.contain("<a:t>Record</a:t>");
        expect(written).to.contain("<a:t>high</a:t>");
        expect(written).to.contain('<c:tx><c:rich><a:bodyPr rot="0"');
        expect(written.match(/sz="900"/g)).to.have.length(3);
    });

    it("should write no labels for points without their own, or false, when the series has none", () => {
        expect(labelsOf(undefined, [])).to.equal(undefined);
        expect(labelsOf(undefined, [undefined, false, undefined])).to.equal(undefined);
        expect(labelsOf(false, [false])).to.equal(undefined);
        // A label that says it shows nothing
        expect(labelsOf(undefined, [{ value: false }, { position: "center" }])).to.equal(undefined);
    });

    it("should delete a point's label, for false or a label showing nothing, when the series has labels", () => {
        const labels = labelsOf({ value: true }, [false, undefined, { value: false }])!;
        const [first, third] = points(labels);

        expect(names(first)).to.deep.equal(["c:idx", "c:delete"]);
        expect(values(first)).to.deep.equal({ "c:idx": "0", "c:delete": "1" });
        expect(values(third)).to.deep.equal({ "c:idx": "2", "c:delete": "1" });
        // Then the series' own labels
        expect(values(labels)).to.include({ "c:showVal": "1" });
        expect(names(labels).slice(2)).to.deep.equal([
            "c:spPr",
            "c:txPr",
            "c:dLblPos",
            "c:showLegendKey",
            "c:showVal",
            "c:showCatName",
            "c:showSerName",
            "c:showPercent",
            "c:showBubbleSize",
        ]);
    });

    it("should show what the series' labels show, unless the point's label says, with its own look over the series'", () => {
        const series = { value: true, position: "insideEnd", numberFormat: "#,##0", font: { size: 11 } } as const;
        const [moved, own] = points(
            labelsOf(series, [{ position: "insideBase" }, { category: true, numberFormat: "0.0", font: { bold: true } }]),
        );

        expect(values(moved)).to.include({ "c:dLblPos": "inBase", "c:showVal": "1", "c:showCatName": "0" });
        expect(moved.elements!.find(({ name }) => name === "c:numFmt")!.attributes).to.deep.equal({
            formatCode: "#,##0",
            sourceLinked: "0",
        });
        // Its own flags replace the series', and its own number format and font replace theirs
        expect(values(own)).to.include({ "c:dLblPos": "inEnd", "c:showVal": "0", "c:showCatName": "1" });
        expect(own.elements!.find(({ name }) => name === "c:numFmt")!.attributes!.formatCode).to.equal("0.0");
        const written = xml(
            new Formatter().format(createSeriesDataLabels(series, { ...BARS, pointLabels: [{ font: { bold: true } }] })[0]),
        );
        expect(written).to.contain('<a:defRPr sz="900" b="1"');
    });

    it("should show a slice's percentage, or a bubble's size, of its own", () => {
        expect(values(points(labelsOf(undefined, [{ percentage: true }], "pie"))[0])).to.include({
            "c:showPercent": "1",
            "c:dLblPos": "bestFit",
        });
        expect(values(points(labelsOf(undefined, [undefined, { bubbleSize: true }], "points"))[0])).to.include({
            "c:idx": "1",
            "c:showBubbleSize": "1",
        });
    });

    it("should write leader lines for the series, not its points", () => {
        const labels = createSeriesDataLabels(undefined, {
            shape: "pie",
            series: "S",
            leaderLines: true,
            pointLabels: [{ value: true }],
        }).map(parse)[0];
        expect(names(labels).at(-1)).to.equal("c:showLeaderLines");
        expect(names(points(labels)[0])).to.not.include("c:showLeaderLines");
    });

    it("should throw for a point's position the labelled shape can't have, naming the series", () => {
        expect(() => labelsOf(undefined, [{ value: true, position: "outsideEnd" }], "stackedBars")).to.throw(
            'Invalid data label position "outsideEnd" for series "S". Labels on stacked bars',
        );
        expect(() => labelsOf(undefined, [{ text: "T", position: "center" }], "area")).to.throw("Labels on an area have no position");
        expect(() => labelsOf({ value: true, position: "above" }, [{ text: "T" }], "bars")).to.throw('Invalid data label position "above"');
    });

    it("should keep each label at its point's index, past gaps", () => {
        expect(
            points(labelsOf(undefined, [undefined, undefined, undefined, { value: true }, undefined, { text: "Six" }])).map(
                (point) => values(point)["c:idx"],
            ),
        ).to.deep.equal(["3", "5"]);
    });
});
