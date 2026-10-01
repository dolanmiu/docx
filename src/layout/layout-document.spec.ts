import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import {
    Document,
    EndnoteReferenceRun,
    FootnoteReferenceRun,
    FrameAnchorType,
    Header,
    HeadingLevel,
    type IContext,
    type IPropertiesOptions,
    Paragraph,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
} from "docx";

import { estimatePageNumbers } from "./estimate-page-numbers";
import { type BlockLayout, type LineLayout, layoutDocument } from "./layout-document";

// docx's pages are A4 with inch margins: 11906 by 16838 twips, 96 pixels to the inch
const PAGE_WIDTH = (11906 / 1440) * 96;
const PAGE_HEIGHT = (16838 / 1440) * 96;
const TEXT_WIDTH = PAGE_WIDTH - 2 * 96;

const linesOf = (blocks: readonly BlockLayout[]): readonly LineLayout[] =>
    blocks.flatMap((block) => (block.type === "paragraph" ? block.lines : []));

const textsOf = (blocks: readonly BlockLayout[]): readonly string[] => linesOf(blocks).map(({ text }) => text);

describe("layoutDocument", () => {
    it("should give each page and what is on it, with lengths in pixels", () => {
        const { pages, stoppedAt } = layoutDocument(
            new Document({ sections: [{ children: [new Paragraph("The harbour was rebuilt.")] }] }),
        );
        expect(stoppedAt).to.equal(undefined);
        expect(pages).to.have.length(1);
        const [page] = pages;
        expect(page).to.deep.include({ pageNumber: "1", section: 0, footnotes: [], endnotes: [] });
        expect(page.width).to.be.closeTo(PAGE_WIDTH, 0.001);
        expect(page.height).to.be.closeTo(PAGE_HEIGHT, 0.001);
        expect(page).to.not.have.any.keys("header", "footer");
        const [line] = linesOf(page.body);
        expect(line.text).to.equal("The harbour was rebuilt.");
        expect(line.x).to.be.closeTo(96, 0.001);
        expect(line.y).to.be.closeTo(96, 0.001);
        expect(line.width).to.be.closeTo(TEXT_WIDTH, 0.001);
        // Times New Roman at 10 points, docx's default, is about 11.5 points tall
        expect(line.height).to.be.closeTo(15.33, 0.01);
        expect(line.textWidth).to.be.within(100, 160);
    });

    it("should give the lines of paragraphs across pages, tables' rows, footnotes, endnotes, and each page's header", () => {
        const text = "The harbour was rebuilt after the storm, and this report sets out what it cost and what is left to do. ".repeat(80);
        const { pages } = layoutDocument(
            new Document({
                footnotes: { 1: { children: [new Paragraph("A footnote.")] } },
                endnotes: { 1: { children: [new Paragraph("An endnote.")] } },
                sections: [
                    {
                        properties: { titlePage: true },
                        headers: { default: new Header({ children: [new Paragraph("Report")] }) },
                        children: [
                            new Paragraph({ children: [new TextRun("Costs"), new FootnoteReferenceRun(1), new EndnoteReferenceRun(1)] }),
                            new Table({
                                rows: [
                                    new TableRow({ children: [new TableCell({ children: [new Paragraph("Quay")] })] }),
                                    new TableRow({ children: [new TableCell({ children: [new Paragraph("Wall")] })] }),
                                ],
                            }),
                            new Paragraph(text),
                        ],
                    },
                ],
            }),
        );
        expect(pages).to.have.length(2);
        // The first page has no header of its own, so it shows none
        expect(pages.map(({ header }) => header)).to.deep.equal([undefined, "default"]);
        expect(pages[0].body.map(({ type, index }) => [type, index])).to.deep.equal([
            ["paragraph", 0],
            ["table", 1],
            ["paragraph", 2],
        ]);
        expect(textsOf(pages[0].body)[0]).to.equal("Costs1i");
        const table = pages[0].body[1];
        expect(table.type === "table" && table.rows.map(({ index }) => index)).to.deep.equal([0, 1]);
        // The paragraph goes on to the second page, where the endnote follows it
        expect(pages[1].body.map(({ index }) => index)).to.deep.equal([2]);
        expect(pages[0].footnotes.map(({ noteNumber, content }) => [noteNumber, textsOf(content)])).to.deep.equal([
            ["1", ["1A footnote."]],
        ]);
        expect(pages[1].endnotes.map(({ noteNumber, content }) => [noteNumber, textsOf(content)])).to.deep.equal([["i", ["iAn endnote."]]]);
        // The footnote is at the bottom of the page, above the inch of margin
        const [noteLine] = linesOf(pages[0].footnotes[0].content);
        expect(noteLine.y + noteLine.height).to.be.closeTo(PAGE_HEIGHT - 96, 0.001);
    });

    it("should lay out tables of contents with the page numbers it works out for them", () => {
        const options = (): IPropertiesOptions => ({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-1" }),
                        new Paragraph({ heading: HeadingLevel.HEADING_1, text: "First" }),
                        new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Second", pageBreakBefore: true }),
                    ],
                },
            ],
        });
        const entries = (document: Document): readonly string[] =>
            textsOf(layoutDocument(document).pages[0].body).filter((text) => text.startsWith("First") || text.startsWith("Second"));
        expect(entries(new Document(options()))).to.deep.equal(["First\t1", "Second\t2", "First"]);
        expect(entries(new Document({ ...options(), pageNumbers: estimatePageNumbers }))).to.deep.equal(["First\t1", "Second\t2", "First"]);
    });

    it("should give the pages up to where it stopped, and why it stopped", () => {
        const { pages, stoppedAt } = layoutDocument(
            new Document({
                sections: [
                    {
                        children: [
                            new Paragraph("Before the frame"),
                            new Paragraph({
                                frame: {
                                    type: "absolute",
                                    position: { x: 1000, y: 1000 },
                                    width: 2000,
                                    height: 1000,
                                    anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE },
                                },
                                text: "In a frame",
                            }),
                            new Paragraph("After the frame"),
                        ],
                    },
                ],
            }),
        );
        expect(stoppedAt).to.equal("a text frame");
        expect(pages.map(({ body }) => textsOf(body))).to.deep.equal([["Before the frame"]]);
    });

    it("should leave the document as it is written", () => {
        const options = (): IPropertiesOptions => ({
            footnotes: { 1: { children: [new Paragraph("A footnote.")] } },
            sections: [
                {
                    headers: { default: new Header({ children: [new Paragraph("Report")] }) },
                    children: [new Paragraph({ children: [new TextRun("Costs"), new FootnoteReferenceRun(1)] }), new Paragraph("More")],
                },
                { children: [new Paragraph("Next")] },
            ],
        });
        const written = (document: Document): unknown =>
            new Formatter().format(document.Document.View, {
                file: document,
                viewWrapper: document.Document,
                stack: [],
            } as unknown as IContext);
        const laidOut = new Document(options());
        layoutDocument(laidOut);
        expect(written(laidOut)).to.deep.equal(written(new Document(options())));
    });
});
