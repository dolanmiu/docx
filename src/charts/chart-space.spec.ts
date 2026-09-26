import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { Relationships } from "@file/relationships";
import { type IContext, PackagePart, type XmlComponent } from "docx";

import { createChartData } from "./chart-data";
import type { ChartRunOptions } from "./chart-options";
import { createChartSpace } from "./chart-space";

const workbook = new PackagePart({
    folder: "embeddings",
    name: "Microsoft_Excel_Worksheet",
    extension: "xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package",
    content: new Uint8Array(),
});

const format = (component: XmlComponent, relationships = new Relationships()): string =>
    xml(
        new Formatter().format(component, {
            file: new File({ sections: [] }),
            viewWrapper: { View: component, Relationships: relationships },
            stack: [],
        } as IContext),
    );

const chartSpace = (options: Partial<ChartRunOptions> = {}): Element => {
    const full = { type: "column", categories: ["A"], series: [{ name: "S", values: [1] }], ...options } as ChartRunOptions;
    return (xml2js(format(createChartSpace(full, createChartData(full), workbook))) as Element).elements![0];
};
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const child = (element: Element, name: string): Element => element.elements!.find((one) => one.name === name)!;
const value = (element: Element, name: string): unknown => child(element, name)?.attributes?.val;

describe("createChartSpace", () => {
    it("should write the chart space in the schema's order, as Word does, without Office's extensions", () => {
        const space = chartSpace();

        expect(space.name).to.equal("c:chartSpace");
        expect(space.attributes).to.deep.equal({
            "xmlns:c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
            "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
            "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
        });
        expect(names(space)).to.deep.equal(["c:date1904", "c:lang", "c:roundedCorners", "c:chart", "c:spPr", "c:txPr", "c:externalData"]);
        expect(value(space, "c:date1904")).to.equal("0");
        expect(value(space, "c:lang")).to.equal("en-US");
        expect(value(space, "c:roundedCorners")).to.equal("0");
    });

    it("should refer to the workbook, which Word doesn't update the chart from when the document is opened", () => {
        const externalData = child(chartSpace(), "c:externalData");

        expect(externalData.attributes).to.deep.equal({ "r:id": workbook.relationshipId });
        expect(names(externalData)).to.deep.equal(["c:autoUpdate"]);
        expect(value(externalData, "c:autoUpdate")).to.equal("0");
    });

    it("should write a chart without a title, with a legend below, plotting only what's visible and leaving gaps", () => {
        const chart = child(chartSpace(), "c:chart");

        expect(names(chart)).to.deep.equal(["c:autoTitleDeleted", "c:plotArea", "c:legend", "c:plotVisOnly", "c:dispBlanksAs"]);
        // Otherwise Office may use a single series' name as the title
        expect(value(chart, "c:autoTitleDeleted")).to.equal("1");
        expect(value(chart, "c:plotVisOnly")).to.equal("1");
        expect(value(chart, "c:dispBlanksAs")).to.equal("gap");
        expect(names(child(chart, "c:legend"))).to.deep.equal(["c:legendPos", "c:overlay", "c:spPr", "c:txPr"]);
        expect(value(child(chart, "c:legend"), "c:legendPos")).to.equal("b");
        expect(value(child(chart, "c:legend"), "c:overlay")).to.equal("0");
        // Its text isn't turned, where an axis' labels have Office's automatic rotation
        expect(child(child(child(chart, "c:legend"), "c:txPr"), "a:bodyPr").attributes!.rot).to.equal("0");
    });

    it("should write a title, and no legend or a legend where it is asked for", () => {
        const chart = child(chartSpace({ title: "Sales", legend: false }), "c:chart");
        expect(names(chart)).to.deep.equal(["c:title", "c:autoTitleDeleted", "c:plotArea", "c:plotVisOnly", "c:dispBlanksAs"]);
        expect(value(chart, "c:autoTitleDeleted")).to.equal("0");

        const positions = { top: "t", bottom: "b", left: "l", right: "r", topRight: "tr" } as const;
        for (const [position, ooxml] of Object.entries(positions)) {
            const legend = child(child(chartSpace({ legend: { position: position as keyof typeof positions } }), "c:chart"), "c:legend");
            expect(value(legend, "c:legendPos")).to.equal(ooxml);
        }
        expect(value(child(child(chartSpace({ legend: {} }), "c:chart"), "c:legend"), "c:legendPos")).to.equal("b");
    });

    it("should write the legend's font over the chart's, and the chart's font on the title", () => {
        const full: ChartRunOptions = {
            type: "pie",
            categories: ["A"],
            series: [{ name: "S", values: [1] }],
            title: { text: "Sales", font: { size: 20 } },
            font: { name: "Arial", color: "333333" },
            legend: { position: "right", font: { size: 11 } },
        };
        const written = format(createChartSpace(full, createChartData(full), workbook));
        const fonts = '<a:solidFill><a:srgbClr val="333333"/></a:solidFill><a:latin typeface="Arial"/>';

        expect(written).to.contain(`<a:defRPr sz="2000" b="0" i="0" u="none" strike="noStrike" kern="1200" spc="0" baseline="0">${fonts}`);
        expect(written).to.contain(`<c:legend><c:legendPos val="r"/>`);
        expect(written).to.contain(`<a:defRPr sz="1100" b="0" i="0" u="none" strike="noStrike" kern="1200" baseline="0">${fonts}`);
    });

    it("should fill and border the chart area as asked", () => {
        const area = child(chartSpace({ chartArea: { fill: "none", border: "none" } }), "c:spPr");
        expect(names(area)).to.deep.equal(["a:noFill", "a:ln", "a:effectLst"]);
        expect(names(child(area, "a:ln"))).to.deep.equal(["a:noFill"]);
    });

    it("should add the workbook to the package, with a relationship from the chart, when it is written", () => {
        const relationships = new Relationships();
        const full: ChartRunOptions = { type: "pie", categories: ["A"], series: [{ name: "S", values: [1] }] };
        format(createChartSpace(full, createChartData(full), workbook), relationships);

        expect(relationships.RelationshipCount).to.equal(1);
    });
});
