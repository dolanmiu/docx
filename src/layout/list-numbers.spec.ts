// cspell:ignore Aptos
import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { Table, TableCell, TableRow } from "@file/table";
import { numberTabStopOf } from "@file/table-of-contents/heading-entries";
import {
    AlignmentType,
    Bookmark,
    type BookmarkListNumber,
    Document,
    HeadingLevel,
    type IContext,
    type IPropertiesOptions,
    LevelFormat,
    LevelSuffix,
    Packer,
    Paragraph,
    TableOfContents,
    TextRun,
} from "docx";
import { textOf, unzip } from "tests/zip";

import { DEFAULT_MEASURER } from "../text-layout";
import { estimatePageNumbers, estimatePageNumbersWith } from "./estimate-page-numbers";
import { listNumbersOf } from "./list-numbers";
// @ts-expect-error -- Vite reads the document as a data URL, which TypeScript has no type for
import wordTocNumbersFont from "../../scripts/layout-probes/word-toc-numbers-font.docx?inline";
// @ts-expect-error -- Vite reads the document as a data URL, which TypeScript has no type for
import wordTocNumbers from "../../scripts/layout-probes/word-toc-numbers.docx?inline";

/** The list numbers of the bookmarks of a document, as its body is written */
const numbersOf = (options: IPropertiesOptions): Record<string, BookmarkListNumber> => {
    let numbers: ReadonlyMap<string, BookmarkListNumber> = new Map();
    const file = new File({
        ...options,
        pageNumbers: (body, context) => {
            numbers = listNumbersOf(body, context);
            return { bookmarks: new Map() };
        },
    });
    new Formatter().format(file.Document.View, { file, viewWrapper: file.Document, stack: [] } as unknown as IContext);
    return Object.fromEntries(numbers);
};

const LEVELS = [
    { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START },
    { level: 1, format: LevelFormat.DECIMAL, text: "%1.%2", alignment: AlignmentType.START },
];

/** A paragraph of a list at a level, with a bookmark of the name given */
const numbered = (name: string, reference: string, level = 0): Paragraph =>
    new Paragraph({ numbering: { reference, level }, children: [new Bookmark({ id: name, children: [new TextRun(name)] })] });

/** How wide Word measures a number for a table of contents' tab stop, in twips */
const widthOf = (text: string): number => DEFAULT_MEASURER.measureWidth(text, { font: "Aptos", size: 12 }) * 20;

describe("listNumbersOf", () => {
    it("gives the list number of each paragraph a bookmark starts, as its list writes it, with what follows it", () => {
        const numbers = numbersOf({
            numbering: {
                config: [
                    { reference: "list", levels: LEVELS },
                    { reference: "spaced", levels: [{ ...LEVELS[0], suffix: LevelSuffix.SPACE }] },
                ],
            },
            sections: [
                {
                    children: [
                        numbered("first", "list"),
                        numbered("inner", "list", 1),
                        numbered("second", "list"),
                        numbered("spaced", "spaced"),
                        new Paragraph({ children: [new Bookmark({ id: "plain", children: [new TextRun("Not numbered")] })] }),
                    ],
                },
            ],
        });

        expect(numbers).to.deep.equal({
            first: { text: "1.", separator: "tab", width: widthOf("1.") },
            inner: { text: "1.1", separator: "tab", width: widthOf("1.1") },
            second: { text: "2.", separator: "tab", width: widthOf("2.") },
            spaced: { text: "1.", separator: "space", width: widthOf("1.") },
        });
    });

    it("measures the number in Aptos 12 pt, as Word does for a table of contents, whatever the document's font", () => {
        const numbers = numbersOf({
            styles: { default: { document: { run: { font: "Courier New", size: 28 } } } },
            numbering: { config: [{ reference: "list", levels: LEVELS }] },
            sections: [{ children: [numbered("first", "list")] }],
        });

        // Aptos' figures are 0.534 of its size: 128.16 twips at 12 pt
        expect(numbers.first.width).to.be.closeTo(128.16 + widthOf("."), 0.01);
    });

    it("gives the numbers of paragraphs numbered by their style, and of those in tables", () => {
        const numbers = numbersOf({
            styles: {
                paragraphStyles: [{ id: "Numbered", name: "Numbered", paragraph: { numbering: { reference: "list", level: 0 } } }],
            },
            numbering: { config: [{ reference: "list", levels: LEVELS }] },
            sections: [
                {
                    children: [
                        new Paragraph({ style: "Numbered", children: [new Bookmark({ id: "styled", children: [new TextRun("Styled")] })] }),
                        new Table({ rows: [new TableRow({ children: [new TableCell({ children: [numbered("inCell", "list")] })] })] }),
                    ],
                },
            ],
        });

        expect(Object.fromEntries(Object.entries(numbers).map(([name, { text }]) => [name, text]))).to.deep.equal({
            styled: "1.",
            inCell: "2.",
        });
    });

    it("leaves out a number it doesn't write as Word does, such as one in a custom format", () => {
        const numbers = numbersOf({
            numbering: { config: [{ reference: "custom", levels: [{ ...LEVELS[0], format: LevelFormat.CUSTOM, text: "%1" }] }] },
            sections: [{ children: [numbered("custom", "custom")] }],
        });

        expect(numbers).to.deep.equal({});
    });

    it("gives no numbers for a body written without a document, whose lists it can't read", () => {
        const body = new Formatter().format(new Paragraph("Text"));

        expect(listNumbersOf(body, { stack: [] } as unknown as IContext)).to.deep.equal(new Map());
    });

    it("is how estimatePageNumbers, and the estimators of estimatePageNumbersWith, work out the numbers", () => {
        expect(estimatePageNumbers.listNumbers).to.equal(listNumbersOf);
        expect(estimatePageNumbersWith({ guess: true }).listNumbers).to.equal(listNumbersOf);
    });

    it("starts the entries of a document's numbered headings with their numbers, which are laid out with them", async () => {
        const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel], numbering: number): Paragraph =>
            new Paragraph({
                text,
                heading: level,
                numbering: { reference: "headings", level: numbering },
                pageBreakBefore: numbering === 0,
            });
        const doc = new Document({
            pageNumbers: estimatePageNumbers,
            numbering: {
                config: [
                    {
                        reference: "headings",
                        levels: [0, 1].map((level) => ({
                            level,
                            format: LevelFormat.DECIMAL,
                            text: level === 0 ? "%1" : "%1.%2",
                            alignment: AlignmentType.START,
                        })),
                    },
                ],
            },
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
                        heading("Main", HeadingLevel.HEADING_1, 0),
                        heading("Components", HeadingLevel.HEADING_2, 1),
                        heading("Later", HeadingLevel.HEADING_1, 0),
                    ],
                },
            ],
        });
        const xml = textOf(unzip(await Packer.toBuffer(doc)), "word/document.xml")!;
        const entries = [...xml.matchAll(/<w:p><w:pPr><w:pStyle w:val="TOC\d"\/>(.*?)<\/w:p>/g)].map(([, entry]) => ({
            left: /<w:tab w:val="left" w:pos="(\d+)"\/>/.exec(entry)?.[1],
            shown: [...entry.matchAll(/<w:t xml:space="preserve">([^<]*)<\/w:t>|<w:tab\/>/g)].map(([tab, text]) => text ?? tab).join(""),
        }));

        // As Word writes them when it updates the table (word-toc-numbers.docx TN1)
        expect(entries).to.deep.equal([
            { left: "480", shown: "1<w:tab/>Main<w:tab/>2" },
            { left: "960", shown: "1.1<w:tab/>Components<w:tab/>2" },
            { left: "480", shown: "2<w:tab/>Later<w:tab/>3" },
        ]);
    });

    describe("where Word puts the tab stop after a number, in the tables of contents Word filled in", () => {
        /** The entries of the table of contents of a document Word saved: its level, its numberText, its title and its left tab stop */
        const entriesOf = (dataUrl: string) => {
            const files = unzip(Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(",") + 1)), (character) => character.charCodeAt(0)));
            const xml = textOf(files, "word/document.xml")!;
            return [...xml.matchAll(/<w:p\b[^>]*><w:pPr><w:pStyle w:val="TOC(\d)"\/>(.*?)<\/w:p>/g)].map(([, level, entry]) => {
                const shown = [...entry.slice(entry.indexOf("<w:hyperlink")).matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g)].map(
                    ([, text]) => text ?? "\t",
                );
                const [numberText, title] = shown.join("").split("\t");
                return { level: Number(level), numberText, title, left: /<w:tab w:val="left" w:pos="(\d+)"\/>/.exec(entry)?.[1] };
            });
        };

        it("is past the number in Aptos 12 pt by 240 twips, and 240 a level, on multiples of 240 up to 1920 (TN1 to TN4)", () => {
            const entries = [...entriesOf(wordTocNumbers), ...entriesOf(wordTocNumbersFont)].filter(({ title }) =>
                /^TN[1-4] /.test(title ?? ""),
            );

            expect(entries).toHaveLength(22 + 10 + 9 + 10);
            for (const { level, numberText, left } of entries) {
                // Past 1920 a twip out at most, as Word's figures are 128.2 twips wide and the width tables' 128.16
                expect(numberTabStopOf(level, widthOf(numberText))).to.be.closeTo(Number(left), 1);
            }
        });

        it("isn't there for a number followed by a space or nothing, which is followed by a space (TN5)", () => {
            const entries = entriesOf(wordTocNumbers).filter(({ numberText }) => numberText.includes(" TN5 "));

            expect(entries.map(({ numberText, left }) => ({ numberText, left }))).to.deep.equal([
                { numberText: "1 TN5 space", left: undefined },
                { numberText: "1 TN5 nothing", left: undefined },
            ]);
        });
    });
});
