import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { HeadingLevel, PageNumber, PageReference, Paragraph, SimpleField, TextRun } from "@file/paragraph";
import { Run } from "@file/paragraph/run";
import { createBegin, createBeginDirtyUntilWritten, createEnd, createSeparate } from "@file/paragraph/run/field";
import { TableOfContents } from "@file/table-of-contents";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import { Body } from "./body";
import { type PageNumberEstimator, fillPageNumbers, fillPartPageNumbers } from "./page-numbers";
import { Footer, Header } from "../../header";

/** An estimator that places the bookmarks given */
const placing =
    (pages: Record<string, string>): PageNumberEstimator =>
    () => ({ bookmarks: new Map(Object.entries(pages)) });

/** Formats a body with the paragraphs, with its page references filled in */
const bodyWith = (paragraphs: readonly Paragraph[], pages: Record<string, string>): IXmlableObject => {
    const body = new Body({ pageNumbers: placing(pages) });
    for (const paragraph of paragraphs) {
        body.push(paragraph);
    }
    return new Formatter().format(body);
};

/** The text of the runs in a formatted paragraph, with its field results */
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
    if (name === "w:tab") {
        return "\t";
    }
    const content = (element as Record<string, unknown>)[name];
    return (Array.isArray(content) ? content : [content]).map(textOf).join("");
};

const paragraphsOf = (body: IXmlableObject): readonly unknown[] => (body as { readonly "w:body": readonly unknown[] })["w:body"];

/** The paragraphs of a formatted header or footer */
const partParagraphsOf = (part: IXmlableObject): readonly unknown[] =>
    (Object.values(part)[0] as readonly unknown[]).filter((element) => "w:p" in (element as object));

/** A field's instruction */
class Instruction extends XmlComponent {
    public constructor(instruction: string) {
        super("w:instrText");
        this.root.push(instruction);
    }
}

/** A field in runs of its own, as Word writes it, with the result it was written with */
const fieldWithResult = (instruction: string, result: string): readonly Run[] => [
    new Run({ children: [createBegin(false)] }),
    new Run({ children: [new Instruction(instruction)] }),
    new Run({ children: [createSeparate()] }),
    new TextRun(result),
    new Run({ children: [createEnd()] }),
];

describe("fillPageNumbers", () => {
    it("should write the page number of the bookmark into a page reference, between its separate and end, and write it clean", () => {
        const body = bodyWith([new Paragraph({ children: [new TextRun("See page "), new PageReference("target")] })], { target: "4" });

        expect(paragraphsOf(body)[0]).to.deep.equal({
            "w:p": [
                { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "See page "] }] },
                {
                    "w:r": [
                        { "w:fldChar": { _attr: { "w:fldCharType": "begin" } } },
                        { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "PAGEREF target"] },
                        { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } },
                        { "w:t": [{ _attr: { "xml:space": "preserve" } }, "4"] },
                        { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
                    ],
                },
            ],
        });
    });

    it("should write the page numbers as the estimator gives them, such as in roman numerals", () => {
        const body = bodyWith([new Paragraph({ children: [new PageReference("preface", { hyperlink: true })] })], { preface: "iv" });

        expect(textOf(paragraphsOf(body)[0])).to.equal("iv");
    });

    it("should leave blank the page references to bookmarks the estimator didn't place", () => {
        const body = bodyWith([new Paragraph({ children: [new PageReference("elsewhere")] })], { target: "4" });

        expect(textOf(paragraphsOf(body)[0])).to.equal("");
    });

    it("should replace the result a field was written with, in the runs after its separate", () => {
        const body = bodyWith(
            [
                new Paragraph({
                    children: [...fieldWithResult("PAGEREF target \\h", "99"), new TextRun(" after")],
                }),
            ],
            { target: "7" },
        );

        expect(textOf(paragraphsOf(body)[0])).to.equal("7 after");
    });

    it("should leave the fields that don't show a page's number as they are", () => {
        const body = bodyWith(
            [
                new Paragraph({ children: fieldWithResult("PAGEREF target \\p", "above") }),
                new Paragraph({ children: fieldWithResult("PAGEREF target \\* roman", "ii") }),
                new Paragraph({ children: fieldWithResult("PAGEREF target \\* MERGEFORMAT", "1") }),
                new Paragraph({ children: fieldWithResult('PAGEREF target \\# "00"', "03") }),
                new Paragraph({ children: fieldWithResult('PAGEREF "target"', "1") }),
                new Paragraph({ children: fieldWithResult("PAGE", "1") }),
                new Paragraph({ children: fieldWithResult("PAGEREF", "1") }),
            ],
            { target: "3" },
        );

        expect(paragraphsOf(body).map(textOf)).to.deep.equal(["above", "ii", "3", "03", "3", "1", "1"]);
    });

    it("should write the page numbers of page references in the results of other fields, such as a table of contents", () => {
        const body = bodyWith(
            [
                new Paragraph({
                    children: [
                        new Run({ children: [createBegin(true), new Instruction("TOC \\o"), createSeparate()] }),
                        new TextRun("Chapter\t"),
                        new PageReference("chapter"),
                        new Run({ children: [createEnd()] }),
                        new TextRun(" and "),
                        new PageReference("chapter"),
                    ],
                }),
            ],
            { chapter: "12" },
        );

        expect(textOf(paragraphsOf(body)[0])).to.equal("Chapter\t12 and 12");
    });

    it("should write the page number into a simple field that is a page reference", () => {
        const body = bodyWith(
            [
                new Paragraph({ children: [new SimpleField("PAGEREF target", "old")] }),
                new Paragraph({ children: [new SimpleField("PAGEREF elsewhere", "old")] }),
                new Paragraph({ children: [new SimpleField("DATE", "today"), new PageReference("target")] }),
            ],
            { target: "5" },
        );

        expect(paragraphsOf(body)[0]).to.deep.equal({
            "w:p": [
                {
                    "w:fldSimple": [
                        { _attr: { "w:instr": "PAGEREF target" } },
                        { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "5"] }] },
                    ],
                },
            ],
        });
        expect(paragraphsOf(body).slice(1).map(textOf)).to.deep.equal(["old", "today5"]);
    });

    it("should ignore field characters without a field to belong to", () => {
        const body = bodyWith([new Paragraph({ children: [new Run({ children: [createSeparate()] }), new TextRun("text")] })], {
            target: "1",
        });

        expect(textOf(paragraphsOf(body)[0])).to.equal("text");
    });

    it("should give the estimator the formatted body and its context, and leave the body as it is when nothing is placed", () => {
        const estimate = vi.fn(placing({}));
        const context = { stack: [] } as unknown as IContext;
        const body = { "w:body": [{ "w:p": [{ "w:r": [{ "w:t": ["text"] }] }] }] } as IXmlableObject;

        fillPageNumbers(body, context, estimate);

        expect(estimate).toHaveBeenCalledWith(body, context);
        expect(body).to.deep.equal({ "w:body": [{ "w:p": [{ "w:r": [{ "w:t": ["text"] }] }] }] });
    });

    it("should fill in the page numbers of a document's table of contents once it is filled in from the headings", () => {
        const estimate = vi.fn((body: IXmlableObject): ReturnType<PageNumberEstimator> => {
            // The headings are bookmarked by the time the estimator is given the body
            const names = [...JSON.stringify(body).matchAll(/"w:name":"(_Toc\d+)"/g)].map(([, name]) => name);
            return { bookmarks: new Map(names.map((name, index) => [name, String(index + 2)])) };
        });
        const file = new File({
            pageNumbers: estimate,
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-3" }),
                        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("One")] }),
                        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Two")] }),
                    ],
                },
            ],
        });
        const xml = new Formatter().format(file.Document.View, { file, viewWrapper: file.Document, stack: [] } as unknown as IContext);
        const [table] = paragraphsOf((xml as { readonly "w:document": readonly IXmlableObject[] })["w:document"][1]);

        expect(estimate).toHaveBeenCalledTimes(1);
        expect(textOf(table)).to.equal("One\t2Two\t3");
    });

    describe("numbers of pages", () => {
        const counting =
            (pageCount?: number, ...sectionPageCounts: readonly (number | undefined)[]): PageNumberEstimator =>
            () => ({ bookmarks: new Map(), ...(pageCount === undefined ? {} : { pageCount }), sectionPageCounts });
        const pageOf = (): Paragraph =>
            new Paragraph({ children: [new TextRun({ children: [PageNumber.TOTAL_PAGES_IN_SECTION, " of ", PageNumber.TOTAL_PAGES] })] });
        // The body's paragraphs, without the properties of its last section
        const formatted = (file: File): readonly unknown[] =>
            paragraphsOf(
                (
                    new Formatter().format(file.Document.View, { file, viewWrapper: file.Document, stack: [] } as unknown as IContext) as {
                        readonly "w:document": readonly IXmlableObject[];
                    }
                )["w:document"][1],
            ).filter((element) => "w:p" in (element as object));

        it("should write the number of pages of the document into NUMPAGES fields, and of their section into SECTIONPAGES fields", () => {
            const file = new File({
                pageNumbers: counting(5, 3, 2),
                sections: [
                    { children: [pageOf(), new Paragraph({ children: [new SimpleField("NUMPAGES", "old")] })] },
                    { children: [pageOf()] },
                ],
            });

            expect(formatted(file).map(textOf)).to.deep.equal(["3 of 5", "5", "", "2 of 5"]);
        });

        it("should leave the fields of numbers of pages it doesn't know, or that are in a format of their own, as they are", () => {
            const file = new File({
                pageNumbers: counting(undefined, undefined),
                sections: [
                    {
                        children: [
                            new Paragraph({ children: fieldWithResult("NUMPAGES", "4") }),
                            new Paragraph({ children: fieldWithResult("SECTIONPAGES", "2") }),
                            new Paragraph({ children: fieldWithResult("NUMPAGES \\* roman", "iv") }),
                            new Paragraph({ children: fieldWithResult('SECTIONPAGES \\# "00"', "02") }),
                        ],
                    },
                ],
            });

            expect(formatted(file).map(textOf)).to.deep.equal(["4", "2", "iv", "02"]);
            const formats = new File({
                pageNumbers: counting(4, 2),
                sections: [
                    {
                        children: [
                            new Paragraph({ children: fieldWithResult("NUMPAGES \\* roman", "iv") }),
                            new Paragraph({ children: fieldWithResult('SECTIONPAGES \\# "00"', "02") }),
                            new Paragraph({ children: fieldWithResult("NUMPAGES \\* MERGEFORMAT", "1") }),
                        ],
                    },
                ],
            });
            expect(formatted(formats).map(textOf)).to.deep.equal(["iv", "02", "4"]);
        });

        it("should write the numbers into the headers and footers once the body is written, for the sections whose pages they are on", () => {
            const header = new Header({ children: [pageOf(), new Paragraph({ children: [new PageReference("target")] })] });
            const footer = (): Footer => new Footer({ children: [pageOf()] });
            const file = new File({
                pageNumbers: () => ({ bookmarks: new Map([["target", "4"]]), pageCount: 7, sectionPageCounts: [2, 2, 3] }),
                sections: [
                    { headers: { default: header }, footers: { default: footer() }, children: [new Paragraph("a")] },
                    // The header and footer of the section before are on its pages too
                    { children: [new Paragraph("b")] },
                    { footers: { default: footer() }, children: [new Paragraph("c")] },
                ],
            });
            const partText = (wrapper: File["Headers"][number] | File["Footers"][number]): readonly string[] =>
                partParagraphsOf(
                    new Formatter().format(wrapper.View, { file, viewWrapper: wrapper, stack: [] } as unknown as IContext),
                ).map(textOf);
            const [firstHeader] = file.Headers;
            const [firstFooter, lastFooter] = file.Footers;

            // Not before the body is written
            expect(partText(firstHeader)).to.deep.equal([" of ", ""]);
            formatted(file);
            // The header is on the pages of sections of 2 and 3 pages, so the number of its section's pages is left blank
            expect(partText(firstHeader)).to.deep.equal([" of 7", "4"]);
            expect(partText(firstFooter)).to.deep.equal(["2 of 7"]);
            expect(partText(lastFooter)).to.deep.equal(["3 of 7"]);
        });

        it("should leave the numbers in headers blank without an estimator, or outside a document", () => {
            const file = new File({ sections: [{ headers: { default: new Header({ children: [pageOf()] }) }, children: [] }] });
            formatted(file);
            const [wrapper] = file.Headers;

            expect(
                partParagraphsOf(
                    new Formatter().format(wrapper.View, { file, viewWrapper: wrapper, stack: [] } as unknown as IContext),
                ).map(textOf),
            ).to.deep.equal([" of "]);
            expect(partParagraphsOf(new Formatter().format(wrapper.View, { stack: [] } as unknown as IContext)).map(textOf)).to.deep.equal([
                " of ",
            ]);
            // A header or footer with nothing to write
            expect(() => fillPartPageNumbers(undefined, { file } as unknown as IContext, 1)).not.to.throw();
        });
    });

    it("should leave the page references blank without an estimator", () => {
        const body = new Body();
        body.push(new Paragraph({ children: [new PageReference("target")] }));

        expect(textOf(paragraphsOf(new Formatter().format(body))[0])).to.equal("");
    });

    describe("fields written clean", () => {
        /** The field characters and instructions in an element, in order */
        const fieldPartsOf = (element: unknown): readonly Record<string, unknown>[] => {
            if (typeof element !== "object" || element === null) {
                return [];
            }
            const [name] = Object.keys(element);
            const content = (element as Record<string, unknown>)[name];
            if (name === "w:fldChar" || name === "w:instrText") {
                return [element as Record<string, unknown>];
            }
            return Array.isArray(content) ? content.flatMap(fieldPartsOf) : [];
        };

        /** Whether each field in an element is written dirty, by the first word of its instruction, in the order they begin */
        const dirtyFieldsOf = (element: unknown): readonly (readonly [string, boolean])[] => {
            const parts = fieldPartsOf(element);
            return parts.flatMap((part, index) => {
                const attributes = (part["w:fldChar"] as { readonly _attr: Record<string, unknown> } | undefined)?._attr;
                if (attributes?.["w:fldCharType"] !== "begin") {
                    return [];
                }
                const instruction = parts.slice(index + 1).find((next) => "w:instrText" in next)!["w:instrText"] as readonly unknown[];
                const [word] = instruction
                    .filter((text) => typeof text === "string")
                    .join("")
                    .trim()
                    .split(/\s+/);
                return [[word, attributes["w:dirty"] === true] as const];
            });
        };

        /** A document with a table of contents filled in from its headings, and a page reference to each heading */
        const documentWith = (pageNumbers: PageNumberEstimator | undefined, tableOptions: { readonly beginDirty?: boolean } = {}): File =>
            new File({
                ...(pageNumbers ? { pageNumbers } : {}),
                sections: [
                    {
                        children: [
                            new TableOfContents("Contents", { headingStyleRange: "1-3", ...tableOptions }),
                            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("One")] }),
                            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Two")] }),
                        ],
                    },
                ],
            });
        const bodyOf = (file: File): IXmlableObject =>
            (
                new Formatter().format(file.Document.View, { file, viewWrapper: file.Document, stack: [] } as unknown as IContext) as {
                    readonly "w:document": readonly IXmlableObject[];
                }
            )["w:document"][1];
        /** An estimator that puts the first of the headings' bookmarks on page 2, the next on 3, and so on, up to a number of them */
        const placingHeadings =
            (count = Infinity): PageNumberEstimator =>
            (body) => {
                const names = [...JSON.stringify(body).matchAll(/"w:name":"(_Toc\d+)"/g)].map(([, name]) => name).slice(0, count);
                return { bookmarks: new Map(names.map((name, index) => [name, String(index + 2)])) };
            };

        it("should write a table of contents filled in from the headings clean once all of its page numbers are written", () => {
            expect(dirtyFieldsOf(bodyOf(documentWith(placingHeadings())))).to.deep.equal([
                ["TOC", false],
                ["PAGEREF", false],
                ["PAGEREF", false],
            ]);
        });

        it("should leave a table of contents dirty, for Word to update, when one of its page numbers isn't written", () => {
            expect(dirtyFieldsOf(bodyOf(documentWith(placingHeadings(1))))).to.deep.equal([
                ["TOC", true],
                ["PAGEREF", false],
                ["PAGEREF", true],
            ]);
        });

        it("should keep a table of contents dirty or clean as its beginDirty says, when it is given", () => {
            expect(dirtyFieldsOf(bodyOf(documentWith(placingHeadings(), { beginDirty: true })))).to.deep.equal([
                ["TOC", true],
                ["PAGEREF", false],
                ["PAGEREF", false],
            ]);
            expect(dirtyFieldsOf(bodyOf(documentWith(placingHeadings(1), { beginDirty: false })))).to.deep.equal([
                ["TOC", false],
                ["PAGEREF", false],
                ["PAGEREF", true],
            ]);
        });

        it("should write page references and tables of contents dirty, as before, without an estimator", () => {
            expect(dirtyFieldsOf(bodyOf(documentWith(undefined)))).to.deep.equal([
                ["TOC", true],
                ["PAGEREF", true],
                ["PAGEREF", true],
            ]);
        });

        it("should leave dirty a table of contents not filled in from the headings, and fields written dirty by hand", () => {
            const body = bodyWith(
                [
                    new Paragraph({
                        children: [
                            new Run({ children: [createBegin(true), new Instruction("TOC \\o"), createSeparate()] }),
                            new PageReference("chapter"),
                            new Run({ children: [createEnd()] }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new Run({ children: [createBegin(true), new Instruction("PAGEREF chapter"), createSeparate()] }),
                            new Run({ children: [createEnd()] }),
                        ],
                    }),
                ],
                { chapter: "12" },
            );

            expect(dirtyFieldsOf(body)).to.deep.equal([
                ["TOC", true],
                ["PAGEREF", false],
                ["PAGEREF", true],
            ]);
            const unfilled = new File({
                pageNumbers: placingHeadings(),
                sections: [{ children: [new TableOfContents("Contents"), new Paragraph("No headings")] }],
            });
            expect(dirtyFieldsOf(bodyOf(unfilled))).to.deep.equal([["TOC", true]]);
        });

        it("should leave dirty a page reference whose result isn't the page's number", () => {
            const body = bodyWith([new Paragraph({ children: [new PageReference("target", { useRelativePosition: true })] })], {
                target: "3",
            });

            expect(dirtyFieldsOf(body)).to.deep.equal([["PAGEREF", true]]);
        });

        it("should leave a table of contents dirty when a field in a field in it is left dirty", () => {
            const tableReferringTo = (bookmark: string): Paragraph =>
                new Paragraph({
                    children: [
                        new Run({ children: [createBeginDirtyUntilWritten(), new Instruction("TOC \\o"), createSeparate()] }),
                        new Run({ children: [createBegin(false), new Instruction("IF 1 = 1"), createSeparate()] }),
                        new PageReference(bookmark),
                        new Run({ children: [createEnd()] }),
                        new Run({ children: [createEnd()] }),
                    ],
                });
            const body = bodyWith([tableReferringTo("elsewhere"), tableReferringTo("target")], { target: "3" });

            expect(dirtyFieldsOf(body)).to.deep.equal([
                ["TOC", true],
                ["IF", false],
                ["PAGEREF", true],
                ["TOC", false],
                ["IF", false],
                ["PAGEREF", false],
            ]);
        });

        it("should write the page references in headers and footers clean once their numbers are written", () => {
            const file = new File({
                pageNumbers: () => ({ bookmarks: new Map([["target", "4"]]) }),
                sections: [
                    {
                        headers: { default: new Header({ children: [new Paragraph({ children: [new PageReference("target")] })] }) },
                        children: [new Paragraph("a")],
                    },
                ],
            });
            bodyOf(file);
            const [wrapper] = file.Headers;

            expect(
                dirtyFieldsOf(new Formatter().format(wrapper.View, { file, viewWrapper: wrapper, stack: [] } as unknown as IContext)),
            ).to.deep.equal([["PAGEREF", false]]);
        });
    });
});
