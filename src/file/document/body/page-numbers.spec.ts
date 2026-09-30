import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { HeadingLevel, PageReference, Paragraph, SimpleField, TextRun } from "@file/paragraph";
import { Run } from "@file/paragraph/run";
import { createBegin, createEnd, createSeparate } from "@file/paragraph/run/field";
import { TableOfContents } from "@file/table-of-contents";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import { Body } from "./body";
import { type PageNumberEstimator, fillPageNumbers } from "./page-numbers";

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
    it("should write the page number of the bookmark into a page reference, between its separate and end", () => {
        const body = bodyWith([new Paragraph({ children: [new TextRun("See page "), new PageReference("target")] })], { target: "4" });

        expect(paragraphsOf(body)[0]).to.deep.equal({
            "w:p": [
                { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "See page "] }] },
                {
                    "w:r": [
                        { "w:fldChar": { _attr: { "w:fldCharType": "begin", "w:dirty": true } } },
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
                new Paragraph({ children: fieldWithResult('PAGEREF "target"', "1") }),
                new Paragraph({ children: fieldWithResult("PAGE", "1") }),
                new Paragraph({ children: fieldWithResult("PAGEREF", "1") }),
            ],
            { target: "3" },
        );

        expect(paragraphsOf(body).map(textOf)).to.deep.equal(["above", "ii", "3", "3", "1", "1"]);
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

    it("should leave the page references blank without an estimator", () => {
        const body = new Body();
        body.push(new Paragraph({ children: [new PageReference("target")] }));

        expect(textOf(paragraphsOf(new Formatter().format(body))[0])).to.equal("");
    });
});
