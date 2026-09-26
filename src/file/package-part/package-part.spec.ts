import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { Packer } from "@export/packer/packer";
import { File } from "@file/file";
import { FootnoteReferenceRun } from "@file/footnotes";
import { Footer, Header } from "@file/header";
import { Paragraph, Run, TextRun } from "@file/paragraph";
import { BuilderElement, type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import { PackagePart, type PackagePartOptions } from "./package-part";

const CHART_TYPE = "application/vnd.openxmlformats-officedocument.drawingml.chart+xml";
const CHART_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart";
const PACKAGE_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package";

// Refers to a part by its relationship id, as a chart's c:chart does, and adds it to the package when it is written
class PartReference extends XmlComponent {
    public constructor(private readonly part: PackagePart) {
        super("c:chart");
        this.root.push(part.relationshipId);
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        this.part.addTo(context);
        return super.prepForXml(context);
    }
}

class PartRun extends Run {
    public constructor(part: PackagePart) {
        super({});
        this.root.push(new PartReference(part));
    }
}

const createChart = (content: XmlComponent = new BuilderElement({ name: "c:chartSpace" })): PackagePart =>
    new PackagePart({
        folder: "charts",
        name: "chart",
        extension: "xml",
        contentType: CHART_TYPE,
        relationshipType: CHART_RELATIONSHIP,
        content,
    });

const createWorkbook = (content: PackagePartOptions["content"] = new Uint8Array([1, 2, 3])): PackagePart =>
    new PackagePart({
        folder: "embeddings",
        name: "Microsoft_Excel_Worksheet",
        extension: "xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        relationshipType: PACKAGE_RELATIONSHIP,
        content,
    });

const paragraphWith = (...parts: readonly PackagePart[]): Paragraph => new Paragraph({ children: parts.map((part) => new PartRun(part)) });

const pack = async (file: File): Promise<JSZip> => JSZip.loadAsync(await Packer.toBuffer(file));

const read = async (zip: JSZip, path: string): Promise<string | undefined> => {
    const text = await zip.file(path)?.async("text");
    return text;
};

const count = (text: string | undefined, search: string): number => (text ?? "").split(search).length - 1;

describe("PackagePart", () => {
    describe("#constructor()", () => {
        it("should throw for a folder docx writes parts of its own in, or that isn't a single folder name", () => {
            for (const folder of ["media", "theme", "fonts", "_rels", "", "charts/more", "../charts"]) {
                expect(() => new PackagePart({ ...createChart().options, folder })).to.throw(
                    `Invalid package part folder "${folder}". Expected a folder name docx doesn't use, such as "charts"`,
                );
            }
        });
    });

    describe("#addTo()", () => {
        it("should write the part, its content type, and a relationship to it from the document", async () => {
            const chart = createChart();
            const zip = await pack(new File({ sections: [{ children: [paragraphWith(chart)] }] }));

            expect(await read(zip, "word/charts/chart1.xml")).to.equal(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace/>',
            );
            expect(await read(zip, "[Content_Types].xml")).to.contain(
                `<Override ContentType="${CHART_TYPE}" PartName="/word/charts/chart1.xml"/>`,
            );
            expect(await read(zip, "word/_rels/document.xml.rels")).to.contain(
                `<Relationship Id="${chart.relationshipId}" Type="${CHART_RELATIONSHIP}" Target="charts/chart1.xml"/>`,
            );
            expect(await read(zip, "word/document.xml")).to.contain(`<c:chart>${chart.relationshipId}</c:chart>`);
            // A part whose XML refers to nothing has no relationships part
            expect(zip.file("word/charts/_rels/chart1.xml.rels")).to.equal(null);
        });

        it("should give each part a relationship id of its own", () => {
            expect(createChart().relationshipId).to.match(/^rId/);
            expect(createChart().relationshipId).to.not.equal(createChart().relationshipId);
        });

        it("should number parts by folder and name, in the order they are added", async () => {
            const charts = [createChart(), createChart(), createChart()];
            const workbooks = [createWorkbook(), createWorkbook()];
            const zip = await pack(
                new File({
                    sections: [
                        {
                            headers: { default: new Header({ children: [paragraphWith(charts[2])] }) },
                            children: [paragraphWith(charts[0], workbooks[0], charts[1], workbooks[1])],
                        },
                    ],
                }),
            );
            const relationships = await read(zip, "word/_rels/document.xml.rels");

            expect(relationships).to.contain(`Id="${charts[0].relationshipId}" Type="${CHART_RELATIONSHIP}" Target="charts/chart1.xml"`);
            expect(relationships).to.contain(`Id="${charts[1].relationshipId}" Type="${CHART_RELATIONSHIP}" Target="charts/chart2.xml"`);
            expect(relationships).to.contain(
                `Id="${workbooks[0].relationshipId}" Type="${PACKAGE_RELATIONSHIP}" Target="embeddings/Microsoft_Excel_Worksheet1.xlsx"`,
            );
            expect(relationships).to.contain(
                `Id="${workbooks[1].relationshipId}" Type="${PACKAGE_RELATIONSHIP}" Target="embeddings/Microsoft_Excel_Worksheet2.xlsx"`,
            );
            // The header is written after the document
            expect(await read(zip, "word/_rels/header1.xml.rels")).to.contain(
                `Id="${charts[2].relationshipId}" Type="${CHART_RELATIONSHIP}" Target="charts/chart3.xml"`,
            );
            expect(Object.keys(zip.files).filter((path) => /^word\/(charts|embeddings)\/[^/]+$/.test(path))).to.deep.equal([
                "word/charts/chart1.xml",
                "word/embeddings/Microsoft_Excel_Worksheet1.xlsx",
                "word/charts/chart2.xml",
                "word/embeddings/Microsoft_Excel_Worksheet2.xlsx",
                "word/charts/chart3.xml",
            ]);
        });

        it("should add a relationship from each part it is written in: the document, headers, footers, notes and comments", async () => {
            const chart = createChart();
            const zip = await pack(
                new File({
                    sections: [
                        {
                            // A header with no other relationships, whose relationships part would otherwise be empty
                            headers: { default: new Header({ children: [paragraphWith(chart)] }) },
                            footers: { default: new Footer({ children: [paragraphWith(chart)] }) },
                            children: [new Paragraph({ children: [new TextRun("Text"), new FootnoteReferenceRun(1)] })],
                        },
                    ],
                    footnotes: { 1: { children: [paragraphWith(chart)] } },
                    endnotes: { 1: { children: [paragraphWith(chart)] } },
                    comments: { children: [{ id: 0, children: [paragraphWith(chart)] }] },
                }),
            );

            for (const relationships of ["header1", "footer1", "footnotes", "endnotes", "comments"]) {
                expect(await read(zip, `word/_rels/${relationships}.xml.rels`)).to.contain(
                    `<Relationship Id="${chart.relationshipId}" Type="${CHART_RELATIONSHIP}" Target="charts/chart1.xml"/>`,
                );
            }
            expect(await read(zip, "word/_rels/document.xml.rels")).to.not.contain(chart.relationshipId);
            expect(zip.file("word/charts/chart2.xml")).to.equal(null);
            // The endnotes are written after the content types used to be, so the part's content type is written last
            expect(count(await read(zip, "[Content_Types].xml"), "/word/charts/chart1.xml")).to.equal(1);
        });

        it("should add a part and its relationships once, however many times it is written, and when packed twice", async () => {
            const chart = createChart();
            const file = new File({
                sections: [
                    {
                        // Headers are formatted twice when a document is packed
                        headers: { default: new Header({ children: [paragraphWith(chart, chart)] }) },
                        children: [paragraphWith(chart), paragraphWith(chart)],
                    },
                ],
            });

            await pack(file);
            const zip = await pack(file);

            expect(Object.keys(zip.files).filter((path) => path.startsWith("word/charts/"))).to.deep.equal([
                "word/charts/",
                "word/charts/chart1.xml",
            ]);
            expect(count(await read(zip, "word/_rels/document.xml.rels"), chart.relationshipId)).to.equal(1);
            expect(count(await read(zip, "word/_rels/header1.xml.rels"), chart.relationshipId)).to.equal(1);
            expect(count(await read(zip, "[Content_Types].xml"), "/word/charts/chart1.xml")).to.equal(1);
        });

        it("should add the parts a part's XML refers to, with relationships relative to its folder", async () => {
            const workbook = createWorkbook();
            // A part in the same folder, as Word's chart styles are
            const style = new PackagePart({
                folder: "charts",
                name: "style",
                extension: "xml",
                contentType: "application/vnd.ms-office.chartstyle+xml",
                relationshipType: CHART_RELATIONSHIP,
                content: new BuilderElement({ name: "cs:chartStyle" }),
            });
            const chart = createChart(
                new BuilderElement({ name: "c:chartSpace", children: [new PartReference(workbook), new PartReference(style)] }),
            );
            const file = new File({ sections: [{ children: [paragraphWith(chart)] }] });

            await pack(file);
            const zip = await pack(file);
            const relationships = await read(zip, "word/charts/_rels/chart1.xml.rels");

            expect(relationships).to.equal(
                `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
                    `<Relationship Id="${workbook.relationshipId}" Type="${PACKAGE_RELATIONSHIP}" Target="../embeddings/Microsoft_Excel_Worksheet1.xlsx"/>` +
                    `<Relationship Id="${style.relationshipId}" Type="${CHART_RELATIONSHIP}" Target="style1.xml"/></Relationships>`,
            );
            expect(await read(zip, "word/_rels/document.xml.rels")).to.not.contain(workbook.relationshipId);
            expect(await read(zip, "[Content_Types].xml")).to.contain(
                '<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" PartName="/word/embeddings/Microsoft_Excel_Worksheet1.xlsx"/>',
            );
            expect(await zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")?.async("uint8array")).to.deep.equal(
                new Uint8Array([1, 2, 3]),
            );
            expect(await read(zip, "word/charts/style1.xml")).to.contain("<cs:chartStyle/>");
        });

        it("should zip the files of an embedded package, formatting their XML", async () => {
            const workbook = createWorkbook({
                files: [
                    {
                        path: "xl/workbook.xml",
                        content: new BuilderElement({ name: "workbook", children: [new BuilderElement({ name: "sheets" })] }),
                    },
                    { path: "xl/media/image1.png", content: new Uint8Array([4, 5]) },
                ],
            });
            const zip = await pack(new File({ sections: [{ children: [paragraphWith(workbook)] }] }));
            const embedded = await JSZip.loadAsync(
                (await zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")?.async("uint8array"))!,
            );

            expect(await embedded.file("xl/workbook.xml")?.async("text")).to.equal(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook><sheets/></workbook>',
            );
            expect(await embedded.file("xl/media/image1.png")?.async("uint8array")).to.deep.equal(new Uint8Array([4, 5]));
        });

        it("should prettify a part's XML as the document's", async () => {
            const chart = createChart(new BuilderElement({ name: "c:chartSpace", children: [new BuilderElement({ name: "c:chart" })] }));
            const zip = await JSZip.loadAsync(await Packer.toBuffer(new File({ sections: [{ children: [paragraphWith(chart)] }] }), true));

            expect(await read(zip, "word/charts/chart1.xml")).to.equal(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<c:chartSpace>\n  <c:chart/>\n</c:chartSpace>',
            );
        });
    });
});
