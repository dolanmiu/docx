/**
 * Probes of paragraph borders, automatic spacing and lengths in characters and lines, for what `word-watertight-text`'s
 * TX5 to TX7 left open. Each probe starts a page, and each line's text names its probe, so the lines can be found in a
 * PDF saved from Word with pdftotext -bbox-layout, which word-paragraph-formats.py reads. Calibri 11, single spaced, no
 * space before or after, on A4 with 1440 margins, so the text is 1440 to 15398 twips down the page, 9026 twips wide, and
 * Word's lines are 268.55 twips. A thin border is single, 6 eighths of a point (15 twips) wide and 1 point (20 twips) from
 * the text, as `thematicBreak`'s.
 *
 * A0: automatic space before the document's first paragraph
 * B1: the space before and after a paragraph with a top or bottom border, against the space of the paragraph next to it:
 *     whether they are the larger of the two outside the border, or both, one each side of it
 * B2: paragraphs with the same borders, and space before and after, without and with a between border
 * B3: a paragraph with a top border and space before, at the top of a page it flows onto
 * B4: a paragraph whose bottom border (B4a), or the space below a between border (B4b), doesn't fit at the bottom of the
 *     page, though its line does
 * B5: two paragraphs with the same borders but other indents, spacing, colour, borders at the side or alignment: whether
 *     Word joins them into one box
 * B6: the room borders of each style take, 6 and 18 eighths of a point wide, and with a shadow
 * B7: a paragraph with borders that breaks across pages
 * B8: a paragraph with borders in a table cell
 * B9: contextual spacing between paragraphs with borders
 * B10: borders on paragraphs exactly 12 points apart
 * A1: automatic spacing in a bulleted list, and between a bulleted and a numbered one
 * A2: automatic spacing with contextual spacing
 * A4: automatic spacing before and after a table; A5: with a space before or after of its own; A6: against the next
 *     paragraph's space before
 * A7: automatic spacing in a footnote
 * A8: automatic space before a paragraph with a page break before it
 * C1 to C16: indents in characters with and without indents in twips, and in text of other sizes
 * L1: space before in lines in 20-point text; L2: in lines and in twips; L3: in lines and automatic
 * A3: automatic spacing in a header, last, as a section without a header of its own would have it
 *
 * docx can't write some of these, so it writes a marker that this script replaces in the XML: see `INJECTIONS`.
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    AlignmentType,
    BorderStyle,
    Document,
    FootnoteReferenceRun,
    Header,
    type IBorderOptions,
    type ISectionOptions,
    LevelFormat,
    LineRuleType,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
/** Plain lines before a probe, which fill the page up to where it goes */
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));
/** A probe of a few lines on a page of its own */
const lines = (...children: (Paragraph | Table)[]): ISectionOptions => ({ children });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

const border = (size: number, space: number, style: IBorderOptions["style"] = BorderStyle.SINGLE, color = "auto"): IBorderOptions => ({
    style,
    size,
    space,
    color,
});
const THIN = border(6, 1);
const BOX = { top: THIN, bottom: THIN };
const AUTO = { beforeAutoSpacing: true, afterAutoSpacing: true };

/** A table of one cell without borders or margins, as wide as the page's text */
const table = (...children: Paragraph[]): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: [new TableRow({ children: [new TableCell({ width: { size: 9026, type: WidthType.DXA }, children })] })],
    });

/**
 * The XML docx can't write, which replaces a marker it can: an indent in characters of a value no probe uses otherwise,
 * a space before or after in twips no probe uses, and a colour for a shadow. Each is [what docx writes, what replaces
 * it], in document.xml.
 */
const CHARS: Readonly<Record<number, string>> = {
    9001: 'w:leftChars="400"',
    9002: 'w:rightChars="400"',
    9003: 'w:hangingChars="200"',
    9007: 'w:leftChars="0"',
    9008: 'w:leftChars="400" w:firstLineChars="200"',
    9009: 'w:hangingChars="200"',
    9011: 'w:leftChars="400" w:hangingChars="200"',
    9014: 'w:leftChars="400" w:hangingChars="200"',
    9015: 'w:startChars="400"',
    9016: 'w:rightChars="400"',
};
const INJECTIONS: readonly (readonly [RegExp, string | ((match: string, ...groups: string[]) => string)])[] = [
    [/w:firstLineChars="(90\d\d)"/g, (_, marker: string) => CHARS[Number(marker)]],
    // L1: a space before of half a line; L2: a line, with 600 twips too; L3: an automatic space after, and a line
    [/w:before="7781"/g, 'w:beforeLines="50"'],
    [/w:before="7782"/g, 'w:before="600" w:beforeLines="100"'],
    [/w:after="7783"/g, 'w:afterLines="100"'],
    // B6: a border with a shadow
    [/w:color="ABCDEF"/g, 'w:color="auto" w:shadow="1"'],
];

/** A bordered paragraph and the one after it, which a probe measures the space between */
const pair = (probe: string, first: Options, second: Options): Paragraph[] => [
    line(`${probe} 1`, { border: BOX, ...first }),
    line(`${probe} 2`, { border: BOX, ...second }),
    line(`${probe} gap`),
];

const STYLES = [
    BorderStyle.SINGLE,
    BorderStyle.DOUBLE,
    BorderStyle.THICK,
    BorderStyle.DOTTED,
    BorderStyle.DASHED,
    BorderStyle.DOT_DASH,
    BorderStyle.DOT_DOT_DASH,
    BorderStyle.DASH_SMALL_GAP,
    BorderStyle.DASH_DOT_STROKED,
    BorderStyle.TRIPLE,
    BorderStyle.THIN_THICK_SMALL_GAP,
    BorderStyle.THICK_THIN_SMALL_GAP,
    BorderStyle.THIN_THICK_THIN_SMALL_GAP,
    BorderStyle.WAVE,
    BorderStyle.DOUBLE_WAVE,
    BorderStyle.THREE_D_EMBOSS,
    BorderStyle.THREE_D_ENGRAVE,
    BorderStyle.OUTSET,
    BorderStyle.INSET,
] as const;

/** B6: a style's borders at a size, top and bottom 0 points from the text, on every other of six paragraphs */
const styled = (style: string, size: number, shadow = false): Paragraph[] =>
    [1, 2, 3].flatMap((n) => {
        const edge = border(size, 0, style as IBorderOptions["style"], shadow ? "ABCDEF" : "auto");
        const name = `B6 ${style}${shadow ? "-shadow" : ""} ${size}`;
        return [line(`${name} plain ${n}`), line(`${name} box ${n}`, { border: { top: edge, bottom: edge } })];
    });

const notes: Record<number, { children: Paragraph[] }> = {
    1: { children: [line("A7 note 1", { spacing: AUTO }), line("A7 note 2", { spacing: AUTO })] },
};

const sections: ISectionOptions[] = [
    // A0: automatic space before the document's first paragraph
    lines(line("A0 first", { spacing: { beforeAutoSpacing: true } }), line("A0 second")),

    // B1: a bottom border with 400 after, before 200 before (a), and with 200 after, before 400 before (b); a top border
    // with 200 before, after 400 after (c), and with 400 before, after 200 after (d)
    lines(
        line("B1 start"),
        line("B1a bordered", { border: { bottom: THIN }, spacing: { after: 400 } }),
        line("B1a next", { spacing: { before: 200 } }),
        line("B1b bordered", { border: { bottom: THIN }, spacing: { after: 200 } }),
        line("B1b next", { spacing: { before: 400 } }),
        line("B1c above", { spacing: { after: 400 } }),
        line("B1c bordered", { border: { top: THIN }, spacing: { before: 200 } }),
        line("B1d above", { spacing: { after: 200 } }),
        line("B1d bordered", { border: { top: THIN }, spacing: { before: 400 } }),
        line("B1 end"),
    ),

    // B2: five paragraphs with the same top and bottom borders, 100 before and 200 after, without (a) and with (b) a
    // between border
    lines(
        line("B2 above"),
        ...[1, 2, 3, 4, 5].map((n) => line(`B2a ${n}`, { border: BOX, spacing: { before: 100, after: 200 } })),
        line("B2 middle"),
        ...[1, 2, 3, 4, 5].map((n) => line(`B2b ${n}`, { border: { ...BOX, between: THIN }, spacing: { before: 100, after: 200 } })),
        line("B2 below"),
    ),

    // B3: 51 lines fill the page, so the paragraph with a top border and 400 before starts the next
    lines(...fill("B3", 51), line("B3 bordered", { border: { top: THIN }, spacing: { before: 400 } }), line("B3 after")),

    // B4a: 50 lines leave 530.5 twips, room for a line but not with its 460 of bottom border (3 points, 20 from the text)
    lines(...fill("B4a", 50), line("B4a bordered", { border: { bottom: border(24, 20) } }), line("B4a after")),
    // B4b: the same with only a between border, below the first of two paragraphs that share it
    lines(
        ...fill("B4b", 50),
        line("B4b first", { border: { between: border(24, 20) } }),
        line("B4b second", { border: { between: border(24, 20) } }),
        line("B4b after"),
    ),

    // B5: pairs of paragraphs with the same top and bottom borders, and something else different, or not (z)
    lines(
        line("B5 start"),
        ...pair("B5a", {}, { indent: { left: 720 } }),
        ...pair("B5b", {}, { indent: { right: 720 } }),
        ...pair("B5c", {}, { indent: { firstLine: 720 } }),
        ...pair("B5d", { spacing: { after: 100 } }, {}),
        ...pair(
            "B5e",
            {},
            { border: { top: border(6, 1, BorderStyle.SINGLE, "FF0000"), bottom: border(6, 1, BorderStyle.SINGLE, "FF0000") } },
        ),
        ...pair("B5f", {}, { border: { ...BOX, between: THIN } }),
        ...pair("B5g", {}, { border: { ...BOX, left: THIN } }),
        ...pair("B5h", {}, { alignment: AlignmentType.CENTER }),
        ...pair("B5z", { indent: { left: 720 } }, { indent: { left: 720 } }),
    ),

    // B6: each style at 6 and 18 eighths of a point, and single with a shadow, three styles to a page
    ...Array.from({ length: Math.ceil((STYLES.length + 1) / 3) }, (_, page) =>
        lines(
            ...[...STYLES.map((style) => [style, false] as const), [BorderStyle.SINGLE, true] as const]
                .slice(page * 3, page * 3 + 3)
                .flatMap(([style, shadow]) => [...styled(style, 6, shadow), ...styled(style, 18, shadow)]),
        ),
    ),

    // B7: 45 lines, then a paragraph of 12 lines with top and bottom borders, which breaks across the page
    lines(
        ...fill("B7", 45),
        new Paragraph({
            border: BOX,
            children: Array.from({ length: 12 }, (_, i) => new TextRun({ text: `B7 line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
        }),
        line("B7 after"),
    ),

    // B8: a paragraph with top and bottom borders in a table cell
    lines(line("B8 above"), table(line("B8 cell", { border: BOX })), line("B8 below")),

    // B9: contextual spacing, 200 before and after, on two paragraphs with the same borders (a), and on one with a bottom
    // border before one without (b)
    lines(
        line("B9 start"),
        line("B9a 1", { border: BOX, contextualSpacing: true, spacing: { before: 200, after: 200 } }),
        line("B9a 2", { border: BOX, contextualSpacing: true, spacing: { before: 200, after: 200 } }),
        line("B9 middle"),
        line("B9b 1", { border: { bottom: THIN }, contextualSpacing: true, spacing: { after: 200 } }),
        line("B9b 2", { contextualSpacing: true, spacing: { before: 200 } }),
        line("B9 end"),
    ),

    // B10: paragraphs exactly 12 points apart, the middle one with top and bottom borders
    lines(
        ...["above", "box", "below"].map((name) =>
            line(`B10 ${name}`, { spacing: { line: 240, lineRule: LineRuleType.EXACT }, ...(name === "box" ? { border: BOX } : {}) }),
        ),
    ),

    // A1: four bulleted paragraphs with automatic space before and after; A1b: a bulleted one before a numbered one;
    // A2: three with contextual spacing too
    lines(
        line("A1 above"),
        ...[1, 2, 3, 4].map((n) => line(`A1 item ${n}`, { bullet: { level: 0 }, spacing: AUTO })),
        line("A1 below"),
        line("A1b bullet", { bullet: { level: 0 }, spacing: AUTO }),
        line("A1b number", { numbering: { reference: "a1", level: 0 }, spacing: AUTO }),
        line("A1b below"),
    ),
    lines(line("A2 above"), ...[1, 2, 3].map((n) => line(`A2 ${n}`, { contextualSpacing: true, spacing: AUTO })), line("A2 below")),

    // A4: automatic space after the paragraph before a table, and before the one after it; A5: automatic space with 600
    // before, and with 600 after; A6: automatic space after, before 400 before
    lines(
        line("A4 above"),
        line("A4 before table", { spacing: { afterAutoSpacing: true } }),
        table(line("A4 cell")),
        line("A4 after table", { spacing: { beforeAutoSpacing: true } }),
        line("A5 above"),
        line("A5 auto600", { spacing: { before: 600, beforeAutoSpacing: true } }),
        line("A5 after600", { spacing: { after: 600, afterAutoSpacing: true } }),
        line("A5 next"),
        line("A6 first", { spacing: { afterAutoSpacing: true } }),
        line("A6 second", { spacing: { before: 400 } }),
        line("A6 end"),
    ),

    // A7: a footnote of two paragraphs with automatic space before and after
    lines(new Paragraph({ children: [new TextRun("A7 text"), new FootnoteReferenceRun(1)] })),

    // A8: automatic space before a paragraph with a page break before it
    lines(line("A8 before"), line("A8 broken", { pageBreakBefore: true, spacing: { beforeAutoSpacing: true } }), line("A8 after")),

    // C1 to C16: indents in characters, on paragraphs of three lines or more
    lines(
        line(`C1 ${prose(40)}`, { indent: { firstLineChars: 9001 } }),
        line(`C2 ${prose(40)}`, { indent: { firstLineChars: 9002 } }),
        line(`C2t ${prose(40)}`, { indent: { right: 880 } }),
        line(`C3 ${prose(40)}`, { indent: { firstLineChars: 9003 } }),
        line(`C4 ${prose(40)}`, { indent: { left: 720, firstLineChars: 200 } }),
        new Paragraph({
            indent: { firstLineChars: 200 },
            children: [new TextRun({ text: "C5 big", size: 40 }), new TextRun(` ${prose(40)}`)],
        }),
        new Paragraph({
            indent: { firstLineChars: 200 },
            children: [new TextRun(`C6 ${prose(3)} `), new TextRun({ text: "big", size: 40 }), new TextRun(` ${prose(40)}`)],
        }),
        line(`C7 ${prose(40)}`, { indent: { left: 720, firstLineChars: 9007 } }),
        line(`C8 ${prose(40)}`, { indent: { firstLineChars: 9008 } }),
        line(`C9 ${prose(40)}`, { indent: { left: 1440, firstLineChars: 9009 } }),
        line(`C10 ${prose(40)}`, { indent: { firstLine: 720, firstLineChars: 0 } }),
        new Paragraph({ indent: { firstLineChars: 9011 }, children: [new TextRun({ text: `C11 ${prose(30)}`, size: 40 })] }),
        new Paragraph({ indent: { firstLineChars: 200 }, run: { size: 40 }, children: [new TextRun(`C12 ${prose(40)}`)] }),
        new Paragraph({
            indent: { firstLineChars: 200 },
            children: [new TextRun({ text: `C13 ${prose(40)}`, font: "Times New Roman", size: 20 })],
        }),
        line(`C14 ${prose(40)}`, { indent: { left: 720, hanging: 360, firstLineChars: 9014 } }),
        line(`C15 ${prose(40)}`, { indent: { firstLineChars: 9015 } }),
        line(`C16 ${prose(40)}`, { indent: { right: 720, firstLineChars: 9016 } }),
        line(`C16t ${prose(40)}`, { indent: { right: 720 } }),
    ),

    // L1: 20-point paragraphs with half a line before each
    lines(
        ...Array.from(
            { length: 40 },
            (_, i) => new Paragraph({ spacing: { before: 7781 }, children: [new TextRun({ text: `L1 ${i + 1}`, size: 40 })] }),
        ),
    ),
    // L2: a line before, with 600 twips before too; L3: a line after, with automatic space after too
    lines(
        line("L2 above"),
        line("L2 lines", { spacing: { before: 7782 } }),
        line("L3 lines", { spacing: { after: 7783, afterAutoSpacing: true } }),
        line("L3 below"),
    ),

    // A3: a header of two paragraphs with automatic space before and after, last, as the sections after it would have it
    {
        headers: { default: new Header({ children: [line("A3 header 1", { spacing: AUTO }), line("A3 header 2", { spacing: AUTO })] }) },
        children: [line("A3 body")],
    },
];

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "a1",
                levels: [
                    { level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                ],
            },
        ],
    },
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    footnotes: notes,
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const xml = INJECTIONS.reduce(
        (text, [marker, replacement]) =>
            typeof replacement === "string" ? text.replace(marker, replacement) : text.replace(marker, replacement),
        await zip.file("word/document.xml")!.async("string"),
    );
    zip.file("word/document.xml", xml);
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-paragraph-formats.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
