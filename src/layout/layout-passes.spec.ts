import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { Bookmark, type IContext, LineRuleType, PageReference, Paragraph, SimpleField, TextRun } from "docx";

import { layOutPasses } from "./layout-passes";
import { measurerOf } from "./measure-width";
import { type DocumentContent, readDocument } from "./read-document";

/** A document's content, read as it is written */
const contentOf = (children: readonly Paragraph[]): DocumentContent => {
    let content: DocumentContent | undefined;
    const file = new File({
        sections: [{ children }],
        pageNumbers: (body, context) => {
            content = readDocument(body, context);
            return { bookmarks: new Map() };
        },
    });
    new Formatter().format(file.Document.View, { file, viewWrapper: file.Document, stack: [] } as unknown as IContext);
    return content!;
};

describe("layOutPasses", () => {
    // Lines of 300 points, two to a page, and a page reference as wide as a line when it says 1, and as narrow as nothing
    // when it says 2 or nothing, so the bookmark after it is on page 2 when it says 1, and on page 1 when it says 2
    const line = { line: 6000, lineRule: LineRuleType.EXACT };
    const content = contentOf([
        new Paragraph({ spacing: line, children: [new TextRun("On page"), new PageReference("target")] }),
        new Paragraph({ spacing: line, children: [new Bookmark({ id: "target", children: [new TextRun("Target")] })] }),
    ]);
    const textOf = ({ pages }: ReturnType<typeof layOutPasses>): readonly string[] =>
        pages.flatMap(({ body }) => body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ text }) => text) : [])));

    it("should give the last pass, as settled, when its page numbers are those of the pass before", () => {
        const passes = layOutPasses(
            content,
            measurerOf((text) => text.length),
        );
        expect(passes.settled).to.equal(true);
        expect(textOf(passes)).to.deep.equal(["On page1", "Target"]);
    });

    it("should give the first pass, laid out without page numbers, as not settled, when they still change after three passes", () => {
        const passes = layOutPasses(
            content,
            measurerOf((text) => (text === "1" ? 1000 : text.length)),
        );
        expect(passes.settled).to.equal(false);
        expect(textOf(passes)).to.deep.equal(["On page", "Target"]);
    });

    it("should give the last pass, guessing, when the page numbers still change after three passes, with the guess on the first page they moved on", () => {
        // As above, with the first line in a font not in the width tables, which is a guess too, and a page after
        const withStart = contentOf([
            new Paragraph({
                spacing: line,
                children: [
                    new Bookmark({ id: "start", children: [new TextRun({ text: "On page", font: "Roboto" })] }),
                    new PageReference("target"),
                ],
            }),
            new Paragraph({ spacing: line, children: [new Bookmark({ id: "target", children: [new TextRun("Target")] })] }),
            new Paragraph({ pageBreakBefore: true, children: [new TextRun("After")] }),
        ]);
        const passes = layOutPasses(
            withStart,
            measurerOf((text) => (text === "1" ? 1000 : text.length)),
            true,
        );
        // The third pass, laid out with the second's 2, which puts the target back on page 1, where the second had it on page 2
        expect(passes.settled).to.equal(true);
        expect(textOf(passes)).to.deep.equal(["On page2", "Target", "After"]);
        expect(passes.pages.map(({ guesses }) => guesses)).to.deep.equal([
            ["a font not in the width tables", "page numbers that move when the pages are laid out with them"],
            undefined,
        ]);
        // Alone on its page
        expect(
            layOutPasses(
                content,
                measurerOf((text) => (text === "1" ? 1000 : text.length)),
                true,
            ).pages.map(({ guesses }) => guesses),
        ).to.deep.equal([["page numbers that move when the pages are laid out with them"]]);
        // Numbers that settle are no guess
        const settled = layOutPasses(
            withStart,
            measurerOf((text) => text.length),
            true,
        );
        expect(settled.pages.map(({ guesses }) => guesses)).to.deep.equal([["a font not in the width tables"], undefined]);
    });

    it("should stop each pass at a field whose number its format doesn't write, once a pass has placed it, so the passes settle", () => {
        // Page 10 with a picture whose x drops the digits before it, which Word hasn't been seen to. The first pass doesn't
        // know the page, the second stops at the reference, and so does the third, which hasn't placed the bookmark
        const pictured = contentOf([
            new Paragraph({ spacing: line, children: [new SimpleField('PAGEREF target \\# "x"', "?")] }),
            ...Array.from({ length: 18 }, () => new Paragraph({ spacing: line, children: [new TextRun("Line")] })),
            new Paragraph({ spacing: line, children: [new Bookmark({ id: "target", children: [new TextRun("Target")] })] }),
        ]);
        const passes = layOutPasses(
            pictured,
            measurerOf((text) => text.length),
        );
        expect(passes.settled).to.equal(true);
        expect(passes.stoppedAt).to.equal("a page number its format isn't written for yet");
    });
});
