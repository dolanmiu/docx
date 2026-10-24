import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Packer } from "@export/packer/packer";
import { EndnoteReferenceRun } from "@file/endnotes";
import { File } from "@file/file";
import { Header } from "@file/header";
import { Paragraph, TextRun } from "@file/paragraph";
import { Table, TableCell, TableRow } from "@file/table";
import { textOf, unzip } from "tests/zip";

import { FootnoteReferenceRun } from "./reference-run";

const MARK = `<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteRef/></w:r>`;
const ENDNOTE_MARK = `<w:r><w:rPr><w:rStyle w:val="EndnoteReference"/></w:rPr><w:endnoteRef/></w:r>`;

/** The parts of a document, packed */
const partsOf = async (document: File): Promise<(path: string) => Promise<string>> => {
    const files = unzip(await Packer.toBuffer(document));
    return (path) => Promise.resolve(textOf(files, path)!);
};

/** The notes of a part, other than the separators, as their ids and text */
const notesIn = (part: string, kind: "footnote" | "endnote"): readonly string[] =>
    [...part.matchAll(new RegExp(`<w:${kind} w:id="(\\d+)">(.*?)</w:${kind}>`, "g"))].map(
        ([, id, content]) => `${id}: ${[...content.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(([, text]) => text).join("")}`,
    );

const referencesIn = (part: string): readonly string[] =>
    [...part.matchAll(/<w:(foot|end)noteReference w:id="(\d+)"\/>/g)].map(([, kind, id]) => `${kind} ${id}`);

describe("FootnoteReferenceRun", () => {
    it("should refer to one of the document's footnotes by its id", () => {
        expect(new Formatter().format(new FootnoteReferenceRun(1))).to.deep.equal({
            "w:r": [
                { "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "FootnoteReference" } } }] },
                { "w:footnoteReference": { _attr: { "w:id": 1 } } },
            ],
        });
    });

    describe("with its footnote's content", () => {
        it("should add its footnote to the document's footnotes, with an id after theirs", async () => {
            const read = await partsOf(
                new File({
                    footnotes: { 1: { children: [new Paragraph("First")] }, 3: { children: [new Paragraph("Third")] } },
                    sections: [
                        {
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun("Text"),
                                        new FootnoteReferenceRun(1),
                                        new FootnoteReferenceRun({ children: [new Paragraph("Its own")] }),
                                        new FootnoteReferenceRun(3),
                                        new FootnoteReferenceRun({ children: [new Paragraph("Another")] }),
                                    ],
                                }),
                            ],
                        },
                    ],
                }),
            );

            expect(referencesIn(await read("word/document.xml"))).to.deep.equal(["foot 1", "foot 4", "foot 3", "foot 5"]);
            const footnotes = await read("word/footnotes.xml");
            expect(notesIn(footnotes, "footnote")).to.deep.equal(["1: First", "3: Third", "4: Its own", "5: Another"]);
            expect(footnotes).to.contain(
                `<w:footnote w:id="4"><w:p>${MARK}<w:r><w:t xml:space="preserve">Its own</w:t></w:r></w:p></w:footnote>`,
            );
        });

        it("should number its footnote from 1 in a document without footnotes, past keys that aren't numbers", async () => {
            const read = await partsOf(
                new File({
                    footnotes: { note: { children: [new Paragraph("Not a number")] } },
                    sections: [
                        { children: [new Paragraph({ children: [new FootnoteReferenceRun({ children: [new Paragraph("Own")] })] })] },
                    ],
                }),
            );

            expect(referencesIn(await read("word/document.xml"))).to.deep.equal(["foot 1"]);
            expect(notesIn(await read("word/footnotes.xml"), "footnote")).to.deep.equal(["1: Own"]);
        });

        it("should keep its footnote's id, and add the footnote once, when the document is packed again", async () => {
            const document = new File({
                sections: [{ children: [new Paragraph({ children: [new FootnoteReferenceRun({ children: [new Paragraph("Once")] })] })] }],
            });
            await Packer.toBuffer(document);
            const read = await partsOf(document);

            expect(referencesIn(await read("word/document.xml"))).to.deep.equal(["foot 1"]);
            expect(notesIn(await read("word/footnotes.xml"), "footnote")).to.deep.equal(["1: Once"]);
        });

        it("should give runs with the same content a footnote each, each with one number", async () => {
            const content = { children: [new Paragraph("Shared"), new Paragraph("Second paragraph")] };
            const read = await partsOf(
                new File({
                    sections: [
                        {
                            children: [new Paragraph({ children: [new FootnoteReferenceRun(content), new FootnoteReferenceRun(content)] })],
                        },
                    ],
                }),
            );

            expect(referencesIn(await read("word/document.xml"))).to.deep.equal(["foot 1", "foot 2"]);
            const footnotes = await read("word/footnotes.xml");
            expect(notesIn(footnotes, "footnote")).to.deep.equal(["1: SharedSecond paragraph", "2: SharedSecond paragraph"]);
            // A number at the start of each footnote only: the separators' two, and one in each of these
            expect(footnotes.split("<w:footnoteRef/>")).to.have.length(5);
        });

        it("should give each document its own footnote, so content can be in more than one", async () => {
            const content = { children: [new Paragraph("Reused")] };
            const documentWith = (): File =>
                new File({ sections: [{ children: [new Paragraph({ children: [new FootnoteReferenceRun(content)] })] }] });
            await partsOf(documentWith());
            const read = await partsOf(documentWith());

            expect(await read("word/footnotes.xml")).to.contain(
                `<w:footnote w:id="1"><w:p>${MARK}<w:r><w:t xml:space="preserve">Reused</w:t></w:r></w:p></w:footnote>`,
            );
        });

        it("should add the footnote of a run in a table cell", async () => {
            const read = await partsOf(
                new File({
                    sections: [
                        {
                            children: [
                                new Table({
                                    rows: [
                                        new TableRow({
                                            children: [
                                                new TableCell({
                                                    children: [
                                                        new Paragraph({
                                                            children: [
                                                                new FootnoteReferenceRun({ children: [new Paragraph("In a cell")] }),
                                                            ],
                                                        }),
                                                    ],
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        },
                    ],
                }),
            );

            expect(referencesIn(await read("word/document.xml"))).to.deep.equal(["foot 1"]);
            expect(notesIn(await read("word/footnotes.xml"), "footnote")).to.deep.equal(["1: In a cell"]);
        });

        it("should be left out of a header, and of another footnote, as Word has footnotes only in a document's body", async () => {
            const read = await partsOf(
                new File({
                    sections: [
                        {
                            headers: {
                                default: new Header({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun("Header"),
                                                new FootnoteReferenceRun({ children: [new Paragraph("Not in a header")] }),
                                            ],
                                        }),
                                    ],
                                }),
                            },
                            children: [
                                new Paragraph({
                                    children: [
                                        new FootnoteReferenceRun({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun("Outer"),
                                                        new FootnoteReferenceRun({ children: [new Paragraph("Not in a footnote")] }),
                                                    ],
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        },
                    ],
                }),
            );

            const header = await read("word/header1.xml");
            expect(header).to.contain("Header");
            expect(header).not.to.contain("FootnoteReference");
            const footnotes = await read("word/footnotes.xml");
            expect(notesIn(footnotes, "footnote")).to.deep.equal(["1: Outer"]);
            expect(referencesIn(footnotes)).to.deep.equal([]);
        });

        it("should be left out of content written without a document", () => {
            const paragraph = new Paragraph({
                children: [new TextRun("Text"), new FootnoteReferenceRun({ children: [new Paragraph("Nowhere")] })],
            });

            expect(new Formatter().format(paragraph)).to.deep.equal({
                "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Text"] }] }],
            });
        });
    });
});

describe("EndnoteReferenceRun with its endnote's content", () => {
    it("should add its endnote to the document's endnotes, with an id after theirs", async () => {
        const read = await partsOf(
            new File({
                endnotes: { 2: { children: [new Paragraph("Given")] }, note: { children: [new Paragraph("Not a number")] } },
                sections: [
                    {
                        children: [
                            new Paragraph({
                                children: [
                                    new EndnoteReferenceRun(2),
                                    new EndnoteReferenceRun({ children: [new Paragraph("Its own")] }),
                                    new FootnoteReferenceRun({ children: [new Paragraph("A footnote")] }),
                                ],
                            }),
                        ],
                    },
                ],
            }),
        );

        expect(referencesIn(await read("word/document.xml"))).to.deep.equal(["end 2", "end 3", "foot 1"]);
        const endnotes = await read("word/endnotes.xml");
        // The key that isn't a number doesn't change the ids after the others
        expect(notesIn(endnotes, "endnote")).to.deep.equal(["2: Given", "3: Its own"]);
        expect(endnotes).to.contain(
            `<w:endnote w:id="3"><w:p>${ENDNOTE_MARK}<w:r><w:t xml:space="preserve">Its own</w:t></w:r></w:p></w:endnote>`,
        );
        expect(notesIn(await read("word/footnotes.xml"), "footnote")).to.deep.equal(["1: A footnote"]);
    });

    it("should keep its endnote's id when the document is packed again, and be left out of a header", async () => {
        const document = new File({
            sections: [
                {
                    headers: {
                        default: new Header({
                            children: [new Paragraph({ children: [new EndnoteReferenceRun({ children: [new Paragraph("No")] })] })],
                        }),
                    },
                    children: [new Paragraph({ children: [new EndnoteReferenceRun({ children: [new Paragraph("Once")] })] })],
                },
            ],
        });
        await Packer.toBuffer(document);
        const read = await partsOf(document);

        expect(referencesIn(await read("word/document.xml"))).to.deep.equal(["end 1"]);
        expect(notesIn(await read("word/endnotes.xml"), "endnote")).to.deep.equal(["1: Once"]);
        expect(await read("word/header1.xml")).not.to.contain("EndnoteReference");
    });
});
