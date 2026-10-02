/**
 * Probes of how Word lays out text that runs down the page (`w:textDirection` on a section), which docx/layout stopped at.
 * Each probe starts a page, and each paragraph's text names its probe, so the lines can be found in a PDF saved from Word,
 * which word-vertical.py reads. A4 with 1440 margins, no space before or after, single spaced, in MS Mincho 10.5 for East
 * Asian text and Times New Roman 10.5 for Latin, in Japanese, as Japanese documents have it.
 *
 * V1: text down the page from the right (`tbRl`) without a grid: paragraphs of 100 ideographs, for how many go in a line
 *     down the page, and 60 short paragraphs, for how many lines go across a page and how far apart
 * V2: the same on a grid of 360 twips (`lines`)
 * V3: the same on a grid of lines and characters (`linesAndChars`) with `w:charSpace` 4096 (a point)
 * V4: Latin words, and Latin words between ideographs, down the page, and Times New Roman 20
 * V5: a header of 3 lines, a footer of 2 and a footnote, on pages of text down the page. The sections after it have its
 *     header and footer too, as a section without its own has the one of the section before
 * V6: indents left, right and of the first line, and space before and after, down the page
 * V7: landscape pages
 * V8 to V12: the other directions a section can have: `btLr`, `lrTbV`, `tbRlV` and `tbLrV`, and `lrTb`, written
 * V13: a continuous section break between text across the page and text down it
 *
 * docx writes only `lrTb` and `tbRl`, so the others are given as their values, as a section's properties write them.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/word-vertical.ts, which writes build/word-probes/word-vertical.docx
 */
// cspell:ignore tbRl btLr lrTbV tbRlV tbLrV lrTb linesAndChars charSpace
import { mkdirSync, writeFileSync } from "node:fs";

import {
    Document,
    DocumentGridType,
    FootnoteReferenceRun,
    Footer,
    Header,
    type ISectionOptions,
    Packer,
    PageOrientation,
    PageTextDirectionType,
    Paragraph,
    SectionType,
    TextRun,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Run = ConstructorParameters<typeof TextRun>[0] & object;
type Direction = (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType];
type Grid = NonNullable<NonNullable<ISectionOptions["properties"]>["grid"]>;

const DOWN = PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT;
const LINES: Grid = { type: DocumentGridType.LINES, linePitch: 360 };

const IDEOGRAPH = "永";
const ideographs = (count: number): string => IDEOGRAPH.repeat(count);
const PROSE =
    "The quick brown fox jumps over the lazy dog while the five boxing wizards jump quickly and a wizard's job is to vex chumps quickly in fog.";

/** A run in a font, at a size in points, for both its Latin and East Asian text */
const inFont = (text: string, font: string, points: number, more: Run = {}): TextRun =>
    new TextRun({ text, font: { ascii: font, hAnsi: font, eastAsia: font, cs: font }, size: points * 2, ...more });
const mincho = (text: string, points = 10.5): TextRun => inFont(text, "MS Mincho", points);
const tnr = (text: string, points = 10.5): TextRun => inFont(text, "Times New Roman", points);

/** The paragraphs of V1 to V3 and V7 to V12: 3 of 100 ideographs, then 60 short ones */
const probes = (name: string): readonly Paragraph[] => [
    ...[1, 2, 3].map((i) => new Paragraph({ children: [mincho(`${name} long ${i} ${ideographs(100)}`)] })),
    ...Array.from({ length: 60 }, (_, i) => new Paragraph({ children: [mincho(`${name} short ${i + 1} ${ideographs(3)}`)] })),
];

const section = (
    direction: Direction | undefined,
    children: readonly Paragraph[],
    more: ISectionOptions["properties"] = {},
): ISectionOptions => ({
    properties: { ...more, page: { ...more.page, ...(direction ? { textDirection: direction } : {}) } },
    children: [...children],
});

const paragraph = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [mincho(text)] });

const sections: ISectionOptions[] = [
    section(DOWN, probes("V1")),
    section(DOWN, probes("V2"), { grid: LINES }),
    section(DOWN, probes("V3"), { grid: { type: DocumentGridType.LINES_AND_CHARS, linePitch: 360, charSpace: 4096 } }),

    // V4a: Latin prose, V4b: Latin words between ideographs, V4c: Times New Roman 20, each 3 paragraphs
    section(DOWN, [
        ...[1, 2, 3].map((i) => new Paragraph({ children: [tnr(`V4a ${i} ${PROSE} ${PROSE} ${PROSE}`)] })),
        ...[1, 2, 3].map((i) => new Paragraph({ children: [mincho(`V4b ${i} ${`${ideographs(6)} abc de `.repeat(8)}`)] })),
        ...[1, 2, 3].map((i) => new Paragraph({ children: [tnr(`V4c ${i} ${PROSE}`, 20)] })),
    ]),

    // V5: a header of 3 lines, a footer of 2 and a footnote of 2, with the header 720 from the edge
    {
        properties: { page: { textDirection: DOWN, margin: { top: 1440, header: 720, footer: 720 } } },
        headers: {
            default: new Header({ children: [1, 2, 3].map((i) => new Paragraph({ children: [tnr(`V5 head ${i}`)] })) }),
        },
        footers: {
            default: new Footer({ children: [1, 2].map((i) => new Paragraph({ children: [tnr(`V5 foot ${i}`)] })) }),
        },
        children: [
            new Paragraph({ children: [mincho(`V5 body 1 ${ideographs(10)}`), new FootnoteReferenceRun(1)] }),
            ...Array.from({ length: 20 }, (_, i) => paragraph(`V5 body ${i + 2} ${ideographs(60)}`)),
        ],
    },

    // V6a: indents of 720 left, 1440 right and 420 on the first line. V6b: 240 before and 480 after, between paragraphs
    // without
    section(DOWN, [
        paragraph(`V6 plain 1 ${ideographs(80)}`),
        paragraph(`V6a 1 ${ideographs(80)}`, { indent: { left: 720, right: 1440, firstLine: 420 } }),
        paragraph(`V6 plain 2 ${ideographs(80)}`),
        paragraph(`V6b 1 ${ideographs(80)}`, { spacing: { before: 240, after: 480 } }),
        paragraph(`V6 plain 3 ${ideographs(80)}`),
    ]),

    // V7: landscape pages
    section(DOWN, probes("V7"), { page: { size: { orientation: PageOrientation.LANDSCAPE } } }),

    // V8 to V12: the other directions
    ...(["btLr", "lrTbV", "tbRlV", "tbLrV", "lrTb"] as const).map((direction, i) => section(direction as Direction, probes(`V${8 + i}`))),

    // V13: 3 lines across the page, then a continuous section down it
    section(
        undefined,
        [1, 2, 3].map((i) => paragraph(`V13a ${i} ${ideographs(10)}`)),
    ),
    section(
        DOWN,
        [1, 2, 3].map((i) => paragraph(`V13b ${i} ${ideographs(10)}`)),
        { type: SectionType.CONTINUOUS },
    ),
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
    },
    footnotes: { 1: { children: [1, 2].map((i) => new Paragraph({ children: [mincho(`V5 note ${i} ${ideographs(5)}`)] })) } },
    sections,
});

mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => writeFileSync("build/word-probes/word-vertical.docx", buffer));
