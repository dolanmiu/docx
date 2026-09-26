// cspell:ignore cmpd
import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { PRIMARY_AXES, createCategoryAxis, createPointAxes, createValueAxis } from "./axes";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const child = (element: Element, name: string): Element => element.elements!.find((one) => one.name === name)!;
const value = (element: Element, name: string): unknown => child(element, name)?.attributes?.val;

const CATEGORY = { id: PRIMARY_AXES.category, crossAxisId: PRIMARY_AXES.value, position: "b" } as const;
const VALUE = { id: PRIMARY_AXES.value, crossAxisId: PRIMARY_AXES.category, position: "l", crossBetween: "between" } as const;

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

    it("should reverse the order, and write the number format given, not linked to the data", () => {
        const axis = parse(createCategoryAxis(CATEGORY, { reverseOrder: true, numberFormat: "0.0" }));

        expect(value(child(axis, "c:scaling"), "c:orientation")).to.equal("maxMin");
        expect(child(axis, "c:numFmt").attributes).to.deep.equal({ formatCode: "0.0", sourceLinked: "0" });
    });

    it("should cross the other axis where asked: at its minimum, its maximum, or a value, which is a fraction on a 100% chart", () => {
        expect(value(parse(createCategoryAxis(CATEGORY, { crossesAt: "minimum" })), "c:crosses")).to.equal("min");
        expect(value(parse(createCategoryAxis(CATEGORY, { crossesAt: "maximum" })), "c:crosses")).to.equal("max");
        expect(value(parse(createCategoryAxis({ ...CATEGORY, crosses: "maximum" })), "c:crosses")).to.equal("max");
        expect(value(parse(createCategoryAxis({ ...CATEGORY, crosses: "maximum" }, { crossesAt: "auto" })), "c:crosses")).to.equal(
            "autoZero",
        );

        const at = parse(createCategoryAxis(CATEGORY, { crossesAt: 50 }));
        expect(names(at)).to.include("c:crossesAt").and.not.include("c:crosses");
        expect(value(at, "c:crossesAt")).to.equal("50");
        expect(value(parse(createCategoryAxis({ ...CATEGORY, crossesPercent: true }, { crossesAt: 50 })), "c:crossesAt")).to.equal("0.5");
    });

    it("should turn the labels as asked, in 60,000ths of a degree, in the font given over the chart's", () => {
        const written = xml(
            new Formatter().format(
                createCategoryAxis(
                    { ...CATEGORY, font: { name: "Arial", bold: true } },
                    { labelRotation: -45, font: { size: 12, bold: false } },
                ),
            ),
        );

        expect(written).to.contain('<a:bodyPr rot="-2700000"');
        expect(written).to.contain('<a:defRPr sz="1200" b="0" i="0"');
        expect(written).to.contain('<a:latin typeface="Arial"/><a:ea typeface="+mn-ea"/><a:cs typeface="Arial"/>');
        // Office's automatic rotation otherwise
        expect(xml(new Formatter().format(createCategoryAxis(CATEGORY)))).to.contain('<a:bodyPr rot="-60000000"');
    });

    it("should write a date axis for dates, spaced by their unit and labelled in their format", () => {
        const axis = parse(createCategoryAxis(CATEGORY, {}, { unit: "months", format: "mmm yyyy" }));

        expect(axis.name).to.equal("c:dateAx");
        expect(names(axis).slice(-4)).to.deep.equal(["c:crosses", "c:auto", "c:lblOffset", "c:baseTimeUnit"]);
        expect(value(axis, "c:baseTimeUnit")).to.equal("months");
        expect(child(axis, "c:numFmt").attributes).to.deep.equal({ formatCode: "mmm yyyy", sourceLinked: "1" });
        expect(
            child(parse(createCategoryAxis(CATEGORY, { numberFormat: "yyyy" }, { unit: "days", format: "d mmm yyyy" })), "c:numFmt")
                .attributes,
        ).to.deep.equal({ formatCode: "yyyy", sourceLinked: "0" });
    });

    it("should give a radar chart's category axis gridlines, the spokes, and tick marks", () => {
        const axis = parse(createCategoryAxis({ ...CATEGORY, radar: true }));

        expect(names(axis)).to.include("c:majorGridlines");
        expect(value(axis, "c:majorTickMark")).to.equal("cross");
        expect(names(parse(createCategoryAxis({ ...CATEGORY, radar: true }, { gridlines: false })))).to.not.include("c:majorGridlines");
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

    it("should write a logarithmic scale's base first in the scaling, and reverse the order", () => {
        const scaling = child(parse(createValueAxis(VALUE, { logarithmicBase: 10, reverseOrder: true, minimum: 1 })), "c:scaling");

        expect(names(scaling)).to.deep.equal(["c:logBase", "c:orientation", "c:min"]);
        expect(value(scaling, "c:logBase")).to.equal("10");
        expect(value(scaling, "c:orientation")).to.equal("maxMin");
    });

    it("should write display units last, with their label beside the axis", () => {
        const axis = parse(createValueAxis(VALUE, { displayUnits: "thousands", interval: 1000 }));
        const units = child(axis, "c:dispUnits");

        expect(names(axis).slice(-3)).to.deep.equal(["c:crossBetween", "c:majorUnit", "c:dispUnits"]);
        expect(names(units)).to.deep.equal(["c:builtInUnit", "c:dispUnitsLbl"]);
        expect(value(units, "c:builtInUnit")).to.equal("thousands");
        expect(names(child(units, "c:dispUnitsLbl"))).to.deep.equal(["c:layout", "c:spPr", "c:txPr"]);
        // Upright beside a vertical axis, and level beside a horizontal one
        expect(xml(new Formatter().format(createValueAxis(VALUE, { displayUnits: "millions" })))).to.contain(
            '<c:dispUnits><c:builtInUnit val="millions"/><c:dispUnitsLbl><c:layout/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr><c:txPr><a:bodyPr rot="-5400000"',
        );
        expect(xml(new Formatter().format(createValueAxis({ ...VALUE, position: "b" }, { displayUnits: "millions" })))).to.contain(
            '<c:dispUnitsLbl><c:layout/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr><c:txPr><a:bodyPr rot="0"',
        );
    });

    it("should leave out gridlines when the placement has none, as for a secondary axis, unless asked for", () => {
        expect(names(parse(createValueAxis({ ...VALUE, gridlines: false })))).to.not.include("c:majorGridlines");
        expect(names(parse(createValueAxis({ ...VALUE, gridlines: false }, { gridlines: true })))).to.include("c:majorGridlines");
    });

    it("should give a radar chart's value axis a line and tick marks", () => {
        const written = xml(new Formatter().format(createValueAxis({ ...VALUE, radar: true })));

        expect(written).to.contain('<c:majorTickMark val="cross"/>');
        expect(written).to.contain(
            '<c:spPr><a:noFill/><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="15000"/>',
        );
    });

    it("should give a scatter chart's axis a line, and cross at the data", () => {
        const axis = parse(createValueAxis({ ...VALUE, crossBetween: "midCat", scatter: true }));

        expect(value(axis, "c:crossBetween")).to.equal("midCat");
        expect(xml(new Formatter().format(createValueAxis({ ...VALUE, crossBetween: "midCat", scatter: true })))).to.contain(
            '<c:spPr><a:noFill/><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="25000"/>',
        );
    });
});

describe("createPointAxes", () => {
    it("should write two value axes, x along the bottom and y on the left, crossing each other", () => {
        const axes = createPointAxes({ type: "scatter", series: [], xAxis: { title: "X" }, yAxis: { title: "Y" } }, undefined).map(parse);

        expect(axes.map(({ name }) => name)).to.deep.equal(["c:valAx", "c:valAx"]);
        expect(axes.map((axis) => [value(axis, "c:axId"), value(axis, "c:crossAx"), value(axis, "c:axPos")])).to.deep.equal([
            ["1", "2", "b"],
            ["2", "1", "l"],
        ]);
    });
});
