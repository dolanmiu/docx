import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import type { XmlComponent } from "docx";

import { createGroupDataLabels, createSeriesDataLabels } from "./data-labels";

const parse = (component: XmlComponent): Element => (xml2js(xml(new Formatter().format(component))) as Element).elements![0];
const names = (element: Element): readonly string[] => (element.elements ?? []).map(({ name }) => name!);
const values = (element: Element): Readonly<Record<string, unknown>> =>
    Object.fromEntries(
        (element.elements ?? [])
            .filter(({ attributes }) => attributes?.val !== undefined)
            .map(({ name, attributes }) => [name, attributes!.val]),
    );

describe("createSeriesDataLabels", () => {
    it("should write no labels when they show nothing", () => {
        expect(createSeriesDataLabels(undefined, { position: "outEnd" })).to.deep.equal([]);
        expect(createSeriesDataLabels({}, {})).to.deep.equal([]);
        expect(createSeriesDataLabels({ value: false, category: false }, {})).to.deep.equal([]);
    });

    it("should write labels in the schema's order, with every flag, at the position given", () => {
        const [labels] = createSeriesDataLabels({ value: true, seriesName: true }, { position: "outEnd" }).map(parse);

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
        const [labels] = createSeriesDataLabels({ category: true, percentage: true }, { leaderLines: true }).map(parse);

        expect(names(labels)).to.not.include("c:dLblPos");
        expect(values(labels)).to.include({ "c:showCatName": "1", "c:showPercent": "1", "c:showLeaderLines": "1" });
        expect(names(labels).at(-1)).to.equal("c:showLeaderLines");
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
