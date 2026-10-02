import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { FootnoteReferenceRun } from "@file/footnotes/footnote/run/reference-run";
import { Footer, Header } from "@file/header";
import { HeadingLevel, Paragraph, SequentialIdentifier, SimpleField, TextRun } from "@file/paragraph";
import { TableOfContents } from "@file/table-of-contents";
import { Textbox } from "@file/textbox";
import type { IContext, IXmlableObject } from "@file/xml-components";

import { Body } from "./body";
import { fillSequenceNumbers } from "./page-numbers";
import { isSequenceField, sequenceNumbering } from "./sequence-numbers";

/** The text of an element, with its field results */
const textOf = (element: unknown): string => {
    if (typeof element === "string") {
        return element;
    }
    if (typeof element !== "object" || element === null) {
        return "";
    }
    const [name] = Object.keys(element);
    if (name === "w:instrText" || name === "w:pPr" || name === "_attr") {
        return "";
    }
    const content = (element as Record<string, unknown>)[name];
    return (Array.isArray(content) ? content : [content]).map(textOf).join("");
};

/** Whether each field in an element begins dirty, in order */
const dirtyOf = (element: unknown): readonly boolean[] => {
    if (typeof element !== "object" || element === null) {
        return [];
    }
    const [name] = Object.keys(element);
    const content = (element as Record<string, unknown>)[name];
    if (name === "w:fldChar") {
        const attributes = (content as { readonly _attr: Record<string, unknown> })._attr;
        return attributes["w:fldCharType"] === "begin" ? [attributes["w:dirty"] === true] : [];
    }
    return Array.isArray(content) ? content.flatMap(dirtyOf) : [];
};

const NO_PAGES = (): { readonly bookmarks: ReadonlyMap<string, string> } => ({ bookmarks: new Map() });

/** A paragraph of a caption: its label, and a SEQ field with the identifier and switches */
const caption = (identifier: string): Paragraph =>
    new Paragraph({ children: [new TextRun(`${identifier.split(" ")[0]} `), new SequentialIdentifier(identifier)] });

const formatBody = (file: File): IXmlableObject =>
    (
        new Formatter().format(file.Document.View, { file, viewWrapper: file.Document, stack: [] } as unknown as IContext) as {
            readonly "w:document": readonly IXmlableObject[];
        }
    )["w:document"][1];

/** The body's paragraphs, without the properties of its last section */
const paragraphsOf = (body: IXmlableObject): readonly unknown[] =>
    (body as { readonly "w:body": readonly unknown[] })["w:body"].filter((element) => "w:p" in (element as object));

/** The text of each paragraph of a document with page numbers, and the given paragraphs */
const captionsOf = (...children: readonly (Paragraph | Textbox)[]): readonly string[] =>
    paragraphsOf(formatBody(new File({ pageNumbers: NO_PAGES, sections: [{ children }] }))).map(textOf);

describe("sequence numbers", () => {
    it("should number the SEQ fields of each identifier in order, and write them clean", () => {
        const body = formatBody(
            new File({
                pageNumbers: NO_PAGES,
                sections: [{ children: [caption("Figure"), caption("Table"), caption("Figure"), caption("Figure"), caption("Table")] }],
            }),
        );

        expect(paragraphsOf(body).map(textOf)).to.deep.equal(["Figure 1", "Table 1", "Figure 2", "Figure 3", "Table 2"]);
        expect(dirtyOf(body)).to.deep.equal([false, false, false, false, false]);
    });

    it("should write SEQ fields dirty and blank, as before, without page numbers", () => {
        const body = formatBody(new File({ sections: [{ children: [caption("Figure"), caption("Figure")] }] }));

        expect(paragraphsOf(body).map(textOf)).to.deep.equal(["Figure ", "Figure "]);
        expect(dirtyOf(body)).to.deep.equal([true, true]);
    });

    it("should number identifiers in any letters, such as Chinese", () => {
        expect(captionsOf(caption("图"), caption("图"), caption("Рисунок"))).to.deep.equal(["图 1", "图 2", "Рисунок 1"]);
    });

    it("should start the count again from the number given with \\r, and repeat the number before with \\c, as Word does", () => {
        // word-seq Q2 and Q3
        expect(
            captionsOf(
                caption("Figure"),
                caption("Figure \\r 5"),
                caption("Figure"),
                caption("Figure \\c"),
                caption("Figure \\n"),
                caption("Figure \\r 0"),
                caption("Figure"),
            ),
        ).to.deep.equal(["Figure 1", "Figure 5", "Figure 6", "Figure 6", "Figure 7", "Figure 0", "Figure 1"]);
        expect(captionsOf(caption("Fresh \\c"), caption("Fresh"), caption("Fresh \\c"))).to.deep.equal(["Fresh 0", "Fresh 1", "Fresh 1"]);
    });

    it("should count a hidden SEQ field (\\h) without writing its number, unless it is given a format, as Word does", () => {
        // word-seq Q4
        expect(
            captionsOf(
                caption("Hide \\h"),
                caption("Hide"),
                caption("Hide \\h \\* ARABIC"),
                caption("Hide \\h \\* MERGEFORMAT"),
                caption("Hide \\r 0 \\h"),
                caption("Hide"),
            ),
        ).to.deep.equal(["Hide ", "Hide 2", "Hide 3", "Hide ", "Hide ", "Hide 1"]);
    });

    it("should write the number in the format of \\*, as Word does", () => {
        // word-seq Q5
        const formats = [
            ["4", "ARABIC"],
            ["4", "Arabic \\* MERGEFORMAT"],
            ["4", "ROMAN"],
            ["4", "roman"],
            ["4", "Roman"],
            ["4", "ALPHABETIC"],
            ["4", "alphabetic"],
            ["4", "Alphabetic"],
            ["4", "Ordinal"],
            ["11", "Ordinal"],
            ["22", "ordinal"],
            ["4", "ArabicDash"],
            ["4", "Upper"],
            ["4", "ARABIC \\* Lower"],
            ["0", "ARABIC"],
            ["0", "ROMAN"],
            ["0", "ALPHABETIC"],
            ["27", "ALPHABETIC"],
            ["53", "alphabetic"],
            ["1994", "ROMAN"],
            ["4000", "ROMAN"],
        ];

        expect(captionsOf(...formats.map(([value, format]) => caption(`Form \\r ${value} \\* ${format}`)))).to.deep.equal(
            ["IV", "iv", "IV", "D", "d", "D", "4th", "11th", "22nd", "- 4 -", "4", "4", "0", "", "", "AA", "aaa", "MCMXCIV", "MMMM"].reduce(
                (all, text) => [...all, `Form ${text}`],
                ["Form 4", "Form 4"],
            ),
        );
    });

    it("should leave blank a number in a format not followed, or that the format doesn't write, but go on counting", () => {
        expect(
            captionsOf(
                caption("Figure \\* CardText"),
                caption("Figure \\* Hex"),
                caption("Figure \\# 00"),
                caption("Figure \\* ROMAN \\* Upper"),
                caption("Figure \\r 0 \\* Ordinal"),
                caption("Figure \\r 32768 \\* ROMAN"),
                caption("Figure \\r 781 \\* alphabetic"),
                caption("Figure"),
            ),
        ).to.deep.equal(["Figure ", "Figure ", "Figure ", "Figure ", "Figure ", "Figure ", "Figure ", "Figure 782"]);
    });

    it("should leave blank the fields whose switches aren't followed, and the fields after them until the count starts again", () => {
        for (const identifier of [
            "Figure \\r",
            "Figure \\r five",
            "Figure \\s",
            "Figure \\c \\r 2",
            "Figure \\r 2 \\c",
            "Figure \\c \\n",
            "Figure \\s 1 \\r 2",
            "Figure bookmark \\r 2",
            "Figure bookmark \\* ROMAN",
            "Figure \\* ROMAN \\* roman",
            "Figure \\x",
            "Figure \\*",
        ]) {
            expect(
                captionsOf(caption("Figure"), caption(identifier), caption("Figure"), caption("Figure \\r 3"), caption("Table")),
            ).to.deep.equal(["Figure 1", "Figure ", "Figure ", "Figure 3", "Table 1"], identifier);
        }
    });

    it("should count an identifier in any capitals or in quotes as the same one, as Word does", () => {
        // word-seq Q6 and Q9
        expect(captionsOf(caption("Cap"), caption("cap"), caption("Cap"), caption("CAP"), caption('"Cap"'))).to.deep.equal([
            "Cap 1",
            "cap 2",
            "Cap 3",
            "CAP 4",
            '"Cap" 5',
        ]);
    });

    it("should leave blank a SEQ field with a bookmark, without changing the count, as Word doesn't", () => {
        // word-seq Q9: Word writes the number of the SEQ field at the bookmark, which can come after it
        expect(captionsOf(caption("Bm"), caption("Bm target"), caption("Bm"))).to.deep.equal(["Bm 1", "Bm ", "Bm 2"]);
    });

    it("should leave blank a SEQ field without an identifier, or with one Word doesn't have, and those of its letters after it", () => {
        expect(captionsOf(caption("Figure"), caption("1Figure"), caption("Figure"))).to.deep.equal(["Figure 1", "1Figure ", "Figure 2"]);
        expect(captionsOf(caption("Figure"), caption("Figure-1"), caption("Figure-1 \\r 3"))).to.deep.equal([
            "Figure 1",
            "Figure-1 ",
            "Figure-1 ",
        ]);
        expect(
            paragraphsOf(
                formatBody(
                    new File({
                        pageNumbers: NO_PAGES,
                        sections: [{ children: [new Paragraph({ children: [new SimpleField("SEQ", "9")] })] }],
                    }),
                ),
            ).map(textOf),
        ).to.deep.equal(["9"]);
    });

    describe("\\s", () => {
        const heading = (level: (typeof HeadingLevel)[keyof typeof HeadingLevel], text: string): Paragraph =>
            new Paragraph({ heading: level, children: [new TextRun(text)] });

        it("should start the count again after each heading of the level given or a higher one, as Word does", () => {
            // word-seq Q7
            expect(
                captionsOf(
                    heading(HeadingLevel.HEADING_1, "Chapter"),
                    caption("Sec \\s 1"),
                    caption("Sec \\s 1"),
                    caption("Sub \\s 2"),
                    heading(HeadingLevel.HEADING_2, "Section"),
                    caption("Sec \\s 1"),
                    caption("Sub \\s 2"),
                    caption("Sub \\s 2"),
                    heading(HeadingLevel.HEADING_1, "Chapter"),
                    caption("Sec \\s 1"),
                    caption("Sub \\s 2"),
                    caption("Sec"),
                    caption("Sub"),
                    heading(HeadingLevel.HEADING_2, "Section"),
                    caption("Sub \\s 2"),
                    caption("Sec \\s 1"),
                ),
            ).to.deep.equal([
                "Chapter",
                "Sec 1",
                "Sec 2",
                "Sub 1",
                "Section",
                "Sec 3",
                "Sub 1",
                "Sub 2",
                "Chapter",
                "Sec 1",
                "Sub 1",
                "Sec 2",
                "Sub 2",
                "Section",
                "Sub 1",
                "Sec 3",
            ]);
        });

        it("should count on before the first heading, and from a SEQ field in the heading itself", () => {
            expect(
                captionsOf(
                    caption("Sec \\s 1"),
                    caption("Sec \\s 1"),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun("Sec "), new SequentialIdentifier("Sec \\s 1")],
                    }),
                    caption("Sec \\s 1"),
                ),
            ).to.deep.equal(["Sec 1", "Sec 2", "Sec 1", "Sec 2"]);
        });

        it("should leave blank a field after a heading when a field since it didn't count on, or a paragraph's level isn't clear", () => {
            expect(
                captionsOf(heading(HeadingLevel.HEADING_1, "Chapter"), caption("Sec \\r 5"), caption("Sec \\s 1"), caption("Sec \\r 2")),
            ).to.deep.equal(["Chapter", "Sec 5", "Sec ", "Sec 2"]);
            expect(captionsOf(heading(HeadingLevel.HEADING_1, "Chapter"), caption("Sec \\s 2"), caption("Sec \\s 1"))).to.deep.equal([
                "Chapter",
                "Sec 1",
                "Sec ",
            ]);
            expect(captionsOf(caption("Sec \\c"), caption("Sec \\s 1"))).to.deep.equal(["Sec 0", "Sec "]);
            expect(
                captionsOf(
                    heading(HeadingLevel.HEADING_1, "Chapter"),
                    new Paragraph({ outlineLevel: 0, children: [new TextRun("Outline")] }),
                    caption("Sec \\s 1"),
                    caption("Sec \\r 1"),
                    heading(HeadingLevel.HEADING_1, "Chapter"),
                    caption("Sec \\s 1"),
                ),
            ).to.deep.equal(["Chapter", "Outline", "Sec ", "Sec 1", "Chapter", "Sec 1"]);
            expect(captionsOf(new Paragraph({ outlineLevel: 0, children: [new TextRun("Outline")] }), caption("Sec \\s 1"))).to.deep.equal([
                "Outline",
                "Sec ",
            ]);
        });

        it("should leave blank a field before the first heading when the count before it isn't known", () => {
            expect(captionsOf(caption("Sec \\x"), caption("Sec \\s 1"))).to.deep.equal(["Sec ", "Sec "]);
        });
    });

    it("should leave the SEQ numbers of headings out of the entries of a table of contents filled in from them, as Word does", () => {
        // word-seq Q11: Word doesn't count the entries either
        const heading = (title: string): Paragraph =>
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`${title} `), new SequentialIdentifier(title)] });
        const body = formatBody(
            new File({
                pageNumbers: NO_PAGES,
                sections: [{ children: [new TableOfContents("Contents"), heading("Chapter"), heading("Chapter")] }],
            }),
        );
        const table = (body as { readonly "w:body": readonly unknown[] })["w:body"].find((element) => "w:sdt" in (element as object));

        // The tab before each entry's page number isn't text here
        expect(textOf(table)).to.equal("Chapter Chapter ");
        expect(paragraphsOf(body).map(textOf)).to.deep.equal(["Chapter 1", "Chapter 2"]);
    });

    it("should count simple SEQ fields too, and write their numbers into them", () => {
        // word-seq Q10
        expect(
            captionsOf(
                caption("Figure"),
                new Paragraph({ children: [new SimpleField("SEQ Figure \\* ROMAN", "x")] }),
                new Paragraph({ children: [new SimpleField("SEQ Figure \\x", "kept")] }),
                caption("Figure \\r 7"),
                // Written without a result
                new Paragraph({ children: [new SimpleField("SEQ Figure")] }),
                new Paragraph({ children: [new SimpleField("SEQ Figure \\x")] }),
            ),
        ).to.deep.equal(["Figure 1", "II", "kept", "Figure 7", "8", ""]);
    });

    it("should count the SEQ fields in text boxes and hidden text with those around them, as Word does", () => {
        // word-seq Q8 and Q14
        const file = new File({
            pageNumbers: NO_PAGES,
            styles: { paragraphStyles: [{ id: "Hidden", name: "Hidden", run: { vanish: true } }] },
            sections: [
                {
                    children: [
                        caption("Box"),
                        new Textbox({ style: { width: "1in", height: "1in" }, children: [caption("Box")] }),
                        new Paragraph({ style: "Hidden", children: [new SequentialIdentifier("Box")] }),
                        caption("Box"),
                    ],
                },
            ],
        });

        expect(paragraphsOf(formatBody(file)).map(textOf)).to.deep.equal(["Box 1", "Box 2", "3", "Box 4"]);
    });

    it("should leave blank the SEQ fields in deleted and moved text, and not count those in mc:Fallback", () => {
        const run = (instruction: string): IXmlableObject => ({
            "w:r": [
                { "w:fldChar": { _attr: { "w:fldCharType": "begin" } } },
                { "w:instrText": [instruction] },
                { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } },
                { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
            ],
        });
        const body: IXmlableObject = {
            "w:body": [
                { "w:p": [run("SEQ Figure")] },
                { "w:p": [{ "w:del": [run("SEQ Figure")] }] },
                { "w:p": [{ "w:moveFrom": [run("SEQ Table")] }] },
                { "w:p": [run("SEQ Figure \\r 3"), run("SEQ Table")] },
                {
                    "w:p": [
                        { "mc:AlternateContent": [{ "mc:Choice": [run("SEQ Box")] }, { "mc:Fallback": [{ "w:del": [run("SEQ Box")] }] }] },
                        run("SEQ Box"),
                    ],
                },
            ],
        };
        fillSequenceNumbers(body, { stack: [] } as unknown as IContext);

        expect(paragraphsOf(body).map(textOf)).to.deep.equal(["1", "", "", "3", "12"]);
    });

    it("should number the SEQ fields of identifiers in headers, footers and notes, and leave those there blank and clean, as Word does", () => {
        // word-seq Q12 and Q13: Word writes the ones there as an error, "Error! Main Document Only."
        const file = new File({
            pageNumbers: NO_PAGES,
            footnotes: { 1: { children: [caption("Note")] } },
            endnotes: { 1: { children: [caption("End")] } },
            sections: [
                {
                    headers: { default: new Header({ children: [caption("Header")] }) },
                    footers: { default: new Footer({ children: [new Paragraph({ children: [new SimpleField("SEQ Footer")] })] }) },
                    children: [
                        new Paragraph({ children: [new TextRun("Note "), new SequentialIdentifier("Note"), new FootnoteReferenceRun(1)] }),
                        ...["Header", "Footer", "End", "Note"].map(caption),
                    ],
                },
            ],
        });
        const body = formatBody(file);

        expect(paragraphsOf(body).map(textOf)).to.deep.equal(["Note 1", "Header 1", "Footer 1", "End 1", "Note 2"]);
        expect(dirtyOf(body)).to.deep.equal([false, false, false, false, false]);
        const partOf = (wrapper: { readonly View: { readonly prepForXml: unknown } }): IXmlableObject =>
            new Formatter().format(wrapper.View as never, { file, viewWrapper: wrapper, stack: [] } as unknown as IContext);
        const [header] = file.Headers;
        expect(textOf(partOf(header))).to.equal("Header ");
        expect(dirtyOf(partOf(header))).to.deep.equal([false]);
        expect(textOf(partOf(file.FootNotes))).to.contain("Note ");
        expect(dirtyOf(partOf(file.FootNotes))).to.deep.equal([false]);
        expect(dirtyOf(partOf(file.Endnotes))).to.deep.equal([false]);
    });

    it("should leave blank the SEQ fields of identifiers that also have SEQ fields in comments, and write those there clean", () => {
        const file = new File({
            pageNumbers: NO_PAGES,
            comments: { children: [{ id: 0, children: [caption("Remark")] }] },
            sections: [{ children: ["Remark", "Figure"].map(caption) }],
        });

        expect(paragraphsOf(formatBody(file)).map(textOf)).to.deep.equal(["Remark ", "Figure 1"]);
        expect(dirtyOf(new Formatter().format(file.Comments, { file, stack: [] } as never))).to.deep.equal([false]);
    });

    it("should write SEQ fields in notes and comments dirty, as before, without page numbers", () => {
        const file = new File({
            footnotes: { 1: { children: [caption("Note")] } },
            comments: { children: [{ id: 0, children: [caption("Remark")] }] },
            sections: [{ children: [new Paragraph({ children: [new FootnoteReferenceRun(1)] })] }],
        });
        formatBody(file);

        expect(
            dirtyOf(new Formatter().format(file.FootNotes.View, { file, viewWrapper: file.FootNotes, stack: [] } as never)),
        ).to.deep.equal([true]);
        expect(dirtyOf(new Formatter().format(file.Comments, { file, stack: [] } as never))).to.deep.equal([true]);
    });

    it("should number the SEQ fields of a body written outside a document", () => {
        const body = new Body({ pageNumbers: NO_PAGES });
        body.push(caption("Figure"));
        body.push(caption("Figure"));

        expect(paragraphsOf(new Formatter().format(body)).map(textOf)).to.deep.equal(["Figure 1", "Figure 2"]);
    });

    it("should tell SEQ fields from other fields", () => {
        expect(isSequenceField(" SEQ Figure \\* ARABIC")).to.equal(true);
        expect(isSequenceField("seq Figure")).to.equal(true);
        expect(isSequenceField("SEQUENCE Figure")).to.equal(false);
        expect(isSequenceField("PAGEREF Figure")).to.equal(false);
        expect(sequenceNumbering({ stack: [] } as unknown as IContext).numberOf("SEQ Figure", "counted")).to.equal("1");
    });
});
