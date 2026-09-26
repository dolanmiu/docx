// cspell:ignore cmpd
import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { StockChartOptions } from "../chart-options";
import { createStockChart } from "./stock-chart";

const write = (component: XmlComponent): string => xml(new Formatter().format(component));
const parse = (component: XmlComponent): Element => (xml2js(write(component)) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;
const text = (element: Element): string => element.elements?.[0]?.text?.toString() ?? "";

const components = (
    options: Partial<StockChartOptions>,
): { readonly groups: readonly XmlComponent[]; readonly axes: readonly XmlComponent[] } => {
    const full: StockChartOptions = {
        type: "stock",
        categories: ["Mon", "Tue", "Wed"],
        high: [12, 13, 14],
        low: [10, 11, 12],
        close: [11, 12, 13],
        ...options,
    };
    return createStockChart(full, createChartData(full), undefined);
};

const create = (options: Partial<StockChartOptions> = {}): { readonly groups: readonly Element[]; readonly axes: readonly Element[] } => {
    const { groups, axes } = components(options);
    return { groups: groups.map(parse), axes: axes.map(parse) };
};

// The stock chart group's XML, or with volumes, the axis at an index
const written = (options: Partial<StockChartOptions> = {}, axis?: number): string => {
    const { groups, axes } = components(options);
    return write(axis === undefined ? groups[groups.length - 1] : axes[axis]);
};

describe("createStockChart", () => {
    it("should write a high-low-close chart's prices without lines or markers, joined by high-low lines, the close a dash", () => {
        const { groups, axes } = create();
        const [stock] = groups;

        expect(groups).to.have.length(1);
        expect(stock.name).to.equal("c:stockChart");
        expect(names(stock)).to.deep.equal(["c:ser", "c:ser", "c:ser", "c:dLbls", "c:hiLowLines", "c:axId", "c:axId"]);
        const series = children(stock, "c:ser");
        expect(series.map((one) => value(one, "c:idx"))).to.deep.equal(["0", "1", "2"]);
        expect(names(series[0])).to.deep.equal(["c:idx", "c:order", "c:tx", "c:spPr", "c:marker", "c:cat", "c:val", "c:smooth"]);
        expect(series.map((one) => value(children(one, "c:marker")[0], "c:symbol"))).to.deep.equal(["none", "none", "dash"]);
        expect(value(children(series[2], "c:marker")[0], "c:size")).to.equal("7");
        expect(written()).to.contain(
            '<c:spPr><a:ln w="19050" cap="rnd"><a:noFill/><a:round/></a:ln><a:effectLst/></c:spPr><c:marker><c:symbol val="none"/></c:marker>',
        );
        expect(children(stock, "c:axId").map((one) => one.attributes!.val)).to.deep.equal(["1", "2"]);
        expect(axes.map(({ name }) => name)).to.deep.equal(["c:catAx", "c:valAx"]);
    });

    it("should draw the high-low lines thin and dark grey, or as given", () => {
        expect(written()).to.contain(
            '<c:hiLowLines><c:spPr><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="75000"/><a:lumOff val="25000"/></a:schemeClr></a:solidFill><a:round/></a:ln><a:effectLst/></c:spPr></c:hiLowLines>',
        );
        expect(written({ highLowLines: { color: "0000FF", width: 2 } })).to.contain(
            '<c:hiLowLines><c:spPr><a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="0000FF"/>',
        );
    });

    it("should draw bars from each open to each close, white rising and grey falling, with no close dash", () => {
        const { groups } = create({ open: [10.5, 12.5, 12] });
        const [stock] = groups;

        expect(names(stock)).to.deep.equal([
            "c:ser",
            "c:ser",
            "c:ser",
            "c:ser",
            "c:dLbls",
            "c:hiLowLines",
            "c:upDownBars",
            "c:axId",
            "c:axId",
        ]);
        expect(children(stock, "c:ser").map((one) => value(children(one, "c:marker")[0], "c:symbol"))).to.deep.equal([
            "none",
            "none",
            "none",
            "none",
        ]);
        const bars = children(stock, "c:upDownBars")[0];
        expect(names(bars)).to.deep.equal(["c:gapWidth", "c:upBars", "c:downBars"]);
        expect(value(bars, "c:gapWidth")).to.equal("150");
        const bothBars = written({ open: [10.5, 12.5, 12] });
        expect(bothBars).to.contain('<c:upBars><c:spPr><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:ln w="9525"');
        expect(bothBars).to.contain(
            '<c:downBars><c:spPr><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="65000"/><a:lumOff val="35000"/></a:schemeClr></a:solidFill>',
        );
    });

    it("should fill and border the up and down bars as given", () => {
        const bars = written({
            open: [10.5, 12.5, 12],
            upBars: { fill: "00B050", border: "none" },
            downBars: { fill: "none", border: { color: "FF0000" } },
        });
        expect(bars).to.contain('<c:upBars><c:spPr><a:solidFill><a:srgbClr val="00B050"/></a:solidFill><a:ln><a:noFill/></a:ln>');
        expect(bars).to.contain(
            '<c:downBars><c:spPr><a:noFill/><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="FF0000"/>',
        );
    });

    it("should draw volumes as columns against the primary axes, and the prices against the secondary axes on the right", () => {
        const { groups, axes } = create({ volume: [100, 200, 150], open: [10.5, 12.5, 12] });
        const [volume, stock] = groups;

        expect(volume.name).to.equal("c:barChart");
        expect(value(volume, "c:barDir")).to.equal("col");
        expect(children(volume, "c:ser")).to.have.length(1);
        expect(value(children(volume, "c:ser")[0], "c:idx")).to.equal("0");
        expect(children(volume, "c:axId").map((one) => one.attributes!.val)).to.deep.equal(["1", "2"]);
        expect(children(stock, "c:ser").map((one) => value(one, "c:idx"))).to.deep.equal(["1", "2", "3", "4"]);
        expect(children(stock, "c:axId").map((one) => one.attributes!.val)).to.deep.equal(["3", "4"]);

        expect(axes.map(({ name }) => name)).to.deep.equal(["c:catAx", "c:valAx", "c:valAx", "c:catAx"]);
        const [, volumes, prices, hidden] = axes;
        expect([value(volumes, "c:axPos"), value(prices, "c:axPos")]).to.deep.equal(["l", "r"]);
        expect(value(prices, "c:crosses")).to.equal("max");
        expect(names(prices)).to.not.include("c:majorGridlines");
        expect(names(volumes)).to.include("c:majorGridlines");
        expect(value(hidden, "c:delete")).to.equal("1");
    });

    it("should give the volume and price axes their own options", () => {
        const { axes } = create({
            volume: [1, 2, 3],
            valueAxis: { title: "Price" },
            volumeAxis: { maximum: 50 },
            categoryAxis: { reverseOrder: true },
        });
        const [category, volumes, prices, hidden] = axes;

        expect(written({ volume: [1, 2, 3], valueAxis: { title: "Price" } }, 2)).to.contain("<a:t>Price</a:t>");
        expect(value(children(volumes, "c:scaling")[0], "c:max")).to.equal("50");
        expect(names(prices)).to.include("c:title");
        // Reversed categories put the prices' axis on the first category's side, as the secondary axis' is
        expect(value(children(category, "c:scaling")[0], "c:orientation")).to.equal("maxMin");
        expect(value(children(hidden, "c:scaling")[0], "c:orientation")).to.equal("maxMin");
        expect(value(prices, "c:crosses")).to.equal("min");
    });

    it("should put dates on a text axis in their format, spaced evenly, rather than on a date axis", () => {
        const { axes } = create({
            categories: [new Date("2025-01-06"), new Date("2025-01-07"), new Date("2025-01-10")],
            volume: [1, 2, 3],
        });
        const [category, , , hidden] = axes;

        for (const axis of [category, hidden]) {
            expect(axis.name).to.equal("c:catAx");
            expect(children(axis, "c:numFmt")[0].attributes).to.deep.equal({ formatCode: "d mmm yyyy", sourceLinked: "1" });
            expect(value(axis, "c:auto")).to.equal("0");
            expect(names(axis)).to.not.include("c:baseTimeUnit");
        }
        const { axes: plain } = create();
        expect(value(plain[0], "c:auto")).to.equal("1");
    });

    it("should refer each price to its own column, and name each series", () => {
        const [stock] = create({ names: { high: "Max" } }).groups;
        const tx = children(stock, "c:ser").map((one) => children(one, "c:tx")[0].elements![0]);
        expect(tx.map((reference) => text(reference.elements![0]))).to.deep.equal(["Sheet1!$B$1", "Sheet1!$C$1", "Sheet1!$D$1"]);
        expect(written({ names: { high: "Max" } })).to.contain("<c:v>Max</c:v>");
    });
});
