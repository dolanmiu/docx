/**
 * Probes of what word-grid.ts left open about document grids, and of a header on pages of text down the page. Each probe
 * starts a page, and each line's text names its probe, so the lines can be found in a PDF saved from Word with pdftotext
 * -bbox-layout, which word-grid3.py reads. A4 with 1440 margins, so the text is 9026 twips wide, no space before or after,
 * single spaced, with the document's Normal in MS Mincho 10.5 and Times New Roman 10.5, as in word-grid.ts. The grid is
 * 360 twips a line, and `w:charSpace` 4096 adds a point to each character of a grid of lines and characters. In MS
 * Mincho 10.5, 42 ideographs fit across the page without a grid of characters, and 39 with it.
 *
 * H1:  a grid of lines only with `w:charSpace` 4096: 100 ideographs, for whether the characters are spaced
 * H2:  a footnote of 14 lines that goes on to the next page, on a grid of lines: how tall the continuation separator is,
 *      from where the lines of the footnote are on the next page
 * H3:  endnotes on a grid of lines: whether their lines are on the grid, and where the separator above them is. It is the
 *      last section, as the endnotes are at the end of the document
 * H4:  a header and a footer of 40 ideographs after their name, on a grid of lines and characters, which fit on one line
 *      unless the grid's point is added to each
 * H5:  a footnote of 38 ideographs after its name, on a grid of lines and characters, which fit on one line likewise
 * H6:  a table of one cell of 40 ideographs, 8810 twips wide inside its margins, on a grid of lines and characters: one
 *      line unless the grid's point is added, and how tall its lines are
 * H7:  100 ideographs in 2 columns of 4153 twips on a grid of lines and characters, 19 to a line without the grid's point
 *      and 18 with it, and on a grid that snaps to characters, whose characters are as far apart as they are across the
 *      page (214.9 twips) or in the column (218.6)
 * H8:  a table of one cell of 40 ideographs on a grid that snaps to characters with `w:charSpace` 4096: one line, or 38
 *      to a line on the grid of the page
 * H9:  100 ideographs spaced a point apart (`w:spacing` 20) on a grid of lines and characters: whether the grid's point is
 *      added to the run's
 * H10: a paragraph with `w:snapToGrid` off and a line of space before (`w:beforeLines`), on a grid of lines
 * H11: a table cell's second paragraph with a line of space before, on a grid of lines
 * VH1: a header of 4 lines that goes below the top margin, on pages of text down the page: whether the lines start below
 *      it
 *
 * docx can't write some of these, so it writes a marker that this script replaces in the XML: see `INJECTIONS`.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/word-grid3.ts, which writes build/word-probes/word-grid3.docx
 */
// cspell:ignore bbox linesAndChars snapToChars charSpace linePitch beforeLines tbRl
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    Document,
    DocumentGridType,
    EndnoteReferenceRun,
    FootnoteReferenceRun,
    Footer,
    Header,
    type ISectionOptions,
    Packer,
    PageTextDirectionType,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Run = ConstructorParameters<typeof TextRun>[0] & object;
type Grid = NonNullable<NonNullable<ISectionOptions["properties"]>["grid"]>;

const LINES: Grid = { type: DocumentGridType.LINES, linePitch: 360 };
const LINES_AND_CHARS: Grid = { type: DocumentGridType.LINES_AND_CHARS, linePitch: 360, charSpace: 4096 };

const IDEOGRAPH = "永";
const ideographs = (count: number): string => IDEOGRAPH.repeat(count);

/** A run in a font, at a size in points, for both its Latin and East Asian text */
const inFont = (text: string, font: string, points: number, more: Run = {}): TextRun =>
    new TextRun({ text, font: { ascii: font, hAnsi: font, eastAsia: font, cs: font }, size: points * 2, ...more });
const tnr = (text: string, points = 12): TextRun => inFont(text, "Times New Roman", points);
const mincho = (text: string, more: Run = {}): TextRun => inFont(text, "MS Mincho", 10.5, more);

/** A small label before a probe of characters on a line */
const label = (text: string): Paragraph => new Paragraph({ children: [tnr(text, 8)] });
/** Lines of Times New Roman, each a paragraph that names its probe and its number */
const lines = (name: string, count: number, points = 12): readonly Paragraph[] =>
    Array.from({ length: count }, (_, i) => new Paragraph({ children: [tnr(`${name} ${i + 1}`, points)] }));
/** A paragraph of lines broken by line breaks, each naming its probe and its number */
const broken = (name: string, count: number, points = 10): Paragraph =>
    new Paragraph({
        children: Array.from({ length: count }, (_, i) => [
            ...(i > 0 ? [new TextRun({ break: 1 })] : []),
            tnr(`${name} ${i + 1}`, points),
        ]).flat(),
    });
/** A table of one cell as wide as the page's text */
const cell = (...children: readonly Paragraph[]): Table =>
    new Table({
        columnWidths: [9026],
        rows: [new TableRow({ children: [new TableCell({ width: { size: 9026, type: WidthType.DXA }, children: [...children] })] })],
    });

// H10, H11: the space before in lines, and snapToGrid off, which docx doesn't write
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    [/w:before="7771"/g, 'w:beforeLines="100"'],
    [/<w:pStyle w:val="SnapOff"\/>/g, '<w:pStyle w:val="SnapOff"/><w:snapToGrid w:val="0"/>'],
];

const FOOTNOTES: Readonly<Record<number, { readonly children: readonly Paragraph[] }>> = {
    1: { children: [broken("H2 note", 14)] },
    2: { children: [new Paragraph({ children: [mincho(`H5 ${ideographs(38)}`)] })] },
};
const ENDNOTES: Readonly<Record<number, { readonly children: readonly Paragraph[] }>> = {
    1: { children: [broken("H3 end", 5)] },
};

const sections: ISectionOptions[] = [
    // H1
    {
        properties: { grid: { ...LINES, charSpace: 4096 } },
        children: [label("H1"), new Paragraph({ children: [mincho(ideographs(100))] })],
    },

    // H2: 34 lines of the text, the 30th with the reference, then 10 more on the next page
    {
        properties: { grid: LINES },
        children: [
            ...lines("H2 body", 29),
            new Paragraph({ children: [tnr("H2 body 30"), new FootnoteReferenceRun(1)] }),
            ...lines("H2 more", 14),
        ],
    },

    // H4 and H5: a header and footer of their own, and the next section has its own empty ones
    {
        properties: { grid: LINES_AND_CHARS },
        headers: { default: new Header({ children: [new Paragraph({ children: [mincho(`H4 ${ideographs(40)}`)] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ children: [mincho(`H4 ${ideographs(40)}`)] })] }) },
        children: [
            new Paragraph({ children: [mincho(`H4 body ${ideographs(10)}`)] }),
            new Paragraph({ children: [mincho(`H5 body ${ideographs(10)}`), new FootnoteReferenceRun(2)] }),
        ],
    },

    // H6
    {
        properties: { grid: LINES_AND_CHARS },
        headers: { default: new Header({ children: [new Paragraph("")] }) },
        footers: { default: new Footer({ children: [new Paragraph("")] }) },
        children: [label("H6"), cell(new Paragraph({ children: [mincho(ideographs(40))] })), ...lines("H6 after", 2)],
    },

    // H7a, H7b: 2 columns, of lines and characters, and snapping to characters
    {
        properties: { grid: LINES_AND_CHARS, column: { count: 2, space: 720 } },
        children: [label("H7a"), new Paragraph({ children: [mincho(ideographs(100))] })],
    },
    {
        properties: { grid: { type: DocumentGridType.SNAP_TO_CHARS, linePitch: 360 }, column: { count: 2, space: 720 } },
        children: [label("H7b"), new Paragraph({ children: [mincho(ideographs(100))] })],
    },

    // H8
    {
        properties: { grid: { type: DocumentGridType.SNAP_TO_CHARS, linePitch: 360, charSpace: 4096 } },
        children: [label("H8"), cell(new Paragraph({ children: [mincho(ideographs(40))] }))],
    },

    // H9
    {
        properties: { grid: LINES_AND_CHARS },
        children: [label("H9"), new Paragraph({ children: [mincho(ideographs(100), { characterSpacing: 20 })] })],
    },

    // H10: 3 lines, then a paragraph with snapToGrid off and a line before, then 3 lines. H11: a cell of 2 paragraphs, the
    // second with a line before
    {
        properties: { grid: LINES },
        children: [
            ...lines("H10 before", 3),
            new Paragraph({ style: "SnapOff", spacing: { before: 7771 }, children: [tnr("H10 off")] }),
            ...lines("H10 after", 3),
            cell(new Paragraph({ children: [tnr("H11 one")] }), new Paragraph({ spacing: { before: 7771 }, children: [tnr("H11 two")] })),
            ...lines("H11 after", 2),
        ],
    },

    // VH1: a header of 4 lines of Times New Roman 10.5 from 720, which ends 246 twips below the top margin
    {
        properties: { page: { textDirection: PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT, margin: { top: 1440, header: 720 } } },
        headers: {
            default: new Header({
                children: [1, 2, 3, 4].map((i) => new Paragraph({ children: [inFont(`VH1 head ${i}`, "Times New Roman", 10.5)] })),
            }),
        },
        footers: { default: new Footer({ children: [new Paragraph("")] }) },
        children: Array.from({ length: 5 }, (_, i) => new Paragraph({ children: [mincho(`VH1 ${i + 1} ${ideographs(70)}`)] })),
    },

    // H3, last: 3 lines with an endnote of 5
    {
        properties: { grid: LINES },
        headers: { default: new Header({ children: [new Paragraph("")] }) },
        children: [...lines("H3 body", 2), new Paragraph({ children: [tnr("H3 body 3"), new EndnoteReferenceRun(1)] })],
    },
];

const doc = new Document({
    styles: {
        default: {
            document: {
                run: {
                    font: { ascii: "Times New Roman", hAnsi: "Times New Roman", eastAsia: "MS Mincho" },
                    size: 21,
                    language: { eastAsia: "ja-JP" },
                },
                paragraph: { spacing: { before: 0, after: 0, line: 240 } },
            },
        },
        paragraphStyles: [{ id: "SnapOff", name: "Snap Off", basedOn: "Normal" }],
    },
    footnotes: FOOTNOTES,
    endnotes: ENDNOTES,
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const xml = await zip.file("word/document.xml")!.async("string");
    zip.file(
        "word/document.xml",
        INJECTIONS.reduce((text, [marker, replacement]) => text.replace(marker, replacement), xml),
    );
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-grid3.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
