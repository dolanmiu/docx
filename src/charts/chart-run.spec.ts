import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import * as convenienceFunctions from "@util/convenience-functions";
import { Run } from "docx";

import type { ChartRunOptions } from "./chart-options";
import { ChartRun } from "./chart-run";

const column: ChartRunOptions = { type: "column", categories: ["A", "B"], series: [{ name: "S", values: [1, 2] }] };

const format = (run: ChartRun, file = new File({ sections: [] })): Record<string, unknown> =>
    new Formatter().format(run, { file, viewWrapper: file.Document, stack: [] }) as Record<string, unknown>;

// The first element with a name, anywhere in a formatted tree
const find = (tree: unknown, name: string): unknown => {
    if (Array.isArray(tree)) {
        return tree.map((item) => find(item, name)).find((found) => found !== undefined);
    }
    if (tree && typeof tree === "object") {
        const record = tree as Record<string, unknown>;
        return name in record ? record[name] : find(Object.values(record), name);
    }
    return undefined;
};

describe("ChartRun", () => {
    beforeEach(() => {
        vi.spyOn(convenienceFunctions, "docPropertiesUniqueNumericId").mockReturnValue(1);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should be a run from docx", () => {
        expect(new ChartRun(column)).to.be.instanceOf(Run);
    });

    it("should draw the chart inline, at the size Word inserts one, without locking its aspect ratio", () => {
        const tree = format(new ChartRun(column));

        expect(find(tree, "wp:inline")).to.not.equal(undefined);
        // 576 by 336 pixels, 6 by 3.5 inches
        expect(find(tree, "wp:extent")).to.deep.equal({ _attr: { cx: 5486400, cy: 3200400 } });
        expect(find(tree, "wp:cNvGraphicFramePr")).to.deep.equal({});
        expect(find(tree, "a:graphicData")).to.deep.equal([
            { _attr: { uri: "http://schemas.openxmlformats.org/drawingml/2006/chart" } },
            {
                "c:chart": {
                    _attr: {
                        "xmlns:c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
                        "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                        "r:id": (find(tree, "c:chart") as { readonly _attr: { readonly "r:id": string } })._attr["r:id"],
                    },
                },
            },
        ]);
        expect((find(tree, "c:chart") as { readonly _attr: { readonly "r:id": string } })._attr["r:id"]).to.match(/^rId/);
    });

    it("should add the chart to the package, with a relationship from the part it is in, when it is written", () => {
        const file = new File({ sections: [] });
        const tree = format(new ChartRun(column), file);
        const id = (find(tree, "c:chart") as { readonly _attr: { readonly "r:id": string } })._attr["r:id"];

        expect(file.PackageParts.Array.map(({ path }) => path)).to.deep.equal(["charts/chart1.xml"]);
        expect(JSON.stringify(new Formatter().format(file.Document.Relationships))).to.contain(
            `{"Relationship":{"_attr":{"Id":"${id}","Type":"http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart","Target":"charts/chart1.xml"}}}`,
        );
    });

    it("should draw the chart at the size given, floating, with alternative text", () => {
        const tree = format(
            new ChartRun({
                ...column,
                transformation: { width: 300, height: 200 },
                floating: { horizontalPosition: { offset: 914400 }, verticalPosition: { offset: 0 } },
                altText: { name: "Sales", description: "Sales by month", title: "Sales chart" },
            }),
        );

        expect(find(tree, "wp:inline")).to.equal(undefined);
        expect(find(tree, "wp:anchor")).to.not.equal(undefined);
        expect(find(tree, "wp:extent")).to.deep.equal({ _attr: { cx: 2857500, cy: 1905000 } });
        expect(find(tree, "wp:docPr")).to.deep.equal({ _attr: { id: 1, name: "Sales", descr: "Sales by month", title: "Sales chart" } });
        expect(find(tree, "wp:cNvGraphicFramePr")).to.deep.equal({});
    });

    it("should describe the chart for screen readers when its alternative text has no description", () => {
        expect(find(format(new ChartRun(column)), "wp:docPr")).to.deep.equal({
            _attr: { id: 1, name: "", descr: "Column chart. S: A 1, B 2.", title: "" },
        });
        expect(find(format(new ChartRun({ ...column, altText: { name: "Chart 1" } })), "wp:docPr")).to.deep.equal({
            _attr: { id: 1, name: "Chart 1", descr: "Column chart. S: A 1, B 2." },
        });
    });

    it("should mark a decorative chart as decorative, without a description", () => {
        const tree = format(new ChartRun({ ...column, decorative: true }));

        expect(JSON.stringify(find(tree, "wp:docPr"))).to.not.contain("Column chart");
        expect(JSON.stringify(tree)).to.contain("adec:decorative");
    });

    it("should throw where it is made when an option is wrong", () => {
        expect(() => new ChartRun({ ...column, series: [] })).to.throw("A chart needs at least one series");
    });

    it("should be written in each chart type", () => {
        const categories = ["A", "B"];
        const series = [{ name: "S", values: [1, 2] }];
        const charts: readonly ChartRunOptions[] = [
            column,
            { type: "bar", categories, series },
            { type: "line", categories, series },
            { type: "area", categories, series },
            { type: "pie", categories, series },
            { type: "doughnut", categories, series },
            { type: "radar", categories, series },
            { type: "scatter", series: [{ name: "S", points: [{ x: 1, y: 1 }] }] },
            { type: "bubble", series: [{ name: "S", points: [{ x: 1, y: 1, size: 1 }] }] },
        ];
        for (const options of charts) {
            expect(find(format(new ChartRun(options)), "c:chart")).to.not.equal(undefined);
        }
    });
});
