import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import {
    Document,
    Footer,
    FootnoteReferenceRun,
    Header,
    Packer,
    Paragraph,
    PatchType,
    Table,
    TableCell,
    TableRow,
    Textbox,
    patchDocument,
} from "docx";

import * as html from ".";

const CONTENT = '<p><b>Bold</b> <a href="https://example.com">link</a></p><ul><li>item</li></ul><table><tr><td>cell</td></tr></table>';

describe("docx/html", () => {
    it("exports htmlToContent and htmlToRuns", () => {
        expect(Object.keys(html).sort()).toEqual(["htmlToContent", "htmlToRuns"]);
    });

    it("writes content in a document's body, headers, footers, footnotes, table cells and text boxes", async () => {
        const doc = new Document({
            footnotes: { 1: { children: [new Paragraph({ children: [...html.htmlToRuns("A <i>note</i>")] })] } },
            sections: [
                {
                    headers: { default: new Header({ children: [...html.htmlToContent(CONTENT)] }) },
                    footers: { default: new Footer({ children: [...html.htmlToContent(CONTENT)] }) },
                    children: [
                        ...html.htmlToContent(CONTENT),
                        new Paragraph({ children: [...html.htmlToRuns("<b>Runs</b>"), new FootnoteReferenceRun(1)] }),
                        new Table({ rows: [new TableRow({ children: [new TableCell({ children: [...html.htmlToContent(CONTENT)] })] })] }),
                        new Textbox({
                            style: { width: "2in", height: "1in" },
                            children: [...html.htmlToContent("<p>In a <b>text box</b></p>")],
                        }),
                    ],
                },
            ],
        });
        const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
        const part = (path: string): Promise<string> => zip.file(path)!.async("text");

        expect((await part("word/document.xml")).match(/<w:hyperlink /g)).toHaveLength(2);
        expect(await part("word/header1.xml")).toContain('<w:hyperlink w:history="1" r:id=');
        expect(await part("word/_rels/header1.xml.rels")).toContain("https://example.com");
        expect(await part("word/footer1.xml")).toContain("<w:numPr>");
        expect(await part("word/footnotes.xml")).toContain("<w:i/>");
        expect((await part("word/numbering.xml")).match(/<w:abstractNum /g)!.length).toBeGreaterThanOrEqual(5);
        expect(await part("word/document.xml")).toContain("text box");
    });

    it("writes the HTML's notes as the footnotes of a template it patches, and leaves them out of its header", async () => {
        const notes = `<p>Claim<sup><a href="#n1" id="r1">1</a></sup></p><ol><li id="n1">Its source <a href="#r1">↩</a></li></ol>`;
        const template = await Packer.toBuffer(
            new Document({
                sections: [
                    {
                        headers: { default: new Header({ children: [new Paragraph("{{header}}")] }) },
                        children: [new Paragraph("{{body}}")],
                    },
                ],
            }),
        );
        const zip = await JSZip.loadAsync(
            await patchDocument({
                outputType: "nodebuffer",
                data: template,
                patches: {
                    body: { type: PatchType.DOCUMENT, children: html.htmlToContent(notes) },
                    header: { type: PatchType.PARAGRAPH, children: html.htmlToRuns(notes) },
                },
            }),
        );
        const part = (path: string): Promise<string> => zip.file(path)!.async("text");

        expect(await part("word/document.xml")).toContain('<w:footnoteReference w:id="1"/>');
        expect(await part("word/footnotes.xml")).toMatch(
            /<w:footnote w:id="1"><w:p><w:pPr><w:pStyle w:val="FootnoteText"\/><\/w:pPr>.*Its source/,
        );
        const header = await part("word/header1.xml");
        expect(header).toContain("Claim");
        expect(header).not.toContain("footnoteReference");
        expect(await part("word/footnotes.xml")).not.toContain('w:id="2"');
    });
});
