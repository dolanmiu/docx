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
