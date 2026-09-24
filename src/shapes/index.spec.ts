import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { Document, Footer, Header, ImageRun, Packer, Paragraph, WpsShapeRun } from "docx";

import { ShapeCanvasRun, ShapeGroupRun, ShapeRun } from ".";

describe("docx/shapes in a document", () => {
    it("should write each drawing, and each shape in a group or on a canvas, with a distinct id", async () => {
        const image = (): Paragraph =>
            new Paragraph({
                children: [new ImageRun({ type: "png", data: Buffer.from("", "base64"), transformation: { width: 10, height: 10 } })],
            });
        const textBox = (): Paragraph =>
            new Paragraph({
                children: [new WpsShapeRun({ type: "wps", children: [new Paragraph("text")], transformation: { width: 10, height: 10 } })],
            });
        const shape = (): Paragraph =>
            new Paragraph({ children: [new ShapeRun({ type: "ellipse", transformation: { width: 10, height: 10 } })] });
        const twoRectangles = [
            { type: "rectangle", transformation: { width: 10, height: 10 } },
            { type: "rectangle", transformation: { offset: { left: 10 }, width: 10, height: 10 } },
        ] as const;
        const group = (): Paragraph => new Paragraph({ children: [new ShapeGroupRun({ children: twoRectangles })] });
        const canvas = (): Paragraph => new Paragraph({ children: [new ShapeCanvasRun({ children: twoRectangles })] });
        const doc = new Document({
            sections: [
                {
                    headers: { default: new Header({ children: [textBox(), shape()] }) },
                    footers: { default: new Footer({ children: [image(), group()] }) },
                    children: [image(), textBox(), shape(), group(), canvas(), image()],
                },
            ],
        });

        // Headers and footers are formatted more than once when a document is packed, and a document can be packed
        // more than once, so pack it twice
        await Packer.toBuffer(doc);
        const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
        const xml = (
            await Promise.all(["word/document.xml", "word/header1.xml", "word/footer1.xml"].map((name) => zip.file(name)?.async("text")))
        ).join("");

        // Shapes inside groups and canvases carry ids too, which must not clash with any drawing's id
        const ids = [...xml.matchAll(/<(?:wp:docPr|wps:cNvPr) id="(\d+)"/g)].map(([, id]) => id);

        // 11 drawings (the canvas and its fallback group are two), 4 shapes in the groups, 2 on the canvas, and 3 in the
        // canvas's fallback, including its background
        expect(ids).to.have.length(20);
        expect(new Set(ids).size).to.equal(20);
    });
});
