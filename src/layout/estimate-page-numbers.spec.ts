import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import {
    Bookmark,
    FrameAnchorType,
    HeadingLevel,
    type IContext,
    type IFrameOptions,
    type IPropertiesOptions,
    type IXmlableObject,
    PageBreak,
    PageReference,
    Paragraph,
    TabStopType,
    TableOfContents,
    TextRun,
} from "docx";

import { estimatePageNumbers } from "./estimate-page-numbers";

const contextOf = (file: File): IContext => ({ file, viewWrapper: file.Document, stack: [] }) as unknown as IContext;

/** The page numbers a document is written with */
const pageNumbersOf = (options: IPropertiesOptions): Record<string, string> => {
    let pages: ReadonlyMap<string, string> = new Map();
    const file = new File({
        ...options,
        pageNumbers: (body, context) => {
            ({ bookmarks: pages } = estimatePageNumbers(body, context));
            return { bookmarks: pages };
        },
    });
    new Formatter().format(file.Document.View, contextOf(file));
    return Object.fromEntries(pages);
};

// A text frame, which the layout doesn't follow yet
const FRAME: IFrameOptions = {
    type: "absolute",
    position: { x: 1000, y: 1000 },
    width: 2000,
    height: 1000,
    anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE },
};

const heading = (text: string, bookmark: string): Paragraph =>
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new Bookmark({ id: bookmark, children: [new TextRun(text)] })] });

describe("estimatePageNumbers", () => {
    it("should work out the page each bookmark starts on", () => {
        const pages = pageNumbersOf({
            sections: [
                {
                    children: [
                        heading("First", "first"),
                        new Paragraph({ children: [new TextRun("Text"), new PageBreak()] }),
                        heading("Second", "second"),
                    ],
                },
            ],
        });
        expect(pages).to.deep.include({ first: "1", second: "2" });
    });

    it("should lay the table of contents out with its page numbers, and again if they change how it wraps", () => {
        // An entry that just fits on a line without its page number, and wraps with it
        const long = "Heading ".repeat(9).trim();
        const pages = pageNumbersOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-1" }),
                        ...Array.from({ length: 3 }, (_, index) => heading(`${long} ${index}`, `h${index}`)),
                        new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9026 }], children: [new PageReference("h0")] }),
                    ],
                },
            ],
        });
        expect(pages).to.deep.include({ h0: "1", h1: "1", h2: "1" });
    });

    it("should leave the bookmarks after something it can't lay out without page numbers", () => {
        const pages = pageNumbersOf({
            sections: [
                {
                    children: [
                        heading("Before", "before"),
                        new Paragraph({ frame: FRAME, children: [new TextRun("In a text frame")] }),
                        heading("After", "after"),
                    ],
                },
            ],
        });
        expect(pages).to.deep.equal({ before: "1" });
    });

    it("should place nothing without a document to lay out", () => {
        expect(estimatePageNumbers({ "w:body": [] } as IXmlableObject, { stack: [] } as unknown as IContext)).to.deep.equal({
            bookmarks: new Map(),
        });
    });
});
