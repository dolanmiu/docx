import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Body } from "@file/document/body";
import { SectionType } from "@file/document/body/section-properties";
import { File } from "@file/file";
import {
    Bookmark,
    CarriageReturn,
    HeadingLevel,
    NoBreakHyphen,
    PageBreak,
    PageNumber,
    Paragraph,
    type ParagraphChild,
    SimpleField,
    Tab,
    TextRun,
} from "@file/paragraph";
import { Table, TableCell, TableRow } from "@file/table";
import { Textbox } from "@file/textbox";
import { DeletedTextRun, InsertedTextRun } from "@file/track-revision";
import type { IXmlableObject } from "@file/xml-components";

import { TableOfContents } from "./table-of-contents";
import { StyleLevel } from "./table-of-contents-properties";

type Options = ConstructorParameters<typeof File>[0];

/** The formatted body of a document */
const bodyOf = (options: Options): readonly IXmlableObject[] => {
    const file = new File(options);
    const tree = new Formatter().format(file.Document.View, { file, viewWrapper: file.Document, stack: [] });
    return tree["w:document"].find((child: IXmlableObject) => child["w:body"])["w:body"];
};

/** Every element named `name` in a formatted element, in order */
const elementsNamed = (element: unknown, name: string): readonly IXmlableObject[] => {
    if (typeof element !== "object" || element === null) {
        return [];
    }
    const found = Object.keys(element).includes(name) ? [element as IXmlableObject] : [];
    return [...found, ...Object.values(element).flatMap((child) => elementsNamed(child, name))];
};

const attributesOf = (element: IXmlableObject | undefined, name: string): Record<string, unknown> | undefined =>
    element === undefined ? undefined : [element[name]].flat().find((child) => child?._attr)?._attr;

/** The text of the `w:t` elements in a formatted element */
const textOf = (element: unknown): string =>
    elementsNamed(element, "w:t")
        .flatMap((text) => text["w:t"])
        .filter((part: unknown) => typeof part === "string")
        .join("");

/** The paragraphs in the content of the n-th table of contents of a body */
const tableOfContentsIn = (body: readonly IXmlableObject[], index = 0): readonly IXmlableObject[] =>
    body.filter((child) => child["w:sdt"])[index]["w:sdt"].find((child: IXmlableObject) => child["w:sdtContent"])["w:sdtContent"];

/** What each entry of a table of contents shows, leaving out the paragraph the field ends in */
const entriesIn = (body: readonly IXmlableObject[], index = 0) =>
    tableOfContentsIn(body, index)
        .slice(0, -1)
        .map((paragraph) => ({
            style: attributesOf(elementsNamed(paragraph, "w:pStyle")[0], "w:pStyle")?.["w:val"],
            title: textOf(paragraph),
        }));

/** The bookmarks on the headings of a body, by the heading's text */
const bookmarksIn = (body: readonly IXmlableObject[]): Record<string, string> =>
    Object.fromEntries(
        body
            .flatMap((child) => elementsNamed(child, "w:p"))
            .flatMap((paragraph) =>
                elementsNamed(paragraph, "w:bookmarkStart")
                    .map((start) => attributesOf(start, "w:bookmarkStart")?.["w:name"] as string)
                    .filter((name) => name.startsWith("_Toc"))
                    .map((name) => [textOf(paragraph), name]),
            ),
    );

const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph =>
    new Paragraph({ text, heading: level });

describe("Table of contents filled in from the headings", () => {
    it("writes an entry for each heading, linking to a bookmark on the heading and giving its page with a PAGEREF field", () => {
        const body = bodyOf({
            sections: [
                { children: [new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }), heading("Introduction")] },
            ],
        });

        const name = bookmarksIn(body).Introduction;
        const id = Number(name.replace("_Toc", ""));
        expect(body[1]).to.deep.equal({
            "w:p": [
                { "w:pPr": [{ "w:pStyle": { _attr: { "w:val": "Heading1" } } }] },
                { "w:bookmarkStart": { _attr: { "w:name": name, "w:id": id } } },
                { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Introduction"] }] },
                { "w:bookmarkEnd": { _attr: { "w:id": id } } },
            ],
        });
        expect(tableOfContentsIn(body)).to.deep.equal([
            {
                "w:p": [
                    {
                        "w:pPr": [
                            { "w:pStyle": { _attr: { "w:val": "TOC1" } } },
                            { "w:tabs": [{ "w:tab": { _attr: { "w:val": "right", "w:pos": 9026, "w:leader": "dot" } } }] },
                        ],
                    },
                    {
                        "w:r": [
                            { "w:fldChar": { _attr: { "w:fldCharType": "begin", "w:dirty": true } } },
                            { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, 'TOC \\h \\o "1-3"'] },
                            { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } },
                        ],
                    },
                    {
                        "w:hyperlink": [
                            { _attr: { "w:history": 1, "w:anchor": name } },
                            { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Introduction"] }] },
                            { "w:r": [{ "w:tab": {} }] },
                            {
                                "w:r": [
                                    { "w:fldChar": { _attr: { "w:fldCharType": "begin", "w:dirty": true } } },
                                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, `PAGEREF ${name} \\h`] },
                                    { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } },
                                    { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
                                ],
                            },
                        ],
                    },
                ],
            },
            { "w:p": [{ "w:r": [{ "w:fldChar": { _attr: { "w:fldCharType": "end" } } }] }] },
        ]);
    });

    it("lists the headings in the range of headingStyleRange (\\o), leaving out empty headings and other paragraphs", () => {
        const body = bodyOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-2" }),
                        heading("One"),
                        new Paragraph("Body text"),
                        new Paragraph({ text: "The title", heading: HeadingLevel.TITLE }),
                        heading("Two", HeadingLevel.HEADING_2),
                        heading("Three", HeadingLevel.HEADING_3),
                        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(" ")] }),
                    ],
                },
            ],
        });

        expect(entriesIn(body)).to.deep.equal([
            { style: "TOC1", title: "One" },
            { style: "TOC2", title: "Two" },
        ]);
        expect(Object.keys(bookmarksIn(body))).to.deep.equal(["One", "Two"]);
    });

    it("lists headings in tables and in later sections, but not in text boxes or in another table of contents", () => {
        const body = bodyOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-3" }),
                        new TableOfContents("Given", { contentChildren: [heading("In the given content")] }),
                        new Table({ rows: [new TableRow({ children: [new TableCell({ children: [heading("In a table")] })] })] }),
                        new Textbox({ style: { width: "1in", height: "1in" }, children: [heading("In a text box")] }),
                    ],
                },
                { properties: { type: SectionType.NEXT_PAGE }, children: [heading("In the next section")] },
            ],
        });

        expect(entriesIn(body).map(({ title }) => title)).to.deep.equal(["In a table", "In the next section"]);
    });

    it("lists the styles in stylesWithLevels (\\t) at their levels, by id or by name, before the heading styles", () => {
        const body = bodyOf({
            styles: {
                paragraphStyles: [
                    { id: "Chapter", name: "Chapter Title" },
                    { id: "Part", name: "Part Title" },
                ],
            },
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", {
                            headingStyleRange: "1-3",
                            stylesWithLevels: [
                                new StyleLevel("Chapter", 1),
                                new StyleLevel("part title", 2),
                                new StyleLevel("Heading1", 3),
                            ],
                        }),
                        new Paragraph({ text: "A chapter", style: "Chapter" }),
                        new Paragraph({ text: "A part", style: "Part" }),
                        heading("A heading"),
                        new Paragraph({ text: "Not listed", style: "Unknown" }),
                    ],
                },
            ],
        });

        expect(entriesIn(body)).to.deep.equal([
            { style: "TOC1", title: "A chapter" },
            { style: "TOC2", title: "A part" },
            { style: "TOC3", title: "A heading" },
        ]);
    });

    it("lists only the styles in stylesWithLevels when it is given without headingStyleRange", () => {
        const body = bodyOf({
            styles: { paragraphStyles: [{ id: "Chapter", name: "Chapter" }] },
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { stylesWithLevels: [new StyleLevel("Chapter", 1)] }),
                        new Paragraph({ text: "A chapter", style: "Chapter" }),
                        heading("A heading"),
                    ],
                },
            ],
        });

        expect(entriesIn(body).map(({ title }) => title)).to.deep.equal(["A chapter"]);
    });

    it("lists paragraphs by outline level with useAppliedParagraphOutlineLevel (\\u), from the paragraph, its style, the styles it is based on or a heading style", () => {
        const body = bodyOf({
            styles: {
                paragraphStyles: [
                    { id: "Outlined", name: "Outlined", paragraph: { outlineLevel: 1 } },
                    { id: "BasedOnOutlined", name: "Based On Outlined", basedOn: "Outlined" },
                    { id: "BasedOnHeading", name: "Based On Heading", basedOn: "Heading3" },
                    { id: "Loop", name: "Loop", basedOn: "Loop" },
                    { id: "BodyText", name: "Body Text", paragraph: { outlineLevel: 9 } },
                ],
            },
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { useAppliedParagraphOutlineLevel: true }),
                        new Paragraph({ text: "Its own", outlineLevel: 0 }),
                        new Paragraph({ text: "Its style's", style: "Outlined" }),
                        new Paragraph({ text: "Based on a style", style: "BasedOnOutlined" }),
                        new Paragraph({ text: "Based on a heading", style: "BasedOnHeading" }),
                        heading("A heading", HeadingLevel.HEADING_2),
                        new Paragraph({ text: "In a loop", style: "Loop" }),
                        new Paragraph({ text: "Body text", style: "BodyText" }),
                        new Paragraph("Normal"),
                    ],
                },
            ],
        });

        expect(entriesIn(body)).to.deep.equal([
            { style: "TOC1", title: "Its own" },
            { style: "TOC2", title: "Its style's" },
            { style: "TOC2", title: "Based on a style" },
            { style: "TOC3", title: "Based on a heading" },
            { style: "TOC2", title: "A heading" },
        ]);
    });

    it("lists outline levels only in the range of headingStyleRange when both are given", () => {
        const body = bodyOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-1", useAppliedParagraphOutlineLevel: true }),
                        new Paragraph({ text: "Level 1", outlineLevel: 0 }),
                        new Paragraph({ text: "Level 2", outlineLevel: 1 }),
                    ],
                },
            ],
        });

        expect(entriesIn(body).map(({ title }) => title)).to.deep.equal(["Level 1"]);
    });

    it("lists Heading 1 to 9 when no option says where the entries come from, as Word does", () => {
        const body = bodyOf({
            sections: [{ children: [new TableOfContents(), heading("One"), heading("Six", HeadingLevel.HEADING_6)] }],
        });

        expect(entriesIn(body).map(({ title }) => title)).to.deep.equal(["One", "Six"]);
    });

    it("stays empty for Word to fill in when it lists no headings, such as a table of figures", () => {
        const body = bodyOf({
            sections: [{ children: [new TableOfContents("Figures", { captionLabelIncludingNumbers: "Figure" }), heading("One")] }],
        });

        expect(tableOfContentsIn(body)).to.deep.equal([
            {
                "w:p": [
                    {
                        "w:r": [
                            { "w:fldChar": { _attr: { "w:fldCharType": "begin", "w:dirty": true } } },
                            { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, 'TOC \\c "Figure"'] },
                            { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } },
                        ],
                    },
                ],
            },
            { "w:p": [{ "w:r": [{ "w:fldChar": { _attr: { "w:fldCharType": "end" } } }] }] },
        ]);
        expect(bookmarksIn(body)).to.deep.equal({});
    });

    it("lists only the headings in the bookmark of entriesFromBookmark (\\b)", () => {
        const body = bodyOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { entriesFromBookmark: "Part", headingStyleRange: "1-3" }),
                        heading("Before"),
                        new Paragraph({
                            heading: HeadingLevel.HEADING_1,
                            children: [new Bookmark({ id: "Part", children: [new TextRun("In the part")] })],
                        }),
                        new Paragraph({
                            heading: HeadingLevel.HEADING_1,
                            children: [new Bookmark({ id: "Other", children: [new TextRun("After")] })],
                        }),
                    ],
                },
            ],
        });

        expect(entriesIn(body).map(({ title }) => title)).to.deep.equal(["In the part"]);
    });

    it("writes the text of the heading, with a field's result but not its instruction, and without deleted text", () => {
        const children: readonly ParagraphChild[] = [
            new TextRun({ children: ["Page ", PageNumber.CURRENT, " of"] }),
            new SimpleField("SEQ Chapter", "4"),
            new InsertedTextRun({ text: " inserted", id: 1, author: "A", date: "2020-01-01T00:00:00Z" }),
            new DeletedTextRun({ text: " deleted", id: 2, author: "A", date: "2020-01-01T00:00:00Z" }),
            new TextRun({ children: [" non", new NoBreakHyphen(), "breaking", new CarriageReturn(), "line"] }),
            new PageBreak(),
        ];
        const body = bodyOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-3" }),
                        new Paragraph({ heading: HeadingLevel.HEADING_1, children }),
                    ],
                },
            ],
        });

        expect(entriesIn(body)[0].title).to.equal("Page  of4 inserted non-breaking line");
    });

    it("writes tabs and line breaks in headings as spaces, unless preserveTabInEntries (\\w) and preserveNewLineInEntries (\\x) keep them", () => {
        const title = new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ children: [new Tab(), "A", new Tab(), "B"] }), new TextRun({ text: "C", break: 1 })],
        });
        const plain = bodyOf({ sections: [{ children: [new TableOfContents("Contents", { headingStyleRange: "1-3" }), title] }] });
        const kept = bodyOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", {
                            headingStyleRange: "1-3",
                            preserveTabInEntries: true,
                            preserveNewLineInEntries: true,
                        }),
                        title,
                    ],
                },
            ],
        });

        expect(tableOfContentsIn(plain)[0]["w:p"][2]).to.deep.equal({
            "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, " A B C"] }],
        });
        expect(tableOfContentsIn(kept)[0]["w:p"].slice(2, 4)).to.deep.equal([
            {
                "w:r": [
                    { "w:tab": {} },
                    { "w:t": [{ _attr: { "xml:space": "preserve" } }, "A"] },
                    { "w:tab": {} },
                    { "w:t": [{ _attr: { "xml:space": "preserve" } }, "B"] },
                ],
            },
            { "w:r": [{ "w:br": {} }, { "w:t": [{ _attr: { "xml:space": "preserve" } }, "C"] }] },
        ]);
    });

    it("writes entries without links when hyperlink (\\h) isn't set", () => {
        const body = bodyOf({ sections: [{ children: [new TableOfContents("Contents", { headingStyleRange: "1-3" }), heading("One")] }] });

        expect(elementsNamed(tableOfContentsIn(body), "w:hyperlink")).to.deep.equal([]);
        expect(elementsNamed(tableOfContentsIn(body), "w:instrText")[1]["w:instrText"][1]).to.equal(`PAGEREF ${bookmarksIn(body).One}`);
    });

    it("leaves out the page numbers at the levels in pageNumbersEntryLevelsRange (\\n), or at every level when it isn't a range", () => {
        const headings = [heading("One"), heading("Two", HeadingLevel.HEADING_2)];
        const pageNumbersIn = (pageNumbersEntryLevelsRange: string): readonly boolean[] =>
            tableOfContentsIn(
                bodyOf({
                    sections: [
                        {
                            children: [
                                new TableOfContents("Contents", { headingStyleRange: "1-3", pageNumbersEntryLevelsRange }),
                                ...headings,
                            ],
                        },
                    ],
                }),
            )
                .slice(0, -1)
                .map((paragraph) => JSON.stringify(paragraph).includes("PAGEREF"));

        expect(pageNumbersIn("2-2")).to.deep.equal([true, false]);
        expect(pageNumbersIn("all")).to.deep.equal([false, false]);
    });

    it("separates the titles from the page numbers with entryAndPageNumberSeparator (\\p) instead of a tab", () => {
        const body = bodyOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-3", entryAndPageNumberSeparator: " - " }),
                        heading("One"),
                    ],
                },
            ],
        });

        expect(tableOfContentsIn(body)[0]["w:p"][3]).to.deep.equal({ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, " - "] }] });
    });

    it("indents the entries below the first level as Word's TOC styles do, when the document doesn't have them", () => {
        const body = bodyOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-3" }),
                        heading("One"),
                        heading("Two", HeadingLevel.HEADING_2),
                        heading("Three", HeadingLevel.HEADING_3),
                    ],
                },
            ],
        });

        expect(
            tableOfContentsIn(body).map((paragraph) => attributesOf(elementsNamed(paragraph, "w:ind")[0], "w:ind")?.["w:left"]),
        ).to.deep.equal([undefined, 220, 440, undefined]);
    });

    it("uses the document's TOC styles, found by their name, without indenting the entries", () => {
        const body = bodyOf({
            styles: {
                paragraphStyles: [
                    { id: "TOC2", name: "TOC 2", paragraph: { indent: { left: 400 } } },
                    { id: "Verzeichnis3", name: "toc 3", paragraph: { indent: { left: 800 } } },
                ],
            },
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-3" }),
                        heading("Two", HeadingLevel.HEADING_2),
                        heading("Three", HeadingLevel.HEADING_3),
                    ],
                },
            ],
        });

        expect(entriesIn(body).map(({ style }) => style)).to.deep.equal(["TOC2", "Verzeichnis3"]);
        expect(elementsNamed(tableOfContentsIn(body), "w:ind")).to.deep.equal([]);
    });

    it("recognises a heading style by its name, such as a Word template's with an id in another language", () => {
        const body = bodyOf({
            externalStyles: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:style w:styleId="berschrift2"><w:name w:val="heading 2"/></w:style>
                    <w:style w:type="character" w:styleId="Heading1"><w:name w:val="Not a paragraph style"/></w:style>
                </w:styles>`,
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-3" }),
                        new Paragraph({ text: "Überschrift", style: "berschrift2" }),
                    ],
                },
            ],
        });

        expect(entriesIn(body)).to.deep.equal([{ style: "TOC2", title: "Überschrift" }]);
    });

    it("aligns the page numbers to the right of the text in the table of contents' section", () => {
        const widthsIn = (tree: readonly IXmlableObject[]): readonly unknown[] =>
            elementsNamed(tree, "w:sdt").map((table) => attributesOf(elementsNamed(table, "w:tabs")[0]["w:tabs"][0], "w:tab")?.["w:pos"]);
        const body = bodyOf({
            sections: [
                { children: [new TableOfContents("A4", { headingStyleRange: "1-3" })] },
                {
                    properties: { page: { size: { width: 12240 }, margin: { left: 1000, right: 1000 } } },
                    children: [new TableOfContents("Letter", { headingStyleRange: "1-3" }), heading("One")],
                },
            ],
        });

        expect(widthsIn(body)).to.deep.equal([9026, 10240]);
    });

    it("bookmarks a heading once for several tables of contents, with the same bookmark each time the document is written", () => {
        const file = new File({
            sections: [
                {
                    children: [
                        new TableOfContents("Short", { headingStyleRange: "1-1" }),
                        new TableOfContents("Long", { headingStyleRange: "1-2" }),
                        heading("One"),
                        heading("Two", HeadingLevel.HEADING_2),
                    ],
                },
            ],
        });
        const format = (): readonly IXmlableObject[] =>
            new Formatter().format(file.Document.View, { file, viewWrapper: file.Document, stack: [] })["w:document"][1]["w:body"];

        const first = format();
        expect(entriesIn(first, 0).map(({ title }) => title)).to.deep.equal(["One"]);
        expect(entriesIn(first, 1).map(({ title }) => title)).to.deep.equal(["One", "Two"]);
        expect(elementsNamed(first, "w:bookmarkStart")).to.have.length(2);
        expect(format()).to.deep.equal(first);
    });

    it("isn't filled in when it is given cachedEntries", () => {
        const body = bodyOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-3", cachedEntries: [{ title: "Given", level: 1 }] }),
                        heading("One"),
                    ],
                },
            ],
        });

        expect(entriesIn(body).map(({ title }) => title)).to.deep.equal(["Given"]);
        expect(bookmarksIn(body)).to.deep.equal({});
    });

    it("is filled in when a body is written without a document, recognising the heading styles by their ids", () => {
        const body = new Body();
        body.push(new TableOfContents("Contents", { headingStyleRange: "1-3" }));
        body.push(heading("One"));

        const tree = new Formatter().format(body)["w:body"];

        expect(entriesIn(tree)).to.deep.equal([{ style: "TOC1", title: "One" }]);
        expect(elementsNamed(tree, "w:tab")[0]["w:tab"]._attr["w:pos"]).to.equal(9026);
    });
});
