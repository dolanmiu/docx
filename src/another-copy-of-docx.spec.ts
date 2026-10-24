import { beforeAll, describe, expect, it, vi } from "vitest";

import * as docx from "docx";
import { textOf, unzip } from "tests/zip";

/** Writes a document and reads back one of its parts */
const partOf = async (document: docx.Document, path: string): Promise<string> => textOf(unzip(await docx.Packer.toBuffer(document)), path)!;

const bodyOf = async (children: readonly docx.FileChild[]): Promise<string> => {
    const xml = await partOf(new docx.Document({ sections: [{ children }] }), "word/document.xml");
    return xml.slice(xml.indexOf("<w:body>"), xml.indexOf("<w:sectPr"));
};

// A plugin, or a library that builds on docx, may be bundled with a copy of docx of its own. Its components are
// then not instances of this copy's classes
describe("components from another copy of docx", () => {
    let other: typeof docx;

    beforeAll(async () => {
        vi.resetModules();
        other = await import("docx");
    });

    it("should be loaded from a copy of docx of their own", () => {
        expect(other.Paragraph).not.to.equal(docx.Paragraph);
        expect(new other.Paragraph("Text")).not.to.be.instanceOf(docx.XmlComponent);
    });

    it("should write a paragraph from another copy in a section", async () => {
        const body = await bodyOf([new other.Paragraph("Theirs") as unknown as docx.Paragraph, new docx.Paragraph("Ours")]);

        expect(body).to.equal(
            '<w:body><w:p><w:r><w:t xml:space="preserve">Theirs</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">Ours</w:t></w:r></w:p>',
        );
    });

    it("should write a run from another copy in a paragraph", async () => {
        const body = await bodyOf([
            new docx.Paragraph({ children: [new other.TextRun({ text: "Theirs", bold: true }) as unknown as docx.TextRun] }),
        ]);

        expect(body).to.equal('<w:body><w:p><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">Theirs</w:t></w:r></w:p>');
    });

    it("should give an external hyperlink from another copy its relationship", async () => {
        const document = new docx.Document({
            sections: [
                {
                    children: [
                        new docx.Paragraph({
                            children: [
                                new other.ExternalHyperlink({
                                    link: "https://example.com",
                                    children: [new other.TextRun("Link")],
                                }) as unknown as docx.ExternalHyperlink,
                            ],
                        }),
                    ],
                },
            ],
        });
        const xml = await partOf(document, "word/document.xml");
        const relationships = await partOf(document, "word/_rels/document.xml.rels");

        expect(xml).not.to.contain("w:externalHyperlink");
        const id = /<w:hyperlink [^>]*r:id="([^"]+)"/.exec(xml)?.[1];
        expect(id).not.to.equal(undefined);
        expect(relationships).to.contain(`Id="${id}"`);
        expect(relationships).to.contain('Target="https://example.com" TargetMode="External"');
    });

    it("should split a run from another copy out of a run's children", async () => {
        const body = await bodyOf([
            new docx.Paragraph({
                children: [new docx.TextRun({ children: ["Before", new other.TextRun("Theirs") as unknown as string, "After"] })],
            }),
        ]);

        expect(body).to.equal(
            '<w:body><w:p><w:r><w:t xml:space="preserve">Before</w:t></w:r><w:r><w:t xml:space="preserve">Theirs</w:t></w:r><w:r><w:t xml:space="preserve">After</w:t></w:r></w:p>',
        );
    });

    it("should not end a cell with another paragraph when its last is from another copy", async () => {
        const body = await bodyOf([
            new docx.Table({
                rows: [
                    new docx.TableRow({
                        children: [new docx.TableCell({ children: [new other.Paragraph("Theirs") as unknown as docx.Paragraph] })],
                    }),
                ],
            }),
        ]);

        expect(body.match(/<w:p>/g)).to.have.length(1);
    });

    it("should merge cells down from a row of cells from another copy", async () => {
        const cell = (text: string, rowSpan?: number): docx.TableCell =>
            new other.TableCell({ children: [new other.Paragraph(text)], rowSpan }) as unknown as docx.TableCell;
        const body = await bodyOf([
            new docx.Table({
                rows: [new docx.TableRow({ children: [cell("A", 2), cell("B")] }), new docx.TableRow({ children: [cell("C")] })],
            }),
        ]);

        const secondRow = body.slice(body.lastIndexOf("<w:tr>"));
        expect(secondRow).to.contain('<w:vMerge w:val="continue"/>');
        expect(secondRow.indexOf("continue")).to.be.lessThan(secondRow.indexOf(">C<"));
    });

    it("should write a textbox in a paragraph from another copy as its run", async () => {
        const body = await bodyOf([
            new other.Paragraph({
                children: [
                    new docx.Textbox({ style: { width: "100pt", height: "50pt" }, children: [new docx.Paragraph("Inside")] }) as never,
                ],
            }) as unknown as docx.Paragraph,
        ]);

        expect(body.startsWith("<w:body><w:p><w:r>")).to.equal(true);
    });
});
