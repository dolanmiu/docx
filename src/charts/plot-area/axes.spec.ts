// cspell:ignore cmpd
import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { CATEGORY_AXIS_ID, VALUE_AXIS_ID, createCategoryAxis, createValueAxis } from "./axes";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const child = (element: Element, name: string): Element => element.elements!.find((one) => one.name === name)!;
const value = (element: Element, name: string): unknown => child(element, name)?.attributes?.val;

const CATEGORY = { id: CATEGORY_AXIS_ID, crossAxisId: VALUE_AXIS_ID, position: "b" } as const;
const VALUE = { id: VALUE_AXIS_ID, crossAxisId: CATEGORY_AXIS_ID, position: "l", crossBetween: "between" } as const;

describe("createCategoryAxis", () => {
    it("should write the axis in the schema's order, as Word does, with a line and no gridlines", () => {
        const axis = parse(createCategoryAxis(CATEGORY));

        expect(names(axis)).to.deep.equal([
            "c:axId",
            "c:scaling",
            "c:delete",
            "c:axPos",
            "c:numFmt",
            "c:majorTickMark",
            "c:minorTickMark",
            "c:tickLblPos",
            "c:spPr",
            "c:txPr",
            "c:crossAx",
            "c:crosses",
            "c:auto",
            "c:lblAlgn",
            "c:lblOffset",
            "c:noMultiLvlLbl",
        ]);
        expect(value(axis, "c:axId")).to.equal("1");
        expect(value(axis, "c:crossAx")).to.equal("2");
        expect(value(axis, "c:delete")).to.equal("0");
        expect(value(axis, "c:axPos")).to.equal("b");
        expect(child(axis, "c:numFmt").attributes).to.deep.equal({ formatCode: "General", sourceLinked: "1" });
        expect(value(axis, "c:majorTickMark")).to.equal("none");
        expect(value(axis, "c:crosses")).to.equal("autoZero");
        expect(value(axis, "c:lblOffset")).to.equal("100");
        expect(names(child(child(axis, "c:spPr"), "a:ln"))).to.deep.equal(["a:solidFill", "a:round"]);
    });

    it("should write gridlines and a title when asked, and hide the axis", () => {
        const axis = parse(createCategoryAxis({ ...CATEGORY, position: "l" }, { title: "Month", gridlines: true, visible: false }));

        expect(names(axis).slice(0, 7)).to.deep.equal([
            "c:axId",
            "c:scaling",
            "c:delete",
            "c:axPos",
            "c:majorGridlines",
            "c:title",
            "c:numFmt",
        ]);
        expect(value(axis, "c:delete")).to.equal("1");
        // The title of an axis on the left reads from bottom to top
        expect(xml(new Formatter().format(createCategoryAxis({ ...CATEGORY, position: "l" }, { title: "Month" })))).to.contain(
            'rot="-5400000"',
        );
    });
});

describe("createValueAxis", () => {
    it("should write the axis in the schema's order, as Word does, with gridlines and no line", () => {
        const axis = parse(createValueAxis(VALUE));

        expect(names(axis)).to.deep.equal([
            "c:axId",
            "c:scaling",
            "c:delete",
            "c:axPos",
            "c:majorGridlines",
            "c:numFmt",
            "c:majorTickMark",
            "c:minorTickMark",
            "c:tickLblPos",
            "c:spPr",
            "c:txPr",
            "c:crossAx",
            "c:crosses",
            "c:crossBetween",
        ]);
        expect(value(axis, "c:axPos")).to.equal("l");
        expect(value(axis, "c:crossBetween")).to.equal("between");
        expect(names(child(child(axis, "c:spPr"), "a:ln"))).to.deep.equal(["a:noFill"]);
    });

    it("should write the maximum before the minimum, as the schema orders them, and the interval last", () => {
        const axis = parse(createValueAxis(VALUE, { minimum: -5, maximum: 25.5, interval: 5, gridlines: false, title: "Units" }));

        expect(names(child(axis, "c:scaling"))).to.deep.equal(["c:orientation", "c:max", "c:min"]);
        expect(value(child(axis, "c:scaling"), "c:max")).to.equal("25.5");
        expect(value(child(axis, "c:scaling"), "c:min")).to.equal("-5");
        expect(names(axis)).to.not.include("c:majorGridlines");
        expect(names(axis)).to.include("c:title");
        expect(names(axis).at(-1)).to.equal("c:majorUnit");
        expect(value(axis, "c:majorUnit")).to.equal("5");
    });

    it("should write a number format as given, not linked to the data", () => {
        expect(child(parse(createValueAxis(VALUE, { numberFormat: "#,##0" })), "c:numFmt").attributes).to.deep.equal({
            formatCode: "#,##0",
            sourceLinked: "0",
        });
    });

    it("should write a 100% stacked chart's range and interval as fractions, labelled as percentages", () => {
        const axis = parse(createValueAxis({ ...VALUE, percent: true }, { minimum: 0, maximum: 50, interval: 10 }));

        expect(child(axis, "c:numFmt").attributes).to.deep.equal({ formatCode: "0%", sourceLinked: "1" });
        expect(value(child(axis, "c:scaling"), "c:max")).to.equal("0.5");
        expect(value(child(axis, "c:scaling"), "c:min")).to.equal("0");
        expect(value(axis, "c:majorUnit")).to.equal("0.1");
        expect(child(parse(createValueAxis({ ...VALUE, percent: true }, { numberFormat: "0.0%" })), "c:numFmt").attributes).to.deep.equal({
            formatCode: "0.0%",
            sourceLinked: "0",
        });
    });

    it("should give a scatter chart's axis a line, and cross at the data", () => {
        const axis = parse(createValueAxis({ ...VALUE, crossBetween: "midCat", scatter: true }));

        expect(value(axis, "c:crossBetween")).to.equal("midCat");
        expect(xml(new Formatter().format(createValueAxis({ ...VALUE, crossBetween: "midCat", scatter: true })))).to.contain(
            '<c:spPr><a:noFill/><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="25000"/>',
        );
    });
});
