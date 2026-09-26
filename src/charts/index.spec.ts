import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { type Element, xml2js } from "xml-js";

import { Document, Footer, FootnoteReferenceRun, Header, Packer, Paragraph, Run, Table, TableCell, TableRow, TextRun } from "docx";

import { ChartRun, type ChartRunOptions } from ".";

const categories = ["Jan", "Feb", "Mar"];
const series = [
    { name: "2024", values: [4.3, 2.5, 3.5] },
    { name: "2025", values: [2.4, null, 1.8] },
];

// One of each type, with gaps, numbers as categories and a scatter chart's points
const CHARTS: readonly ChartRunOptions[] = [
    { type: "column", title: "Column", categories, series },
    { type: "bar", categories, series, stacking: "stacked" },
    { type: "line", categories: [2024, 2025, 2026], series, markers: true },
    { type: "area", categories, series, stacking: "percent" },
    { type: "pie", categories, series: [{ name: "Share", values: [5, 3, 2] }] },
    { type: "doughnut", categories, series: [series[0], { name: "2025", values: [1, 2] }] },
    {
        type: "scatter",
        series: [
            {
                name: "A",
                points: [
                    { x: 1, y: 2 },
                    { x: 2.5, y: -1 },
                ],
            },
            { name: " B ", points: [{ x: 0.1, y: 1e-7 }] },
        ],
    },
];

const paragraphWith = (options: ChartRunOptions): Paragraph => new Paragraph({ children: [new ChartRun(options)] });

const read = async (zip: JSZip, path: string): Promise<string> => (await zip.file(path)?.async("text")) ?? "";

const parse = (text: string): Element => xml2js(text) as Element;

const descendants = (element: Element, name: string): readonly Element[] =>
    (element.elements ?? []).flatMap((child) => [...(child.name === name ? [child] : []), ...descendants(child, name)]);

const textOf = (element: Element): string => element.elements?.[0]?.text?.toString() ?? "";

// The text or number in each cell of a workbook's sheet, by the cell's name
const readCells = async (workbook: JSZip): Promise<ReadonlyMap<string, string>> => {
    const strings = descendants(parse(await read(workbook, "xl/sharedStrings.xml")), "si").map((si) => textOf(descendants(si, "t")[0]));
    return new Map(
        descendants(parse(await read(workbook, "xl/worksheets/sheet1.xml")), "c").map((cell) => {
            const value = textOf(descendants(cell, "v")[0]);
            return [String(cell.attributes!.r), cell.attributes!.t === "s" ? strings[Number(value)] : value];
        }),
    );
};

// The cells a formula such as Sheet1!$B$2:$B$4 refers to
const cellsOf = (formula: string): readonly string[] => {
    const [, column, first, last] = /^Sheet1!\$([A-Z]+)\$(\d+)(?::\$[A-Z]+\$(\d+))?$/.exec(formula)!;
    return Array.from({ length: Number(last ?? first) - Number(first) + 1 }, (_, index) => `${column}${Number(first) + index}`);
};

describe("docx/charts in a document", () => {
    it("should write each chart and its workbook as parts, with a relationship from the part each chart is in", async () => {
        const doc = new Document({
            sections: [
                {
                    headers: { default: new Header({ children: [paragraphWith(CHARTS[4])] }) },
                    footers: { default: new Footer({ children: [paragraphWith(CHARTS[5])] }) },
                    children: [
                        paragraphWith(CHARTS[0]),
                        // In a table cell, and in a footnote
                        new Table({ rows: [new TableRow({ children: [new TableCell({ children: [paragraphWith(CHARTS[1])] })] })] }),
                        new Paragraph({ children: [new TextRun("Note"), new FootnoteReferenceRun(1)] }),
                    ],
                },
            ],
            footnotes: { 1: { children: [paragraphWith(CHARTS[2])] } },
        });
        const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
        const target = (rels: string): readonly string[] =>
            [...rels.matchAll(/Type="[^"]+\/(chart|package)" Target="([^"]+)"/g)].map(([, type, path]) => `${type} ${path}`);

        // The document is written first, then the footnotes, the headers and the footers
        expect(target(await read(zip, "word/_rels/document.xml.rels"))).to.deep.equal([
            "chart charts/chart1.xml",
            "chart charts/chart2.xml",
        ]);
        expect(target(await read(zip, "word/_rels/footnotes.xml.rels"))).to.deep.equal(["chart charts/chart3.xml"]);
        expect(target(await read(zip, "word/_rels/header1.xml.rels"))).to.deep.equal(["chart charts/chart4.xml"]);
        expect(target(await read(zip, "word/_rels/footer1.xml.rels"))).to.deep.equal(["chart charts/chart5.xml"]);

        for (const chart of [1, 2, 3, 4, 5]) {
            expect(target(await read(zip, `word/charts/_rels/chart${chart}.xml.rels`))).to.deep.equal([
                `package ../embeddings/Microsoft_Excel_Worksheet${chart}.xlsx`,
            ]);
            const contentTypes = await read(zip, "[Content_Types].xml");
            expect(contentTypes).to.contain(
                `<Override ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml" PartName="/word/charts/chart${chart}.xml"/>`,
            );
            expect(contentTypes).to.contain(
                `<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" PartName="/word/embeddings/Microsoft_Excel_Worksheet${chart}.xlsx"/>`,
            );
        }
        expect(Object.keys(zip.files).filter((path) => /^word\/(charts|embeddings)\/[^/]+$/.test(path))).to.have.length(10);
    });

    it("should write workbooks whose cells hold what each chart's caches hold", async () => {
        const doc = new Document({ sections: [{ children: CHARTS.map(paragraphWith) }] });
        const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));

        for (const [index] of CHARTS.entries()) {
            const chart = parse(await read(zip, `word/charts/chart${index + 1}.xml`));
            const workbook = await JSZip.loadAsync(
                (await zip.file(`word/embeddings/Microsoft_Excel_Worksheet${index + 1}.xlsx`)?.async("uint8array"))!,
            );
            const cells = await readCells(workbook);
            const references = [...descendants(chart, "c:strRef"), ...descendants(chart, "c:numRef")];

            // A name, categories and values for each series
            expect(references.length).to.equal(descendants(chart, "c:ser").length * 3);
            for (const reference of references) {
                const names = cellsOf(textOf(descendants(reference, "c:f")[0]));
                const cache = new Map(
                    descendants(reference, "c:pt").map((point) => [Number(point.attributes!.idx), textOf(descendants(point, "c:v")[0])]),
                );

                expect(descendants(reference, "c:ptCount")[0].attributes!.val).to.equal(String(names.length));
                expect(names.map((name) => cells.get(name))).to.deep.equal(names.map((_, point) => cache.get(point)));
            }
        }
    });

    it("should write the same parts when a document is packed twice", async () => {
        const doc = new Document({
            sections: [
                { headers: { default: new Header({ children: [paragraphWith(CHARTS[0])] }) }, children: [paragraphWith(CHARTS[1])] },
            ],
        });
        const paths = async (): Promise<readonly string[]> => Object.keys((await JSZip.loadAsync(await Packer.toBuffer(doc))).files).sort();

        const first = await paths();
        expect(await paths()).to.deep.equal(first);
        const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
        expect((await read(zip, "word/_rels/header1.xml.rels")).match(/relationships\/chart"/g)).to.have.length(1);
        expect((await read(zip, "word/charts/_rels/chart1.xml.rels")).match(/relationships\/package"/g)).to.have.length(1);
        expect((await read(zip, "[Content_Types].xml")).match(/chart1\.xml/g)).to.have.length(1);
    });

    it("should be a run from docx", () => {
        expect(new ChartRun(CHARTS[0])).to.be.instanceOf(Run);
    });
});
