// cspell:ignore cmpd cust
import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import type { ChartErrorData } from "../chart-data";
import type { ChartErrorBars } from "../chart-options";
import { createErrorBars } from "./error-bars";

const write = (component: XmlComponent): string => xml(new Formatter().format(component));
const parse = (component: XmlComponent): Element => (xml2js(write(component)) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const value = (element: Element, name: string): unknown => element.elements!.find((one) => one.name === name)?.attributes?.val;

const errorBars = (options: ChartErrorBars, direction: "x" | "y" = "y", data?: ChartErrorData): Element =>
    parse(createErrorBars(options, direction, data)[0]);

const amounts: ChartErrorData = {
    plus: { type: "number", formula: "Sheet1!$E$2:$E$3", points: [1, undefined] },
    minus: { type: "number", formula: "Sheet1!$F$2:$F$3", points: [0.5, 2] },
};

describe("createErrorBars", () => {
    it("should write none when there are none", () => {
        expect(createErrorBars(undefined, "y", undefined)).to.deep.equal([]);
    });

    it("should write fixed error bars as Office does, both ways with end caps, in dark grey", () => {
        const element = errorBars({ type: "fixed", value: 2.5 });

        expect(names(element)).to.deep.equal(["c:errDir", "c:errBarType", "c:errValType", "c:noEndCap", "c:val", "c:spPr"]);
        expect([value(element, "c:errDir"), value(element, "c:errBarType"), value(element, "c:errValType")]).to.deep.equal([
            "y",
            "both",
            "fixedVal",
        ]);
        expect(value(element, "c:noEndCap")).to.equal("0");
        expect(value(element, "c:val")).to.equal("2.5");
        expect(write(createErrorBars({ type: "fixed", value: 1 }, "y", undefined)[0])).to.contain(
            '<c:spPr><a:noFill/><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="65000"/><a:lumOff val="35000"/></a:schemeClr></a:solidFill><a:round/></a:ln><a:effectLst/></c:spPr>',
        );
    });

    it("should write each type by its OOXML name, a standard deviation's 1 unless given, and no amount for the standard error", () => {
        expect(value(errorBars({ type: "percentage", value: 5 }), "c:errValType")).to.equal("percentage");
        const deviation = errorBars({ type: "standardDeviation" });
        expect([value(deviation, "c:errValType"), value(deviation, "c:val")]).to.deep.equal(["stdDev", "1"]);
        expect(value(errorBars({ type: "standardDeviation", value: 2 }), "c:val")).to.equal("2");
        const error = errorBars({ type: "standardError" });
        expect(value(error, "c:errValType")).to.equal("stdErr");
        expect(names(error)).to.not.include("c:val");
        expect(value(errorBars({ type: "fixed", value: 0 }), "c:val")).to.equal("0");
    });

    it("should go one way, without end caps, in their own line, along the x axis", () => {
        const element = errorBars({ type: "percentage", value: 10, direction: "minus", endCaps: false }, "x");
        expect([value(element, "c:errDir"), value(element, "c:errBarType"), value(element, "c:noEndCap")]).to.deep.equal([
            "x",
            "minus",
            "1",
        ]);
        expect(value(errorBars({ type: "fixed", value: 1, direction: "plus" }), "c:errBarType")).to.equal("plus");
        expect(
            write(createErrorBars({ type: "standardError", line: { color: "FF0000", width: 1.5, dash: "dash" } }, "y", undefined)[0]),
        ).to.contain(
            '<a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill><a:prstDash val="dash"/><a:round/></a:ln>',
        );
    });

    it("should refer custom error bars to their amounts' cells, both ways, with their caches", () => {
        const element = errorBars({ type: "custom", plus: [1, null], minus: [0.5, 2] }, "y", amounts);

        expect(names(element)).to.deep.equal(["c:errDir", "c:errBarType", "c:errValType", "c:noEndCap", "c:plus", "c:minus", "c:spPr"]);
        expect([value(element, "c:errBarType"), value(element, "c:errValType")]).to.deep.equal(["both", "cust"]);
        const written = write(createErrorBars({ type: "custom", plus: [1, null], minus: [0.5, 2] }, "y", amounts)[0]);
        expect(written).to.contain(
            '<c:plus><c:numRef><c:f>Sheet1!$E$2:$E$3</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="2"/><c:pt idx="0"><c:v>1</c:v></c:pt></c:numCache></c:numRef></c:plus>',
        );
        expect(written).to.contain("<c:minus><c:numRef><c:f>Sheet1!$F$2:$F$3</c:f>");
    });

    it("should go the ways a custom error bar's amounts are given", () => {
        const plus = errorBars({ type: "custom", plus: [1] }, "y", { plus: amounts.plus });
        expect(value(plus, "c:errBarType")).to.equal("plus");
        expect(names(plus)).to.not.include("c:minus");
        const minus = errorBars({ type: "custom", minus: [1] }, "x", { minus: amounts.minus });
        expect([value(minus, "c:errBarType"), value(minus, "c:errDir")]).to.deep.equal(["minus", "x"]);
        expect(names(minus)).to.not.include("c:plus");
    });
});
