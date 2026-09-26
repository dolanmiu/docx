import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import type { ChartTrendline } from "../chart-options";
import { createSeriesColor } from "../chart-style";
import { createTrendlines } from "./trendline";

const write = (component: XmlComponent): string => xml(new Formatter().format(component));
const parse = (component: XmlComponent): Element => (xml2js(write(component)) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const value = (element: Element, name: string): unknown => element.elements!.find((one) => one.name === name)?.attributes?.val;

const trendline = (options: ChartTrendline, font?: { readonly name?: string }): Element =>
    parse(createTrendlines([options], () => createSeriesColor(2), font)[0]);

describe("createTrendlines", () => {
    it("should write none when there are none", () => {
        expect(createTrendlines(undefined, () => createSeriesColor(0), undefined)).to.deep.equal([]);
        expect(createTrendlines([], () => createSeriesColor(0), undefined)).to.deep.equal([]);
    });

    it("should write a linear trendline as Office does, a dotted line in the series' colour, showing no equation", () => {
        const element = trendline({ type: "linear" });

        expect(names(element)).to.deep.equal(["c:spPr", "c:trendlineType", "c:dispRSqr", "c:dispEq"]);
        expect(value(element, "c:trendlineType")).to.equal("linear");
        expect(value(element, "c:dispRSqr")).to.equal("0");
        expect(value(element, "c:dispEq")).to.equal("0");
        expect(write(createTrendlines([{ type: "linear" }], () => createSeriesColor(2), undefined)[0])).to.contain(
            '<c:spPr><a:ln w="19050" cap="rnd"><a:solidFill><a:schemeClr val="accent3"/></a:solidFill><a:prstDash val="sysDot"/><a:round/></a:ln><a:effectLst/></c:spPr>',
        );
    });

    it("should write each type by its OOXML name", () => {
        expect(
            (["linear", "exponential", "logarithmic", "polynomial", "power", "movingAverage"] as const).map((type) =>
                value(trendline({ type }), "c:trendlineType"),
            ),
        ).to.deep.equal(["linear", "exp", "log", "poly", "power", "movingAvg"]);
    });

    it("should write a polynomial's order and a moving average's period, 2 unless given", () => {
        expect(value(trendline({ type: "polynomial" }), "c:order")).to.equal("2");
        expect(value(trendline({ type: "polynomial", order: 4 }), "c:order")).to.equal("4");
        expect(value(trendline({ type: "movingAverage" }), "c:period")).to.equal("2");
        const average = trendline({ type: "movingAverage", period: 5 });
        expect(value(average, "c:period")).to.equal("5");
        expect(names(average)).to.deep.equal(["c:spPr", "c:trendlineType", "c:period", "c:dispRSqr", "c:dispEq"]);
    });

    it("should write its name, forecasts and intercept in the schema's order", () => {
        const element = trendline({
            type: "polynomial",
            order: 3,
            name: "Fit & forecast",
            forecastForward: 2,
            forecastBackward: 0.5,
            intercept: -1.25,
        });

        expect(names(element)).to.deep.equal([
            "c:name",
            "c:spPr",
            "c:trendlineType",
            "c:order",
            "c:forward",
            "c:backward",
            "c:intercept",
            "c:dispRSqr",
            "c:dispEq",
        ]);
        expect(element.elements![0].elements![0].text).to.equal("Fit & forecast");
        expect([value(element, "c:forward"), value(element, "c:backward"), value(element, "c:intercept")]).to.deep.equal([
            "2",
            "0.5",
            "-1.25",
        ]);
        // An intercept of 0 is written
        expect(value(trendline({ type: "linear", intercept: 0 }), "c:intercept")).to.equal("0");
    });

    it("should label its equation and R² value, in 9 point text in General, or its own format and font over the chart's", () => {
        const element = trendline({ type: "linear", equation: true, rSquared: true });
        expect(value(element, "c:dispRSqr")).to.equal("1");
        expect(value(element, "c:dispEq")).to.equal("1");
        const label = element.elements!.at(-1)!;
        expect(label.name).to.equal("c:trendlineLbl");
        expect(names(label)).to.deep.equal(["c:layout", "c:numFmt", "c:spPr", "c:txPr"]);
        expect(label.elements![1].attributes).to.deep.equal({ formatCode: "General", sourceLinked: "0" });

        const written = write(
            createTrendlines(
                [{ type: "linear", rSquared: true, label: { numberFormat: "0.00", font: { bold: true } } }],
                () => createSeriesColor(0),
                { name: "Arial" },
            )[0],
        );
        expect(written).to.contain('<c:numFmt formatCode="0.00" sourceLinked="0"/>');
        expect(written).to.contain('<a:defRPr sz="900" b="1"');
        expect(written).to.contain('<a:latin typeface="Arial"/>');
        expect(names(trendline({ type: "linear", equation: true }))).to.include("c:trendlineLbl");
    });

    it("should draw the line in its own colour, width and dashes", () => {
        const written = write(
            createTrendlines(
                [{ type: "linear", line: { color: "FF0000", width: 3, dash: "solid" } }],
                () => createSeriesColor(0),
                undefined,
            )[0],
        );
        expect(written).to.contain(
            '<a:ln w="38100" cap="rnd"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill><a:prstDash val="solid"/>',
        );
    });

    it("should write a trendline for each given, in order", () => {
        const [first, second] = createTrendlines([{ type: "linear" }, { type: "power" }], () => createSeriesColor(0), undefined).map(parse);
        expect([value(first, "c:trendlineType"), value(second, "c:trendlineType")]).to.deep.equal(["linear", "power"]);
    });
});
