import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createChartData } from "../chart-data";
import type { BubbleChartOptions } from "../chart-options";
import { createBubbleChart } from "./bubble-chart";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const children = (element: Element, name: string): readonly Element[] => element.elements!.filter((one) => one.name === name);
const value = (element: Element, name: string): unknown => children(element, name)[0]?.attributes?.val;

const create = (options: Partial<BubbleChartOptions> = {}): { readonly group: XmlComponent; readonly axes: readonly XmlComponent[] } => {
    const full: BubbleChartOptions = {
        type: "bubble",
        series: [
            {
                name: "A",
                points: [
                    { x: 1, y: 2, size: 10 },
                    { x: 2, y: 3, size: 20 },
                ],
            },
            { name: "B", points: [{ x: 3, y: 1, size: 5 }], color: "FF0000" },
        ],
        ...options,
    };
    const { groups, axes } = createBubbleChart(full, createChartData(full), undefined);
    return { group: groups[0], axes };
};

describe("createBubbleChart", () => {
    it("should write a bubble chart in the schema's order, with Office's scale, and sizes as areas", () => {
        const group = parse(create().group);

        expect(group.name).to.equal("c:bubbleChart");
        expect(names(group)).to.deep.equal([
            "c:varyColors",
            "c:ser",
            "c:ser",
            "c:dLbls",
            "c:bubbleScale",
            "c:showNegBubbles",
            "c:sizeRepresents",
            "c:axId",
            "c:axId",
        ]);
        expect(value(group, "c:bubbleScale")).to.equal("100");
        expect(value(group, "c:showNegBubbles")).to.equal("0");
        expect(value(group, "c:sizeRepresents")).to.equal("area");
    });

    it("should write each series' x values, y values and sizes, as numbers", () => {
        const series = children(parse(create().group), "c:ser")[0];

        expect(names(series)).to.deep.equal([
            "c:idx",
            "c:order",
            "c:tx",
            "c:spPr",
            "c:invertIfNegative",
            "c:xVal",
            "c:yVal",
            "c:bubbleSize",
            "c:bubble3D",
        ]);
        expect(value(series, "c:bubble3D")).to.equal("0");
        const sizes = xml(new Formatter().format(create().group));
        expect(sizes).to.contain(
            '<c:bubbleSize><c:numRef><c:f>Sheet1!$C$2:$C$3</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="2"/><c:pt idx="0"><c:v>10</c:v></c:pt><c:pt idx="1"><c:v>20</c:v></c:pt></c:numCache></c:numRef></c:bubbleSize>',
        );
    });

    it("should fill bubbles with the series' colour at 75% opacity, without a line", () => {
        const written = xml(new Formatter().format(create().group));

        expect(written).to.contain(
            '<c:spPr><a:solidFill><a:schemeClr val="accent1"><a:alpha val="75000"/></a:schemeClr></a:solidFill><a:ln><a:noFill/></a:ln><a:effectLst/></c:spPr>',
        );
        expect(written).to.contain('<a:solidFill><a:srgbClr val="FF0000"><a:alpha val="75000"/></a:srgbClr></a:solidFill>');
    });

    it("should write the scale and what a size represents as given", () => {
        const group = parse(create({ bubbleScale: 49.6, sizeRepresents: "width" }).group);

        expect(value(group, "c:bubbleScale")).to.equal("50");
        expect(value(group, "c:sizeRepresents")).to.equal("w");
    });

    it("should put labels to the right of the bubbles, showing their sizes if asked", () => {
        const labels = children(children(parse(create({ dataLabels: { bubbleSize: true } }).group), "c:ser")[0], "c:dLbls")[0];

        expect(value(labels, "c:dLblPos")).to.equal("r");
        expect(value(labels, "c:showBubbleSize")).to.equal("1");
    });

    it("should write two value axes", () => {
        expect(
            create()
                .axes.map(parse)
                .map(({ name }) => name),
        ).to.deep.equal(["c:valAx", "c:valAx"]);
    });
});
