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
    { type: "radar", categories, series, filled: true },
    {
        type: "bubble",
        series: [
            {
                name: "A",
                points: [
                    { x: 1, y: 2, size: 3 },
                    { x: -1, y: 0.5, size: 0 },
                ],
            },
            { name: "B", points: [{ x: 4, y: 4, size: 12.5 }] },
        ],
    },
    // A combo chart with a secondary axis, and dates as its categories
    {
        type: "column",
        categories: [new Date("2025-01-01"), new Date("2025-02-01"), new Date("2025-03-01")],
        series: [series[0], { ...series[1], type: "line", axis: "secondary" }],
    },
    // Categories in groups, with custom error bars, whose amounts are cells too
    {
        type: "column",
        categories: [
            { name: "2024", categories: ["Q3", "Q4"] },
            { name: "2025", categories: [1] },
        ],
        series: [
            { ...series[0], errorBars: { type: "custom", plus: [1, null, 0.5], minus: [2] }, trendlines: [{ type: "linear" }] },
            { ...series[1], errorBars: { type: "fixed", value: 1 } },
        ],
    },
    {
        type: "scatter",
        series: [
            {
                name: "A",
                points: [
                    { x: 1, y: 2 },
                    { x: 2, y: 3 },
                ],
                xErrorBars: { type: "custom", minus: [0.1, 0.2] },
                yErrorBars: { type: "custom", plus: [1] },
            },
        ],
    },
    { type: "pieOfPie", categories, series: [{ name: "Share", values: [5, 3, 2], explosion: [10] }] },
    {
        type: "stock",
        categories: [new Date("2025-01-06"), new Date("2025-01-07")],
        volume: [100, 200],
        open: [1, 2],
        high: [3, 3],
        low: [1, 1],
        close: [2, 1.5],
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

// The cells a formula such as Sheet1!$B$2:$B$4, or Sheet1!$A$2:$B$4, refers to, a column at a time
const columnsOf = (formula: string): readonly (readonly string[])[] => {
    const [, from, first, to, last] = /^Sheet1!\$([A-Z]+)\$(\d+)(?::\$([A-Z]+)\$(\d+))?$/.exec(formula)!;
    const columns = Array.from({ length: (to ?? from).charCodeAt(0) - from.charCodeAt(0) + 1 }, (_, index) =>
        String.fromCharCode(from.charCodeAt(0) + index),
    );
    return columns.map((column) =>
        Array.from({ length: Number(last ?? first) - Number(first) + 1 }, (_, index) => `${column}${Number(first) + index}`),
    );
};

// A cache's points, by their index
const pointsOf = (cache: Element): ReadonlyMap<number, string> =>
    new Map(descendants(cache, "c:pt").map((point) => [Number(point.attributes!.idx), textOf(descendants(point, "c:v")[0])]));

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
            const levels = descendants(chart, "c:multiLvlStrRef");

            // A name, categories and values for each series, a bubble series' sizes, and custom error bars' amounts
            expect(references.length + levels.length).to.equal(
                descendants(chart, "c:ser").length * 3 +
                    ["c:bubbleSize", "c:plus", "c:minus"].reduce((count, name) => count + descendants(chart, name).length, 0),
            );
            for (const reference of references) {
                const [names] = columnsOf(textOf(descendants(reference, "c:f")[0]));
                const cache = pointsOf(reference);

                expect(descendants(reference, "c:ptCount")[0].attributes!.val).to.equal(String(names.length));
                expect(names.map((name) => cells.get(name))).to.deep.equal(names.map((_, point) => cache.get(point)));
            }
            // Categories in groups: a level of the cache for each column, the categories' own column first
            for (const reference of levels) {
                const columns = columnsOf(textOf(descendants(reference, "c:f")[0]));
                const cached = descendants(reference, "c:lvl").map(pointsOf);

                expect(descendants(reference, "c:ptCount")[0].attributes!.val).to.equal(String(columns[0].length));
                expect(cached).to.have.length(columns.length);
                for (const [level, cache] of cached.entries()) {
                    const names = columns[columns.length - 1 - level];
                    expect(names.map((name) => cells.get(name))).to.deep.equal(names.map((_, point) => cache.get(point)));
                }
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
