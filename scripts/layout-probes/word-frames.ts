// Probes of how Word lays out text frames (`w:framePr`) and drop caps, where docx/layout stops at "a text frame". Each
// probe starts a page, its first line names it ("FM1 above"), and the text in its frame and the paragraph after it start
// with the probe's name too, so word-frames.py can find each probe's page in pdftotext's HTML of a PDF saved from Word, and
// the frame's grey shading in pdftocairo's SVG. Calibri 11, single spaced, no space before or after, on A4 with 1440
// margins: 9026 twips of text, lines of 268.55 twips. The paragraphs after a frame are justified, so each of their lines
// but the last ends where the room beside the frame does. Lengths are in twips.
//
// The frame of docx's text-frame demo, at 1000 across and 3000 down from the margins, 4000 by 1000, written with no wrapping
// and no height rule, as docx writes it:
// FM1:  one line in it: where the frame is, whether the text goes round it, and how far from it
// FM2:  six lines in it, taller than 1000: whether it grows, cuts them off, or is as tall as its text
// Height rules, at 1000 across and 3000 down, wrapped around:
// FM3:  exact, 1440, with one line in it
// FM4:  at least 1000, with six lines in it
// FM5:  auto, 1440, with one line in it
// Wrapping, each 3000 by 1440 exactly, centred across the margins, 1440 below the top margin:
// FM6a: around; FM6b: notBeside; FM6c: none; FM6d: through; FM6e: tight; FM6f: auto
// What it is placed against:
// FM7:  the page, 2880 across and 4320 down, 3000 by 1440 exactly
// FM8:  the column and the paragraph, at 0 and 0, written after 5 lines: which paragraph's top it is at
// FM9:  the same at 720 down, before a paragraph with 480 before: from the top of the space before, or of the text
// FM10a: right of the margins and at their top; FM10b: centred on the page both ways; FM10c: left of the margins and at their
//       bottom; FM10d: inside and outside of the margins, on an odd page
// FM11: centred, 360 from the text beside it and 288 from the text above and below (hSpace, vSpace)
// FM12: two paragraphs with the same frame, of auto height, with 240 before the first and 200 after each: whether they are
//       one frame, and the spacing in it
// FM13: the frame of FM1 with docx's demo's borders round it, 1 point from the text: whether the borders take room
// FM14a: a drop cap of 3 lines, as Word writes one: no width or height, its line exactly 806 tall, a letter of 52 points
//       lowered 3.5 points: how wide it is, and which lines of the next paragraph go beside it
// FM14b: the same in the margin
// FM14c: a drop cap of 3 lines as docx's options write one: 600 wide and 806 tall, at 0 and 0 from the column and the
//       paragraph, with the letter's own line spacing
// FM15a: a frame in the header, 2000 tall exactly, 200 below the top of the page: whether it pushes the body down
// FM15b: a frame in the header, 3000 by 1440 exactly, 4320 below the top of the page: whether the body's text goes round it
// FM16: a frame 2880 tall exactly, at 0 below its paragraph's top, anchored 3 lines from the bottom of the page: where both
//       go
// FM17: a frame with no width, at the left of the margins, with a short line in it: how wide it is
// FM18: a frame 4000 wide with its text aligned right: where the text ends
// FM19: a frame at the top of the margins, written after a paragraph of 100 words: whether that paragraph's lines go round
//       it, as the lines before a drawing's paragraph do
//
// What Word showed, in word-frames.pdf, saved from Word 16 for Mac on 2026-10-03 and read with word-frames.py:
//
// - FM1 to FM5: a frame with no height rule is at least its height, as with `atLeast`, though the standard's default is
//   auto: one line is in a frame 1000 tall, and six make it taller. Exact keeps its height, and auto is its text's. With no
//   wrapping given, the text goes beside it on both sides, as with `around`, its lines narrowed as beside a drawing with
//   square wrapping, by the plain overlap of a line with the frame
// - FM6: tight, through and auto wrapping are around it, not beside puts the text above and below it, and none leaves the
//   text where it is, the frame in front of it
// - FM7 to FM10: a frame is placed against the page, the margins, the column or the paragraph after it, at a distance or
//   lined up, as a drawing is: against the paragraph, at the top of its space before (FM9), and inside and outside by
//   whether the page is odd or even (FM10d, on page 18)
// - FM11: hSpace keeps the text from it left and right, and vSpace above and below
// - FM12: paragraphs next to each other with the same frame are in one frame, one below the other, with the space before
//   the first and after the last in it
// - FM13: borders round a frame take room beside it that their width and space don't explain: the text keeps 65 and 64
//   twips beyond the frame's text, left and right, where the borders of 15 twips, 20 from the text, are drawn 67 and 50
//   beyond it, and above and below the text keeps to the frame's height
// - FM14: a drop cap is a frame as any other, as wide as its letter when it has no width, and the lines beside it are
//   those its box is beside: the 806 twips of an exact line of 3 lines of 268.55 go 0.35 into a fourth, which goes beside
//   it too. A drop cap in the margin with no place across the page is where one in the text is
// - FM15: a frame in a header doesn't make the header taller, but the header's text and the body's go round it
// - FM16: a frame that would go past the bottom of the page moves to the next page with its paragraph
// - FM17, FM18: a frame with no width is as wide as its text, and its text is aligned in its width
// - FM19: the text before a frame's paragraph on its page goes round it, as with a drawing
//
// LibreOffice lays out most of them as Word does, but takes none of the room of FM13's frame with borders, and shades only
// a frame's lines.
//
// Usage: npm run run-ts -- scripts/layout-probes/word-frames.ts, which writes build/word-probes/word-frames.docx
// cspell:ignore pdftocairo
import * as fs from "fs";

import JSZip from "jszip";

import {
    AlignmentType,
    BorderStyle,
    Document,
    DropCapType,
    FrameAnchorType,
    FrameWrap,
    Header,
    HeightRule,
    HorizontalPositionAlign,
    type IFrameOptions,
    type ISectionOptions,
    LineRuleType,
    Packer,
    Paragraph,
    ShadingType,
    TextRun,
    VerticalPositionAlign,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

/** A justified paragraph of prose, starting with its probe's name */
const after = (probe: string, words: number, options: Options = {}): Paragraph =>
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, ...options, children: [new TextRun(`${probe} ${prose(words)}`)] });

const SHADING = { type: ShadingType.CLEAR, color: "auto", fill: "A0A0A0" } as const;

/** A paragraph in a frame, shaded grey, its text starting with its probe's name, `words` long */
const framed = (probe: string, frame: IFrameOptions, words = 0, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        frame,
        shading: SHADING,
        children: [new TextRun(`${probe} frame${words > 0 ? ` ${prose(words)}` : ""}`)],
    });

// Every section has a header, empty but for FM15a's and FM15b's, so theirs aren't carried on to the sections after them
const EMPTY = new Header({ children: [new Paragraph({})] });

/** A probe: its line at the top of its page, then what is given, with its header's paragraphs, if it has one */
const probe = (name: string, children: readonly Paragraph[], header: readonly Paragraph[] = []): ISectionOptions => ({
    headers: { default: header.length > 0 ? new Header({ children: [...header] }) : EMPTY },
    children: [line(`${name} above`), ...children],
});

const MARGINS = { horizontal: FrameAnchorType.MARGIN, vertical: FrameAnchorType.MARGIN } as const;
const PAGE = { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE } as const;
const TEXT = { horizontal: FrameAnchorType.TEXT, vertical: FrameAnchorType.TEXT } as const;

/** A frame at a place from what it is placed against, of a size, with what else is given */
const at = (
    x: number,
    y: number,
    width: number,
    height: number,
    more: Partial<Pick<IFrameOptions, "anchor" | "wrap" | "rule" | "space" | "dropCap" | "lines">> = {},
): IFrameOptions => ({ type: "absolute", position: { x, y }, width, height, anchor: MARGINS, ...more });

/** A frame lined up with what it is placed against, of a size, with what else is given */
const aligned = (
    x: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign],
    y: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign],
    width: number,
    height: number,
    more: Partial<Pick<IFrameOptions, "anchor" | "wrap" | "rule" | "space">> = {},
): IFrameOptions => ({ type: "alignment", alignment: { x, y }, width, height, anchor: MARGINS, ...more });

const AROUND = { wrap: FrameWrap.AROUND } as const;
const EXACT = { rule: HeightRule.EXACT } as const;

const BORDER = { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } as const;

// Widths that mark frames whose `w:framePr` is replaced, by what replaces it: Word's own drop caps, which have no width or
// height, and a frame with no width
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    [/<w:framePr[^>]*w:w="1111"[^>]*\/>/, '<w:framePr w:dropCap="drop" w:lines="3" w:wrap="around" w:vAnchor="text" w:hAnchor="text"/>'],
    [/<w:framePr[^>]*w:w="1112"[^>]*\/>/, '<w:framePr w:dropCap="margin" w:lines="3" w:wrap="around" w:vAnchor="text" w:hAnchor="text"/>'],
    [/<w:framePr[^>]*w:w="1113"[^>]*\/>/, '<w:framePr w:x="0" w:y="1440" w:hAnchor="margin" w:vAnchor="margin" w:wrap="around"/>'],
];

/** A drop cap's letter, as Word writes one of 3 lines of Calibri 11: 52 points, lowered 3.5, its line exactly 806 tall */
const dropCap = (frame: IFrameOptions, exactLine = true): Paragraph =>
    new Paragraph({
        frame,
        keepNext: true,
        ...(exactLine ? { spacing: { line: 806, lineRule: LineRuleType.EXACT, after: 0 } } : {}),
        children: [new TextRun({ text: "W", size: 104, position: "-3.5pt" })],
    });

const sections: ISectionOptions[] = [
    probe("FM1", [framed("FM1", at(1000, 3000, 4000, 1000)), after("FM1", 260)]),
    probe("FM2", [framed("FM2", at(1000, 3000, 4000, 1000), 50), after("FM2", 260)]),
    probe("FM3", [framed("FM3", at(1000, 3000, 4000, 1440, { ...AROUND, ...EXACT })), after("FM3", 260)]),
    probe("FM4", [framed("FM4", at(1000, 3000, 4000, 1000, { ...AROUND, rule: HeightRule.ATLEAST }), 50), after("FM4", 260)]),
    probe("FM5", [framed("FM5", at(1000, 3000, 4000, 1440, { ...AROUND, rule: HeightRule.AUTO })), after("FM5", 260)]),
    ...(
        [
            ["FM6a", FrameWrap.AROUND],
            ["FM6b", FrameWrap.NOT_BESIDE],
            ["FM6c", FrameWrap.NONE],
            ["FM6d", FrameWrap.THROUGH],
            ["FM6e", FrameWrap.TIGHT],
            ["FM6f", FrameWrap.AUTO],
        ] as const
    ).map(([name, wrap]) => probe(name, [framed(name, at(3013, 1440, 3000, 1440, { wrap, ...EXACT })), after(name, 260)])),
    probe("FM7", [framed("FM7", at(2880, 4320, 3000, 1440, { anchor: PAGE, ...AROUND, ...EXACT })), after("FM7", 260)]),
    probe("FM8", [...fill("FM8", 5), framed("FM8", at(0, 0, 3000, 1440, { anchor: TEXT, ...AROUND, ...EXACT })), after("FM8", 200)]),
    probe("FM9", [
        ...fill("FM9", 5),
        framed("FM9", at(0, 720, 3000, 1440, { anchor: TEXT, ...AROUND, ...EXACT })),
        after("FM9", 200, { spacing: { before: 480 } }),
    ]),
    probe("FM10a", [
        framed("FM10a", aligned(HorizontalPositionAlign.RIGHT, VerticalPositionAlign.TOP, 3000, 1440, { ...AROUND, ...EXACT })),
        after("FM10a", 260),
    ]),
    probe("FM10b", [
        framed(
            "FM10b",
            aligned(HorizontalPositionAlign.CENTER, VerticalPositionAlign.CENTER, 3000, 1440, { anchor: PAGE, ...AROUND, ...EXACT }),
        ),
        after("FM10b", 260),
    ]),
    probe("FM10c", [
        framed("FM10c", aligned(HorizontalPositionAlign.LEFT, VerticalPositionAlign.BOTTOM, 3000, 1440, { ...AROUND, ...EXACT })),
        after("FM10c", 260),
    ]),
    probe("FM10d", [
        framed("FM10d", aligned(HorizontalPositionAlign.INSIDE, VerticalPositionAlign.OUTSIDE, 3000, 1440, { ...AROUND, ...EXACT })),
        after("FM10d", 260),
    ]),
    probe("FM11", [
        framed("FM11", at(3013, 1440, 3000, 1440, { ...AROUND, ...EXACT, space: { horizontal: 360, vertical: 288 } })),
        after("FM11", 260),
    ]),
    probe("FM12", [
        framed("FM12a", at(1000, 1440, 3000, 0, { ...AROUND, rule: HeightRule.AUTO }), 20, { spacing: { before: 240, after: 200 } }),
        framed("FM12b", at(1000, 1440, 3000, 0, { ...AROUND, rule: HeightRule.AUTO }), 20, { spacing: { after: 200 } }),
        after("FM12", 260),
    ]),
    probe("FM13", [
        framed("FM13", at(1000, 3000, 4000, 1000), 0, { border: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER } }),
        after("FM13", 260),
    ]),
    probe("FM14a", [dropCap(at(0, 0, 1111, 0)), after("FM14a", 120)]),
    probe("FM14b", [dropCap(at(0, 0, 1112, 0)), after("FM14b", 120)]),
    probe("FM14c", [
        dropCap(at(0, 0, 600, 806, { anchor: TEXT, ...AROUND, dropCap: DropCapType.DROP, lines: 3 }), false),
        after("FM14c", 120),
    ]),
    probe(
        "FM15a",
        [after("FM15a", 260)],
        [line("FM15a header"), framed("FM15a header", at(1440, 200, 3000, 2000, { anchor: PAGE, ...AROUND, ...EXACT }))],
    ),
    probe(
        "FM15b",
        [after("FM15b", 260)],
        [line("FM15b header"), framed("FM15b header", at(1440, 4320, 3000, 1440, { anchor: PAGE, ...AROUND, ...EXACT }))],
    ),
    probe("FM16", [...fill("FM16", 45), framed("FM16", at(0, 0, 3000, 2880, { anchor: TEXT, ...AROUND, ...EXACT })), after("FM16", 100)]),
    probe("FM17", [framed("FM17", at(0, 1440, 1113, 0)), after("FM17", 260)]),
    probe("FM18", [
        framed("FM18", at(1000, 1440, 4000, 1440, { ...AROUND, ...EXACT }), 0, { alignment: AlignmentType.RIGHT }),
        after("FM18", 260),
    ]),
    probe("FM19", [after("FM19a", 100), framed("FM19", at(3013, 0, 3000, 1440, { ...AROUND, ...EXACT })), after("FM19b", 160)]),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const written = await zip.file("word/document.xml")!.async("string");
    const xml = INJECTIONS.reduce((text, [marker, replacement]) => {
        if (!marker.test(text)) {
            throw new Error(`No ${marker} to replace`);
        }
        return text.replace(marker, replacement);
    }, written);
    zip.file("word/document.xml", xml);
    fs.mkdirSync("build/word-probes", { recursive: true });
    fs.writeFileSync("build/word-probes/word-frames.docx", await zip.generateAsync({ type: "nodebuffer" }));
};

main();
