/**
 * More probes of run formatting, where word-run-formatting.ts left it open. Each line's text names its probe, so the lines
 * can be found in a PDF saved from Word with pdftotext -bbox-layout, which word-run-formatting.py reads. Calibri 11,
 * single spaced, no space before or after, on A4 with 1440 margins, so lines are 9026 twips long. Each probe starts a page.
 *
 * As in word-run-formatting.ts, most probes are a group of 10 one-line paragraphs between a plain line above and below.
 *
 * word-run-formatting.ts showed emphasis marks taking a quarter of their line above it, single spaced, and fitting in the
 * space 1.5 lines add; and a run's border taking its space and width beside it, above and below it, and again at the start
 * of the next line when it goes on there. What isn't known:
 *
 * RF9: emphasis marks at 1.08, 1.15, 2 and 0.8 lines, and at least 12, 16 and 18 points, and marks below at 1.5 and 1.15
 * RF10: emphasis marks on a line that is taller than its fonts' own lines: Courier New 20 in a line of Times New Roman 20,
 *       a word raised 6 points, a word with a border, and a word with marks beside a raised word without
 * RF11: whether a line has room for a border's space and width after its last word, where the bordered run goes on to the
 *       next line, and where it ends with that word: lines whose last word is this many twips short of the end of the
 *       line, measured with docx/layout's widths of Calibri, beside lines without a border
 * RF12: how much room borders of other styles take beside their run, a border of no style ("nil") with a space, and two
 *       runs next to each other whose borders are the same but for their colour
 * RF13: a word with a border raised and lowered 6 points
 * RF14: a word with a border in superscript, and in small capitals of only small letters
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import { BorderStyle, Document, EmphasisMarkType, type ISectionOptions, LineRuleType, Packer, Paragraph, TextRun } from "docx";

import { measureTextWidth } from "../../src/text-layout/text-width";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Run = ConstructorParameters<typeof TextRun>[0] & object;
type Measure = `${number}${"mm" | "cm" | "in" | "pt" | "pc" | "pi"}`;

// The lines of a group
const LINES = 10;

/**
 * A probe's lines between a line above and a line below, in the formatting of the labels, single spaced. Each but the line
 * below is kept with the next, so they are on one page
 */
const group = (probe: string, make: (label: string, keepNext: boolean) => Paragraph, plain: Run = {}): Paragraph[] => [
    new Paragraph({ keepNext: true, children: [new TextRun({ ...plain, text: `${probe} above` })] }),
    ...Array.from({ length: LINES }, (_, i) => make(`${probe} ${i + 1}`, true)),
    new Paragraph({ children: [new TextRun({ ...plain, text: `${probe} below` })] }),
];

/** A line of its label and an x in the label's formatting, then words in their own */
const withWords =
    (words: readonly Run[], plain: Run = {}, options: Options = {}) =>
    (label: string, keepNext: boolean): Paragraph =>
        new Paragraph({
            ...options,
            keepNext,
            children: [new TextRun({ ...plain, text: `${label} x ` }), ...words.map((word) => new TextRun({ ...plain, ...word }))],
        });

const section = (...children: (Paragraph | readonly Paragraph[])[]): ISectionOptions => ({ children: children.flat() });

const DOTS = { emphasisMark: { type: EmphasisMarkType.DOT } } as const;
const UNDER_DOTS = { emphasisMark: { type: "underDot" } } as unknown as Run;

/** A position in half-points, written in picas and replaced in the XML */
const halfPoints = (points: number): Measure => `${points}pi`;

const border = (size: number, space: number, style: string = BorderStyle.SINGLE, color = "auto") =>
    ({ style, size, space, color }) as Run["border"];

/** The XML docx can't write, which replaces a marker it can, in document.xml */
const INJECTIONS: readonly (readonly [RegExp, (match: string, ...groups: string[]) => string])[] = [
    // Positions in half-points, as Word writes them, from the picas no probe uses otherwise
    [/<w:position w:val="(-?[\d.]+)pi"\/>/g, (_, points: string) => `<w:position w:val="${Number(points) * 2}"/>`],
];

const multiple = (lines: number): Options => ({ spacing: { line: Math.round(lines * 240), lineRule: LineRuleType.AUTO } });
const atLeast = (points: number): Options => ({ spacing: { line: points * 20, lineRule: LineRuleType.AT_LEAST } });

// RF11: Calibri 11, as the document's default
const CALIBRI = { font: "Calibri", size: 11 };
const twipsOf = (text: string): number => measureTextWidth(text, CALIBRI) * 20;
const LINE_WIDTH = 9026;
// A border of half a point, 4 points away: 90 twips beside its run
const ROOM = 90;
const FILLERS = "of the coast was made in the summer by boat and on foot from the land to the river mouth".split(" ");
const ENDINGS = [
    ...new Set([
        ...FILLERS,
        ..."a an to on by of in at it is so up no we me go do be if or as all far sea sand tide road west east hill".split(" "),
    ]),
];

/**
 * RF11: a line whose last word ends `slack` twips short of the end of the line, after its label, words without a border,
 * and from the fifth word on, words with one when `bordered`. The words after it go on with the border or without, and
 * the next is too long for the line either way
 */
const slackLine = (probe: string, slack: number, bordered: boolean, goesOn: boolean): Paragraph => {
    const target = LINE_WIDTH - slack - (bordered ? ROOM : 0);
    const label = `${probe} ${slack} `;
    // Fill the line with words, leaving room for three short ones, chosen to end as near the target as can be
    const words: string[] = [];
    while (twipsOf(`${label}${[...words, FILLERS[words.length % FILLERS.length]].join(" ")}`) < target - 1000) {
        words.push(FILLERS[words.length % FILLERS.length]);
    }
    const best = ENDINGS.flatMap((one) => ENDINGS.flatMap((two) => ENDINGS.map((three) => [one, two, three] as const)))
        .map((ending) => ({ ending, end: twipsOf(`${label}${[...words, ...ending].join(" ")}`) }))
        .filter(({ end }) => end <= target)
        .reduce((nearest, candidate) => (candidate.end > nearest.end ? candidate : nearest));
    const all = [...words, ...best.ending];
    const plain = `${label}${all.slice(0, bordered ? 4 : all.length).join(" ")} `;
    const boxed = all.slice(bordered ? 4 : all.length).join(" ");
    const rest = " lighthouse lighthouse after";
    return new Paragraph({
        children: !bordered
            ? [new TextRun(`${plain}${boxed}${rest}`)]
            : goesOn
              ? [new TextRun(plain), new TextRun({ text: `${boxed}${rest}`, border: border(4, 4) })]
              : [new TextRun(plain), new TextRun({ text: boxed, border: border(4, 4) }), new TextRun(rest)],
    });
};

const sections: ISectionOptions[] = [
    // RF9: a word with emphasis marks in each line, at each spacing; then marks below at 1.5 and 1.15 lines
    section(
        group("RF9a", withWords([{ text: "dotted", ...DOTS }], {}, multiple(1.08))),
        group("RF9b", withWords([{ text: "dotted", ...DOTS }], {}, multiple(1.15))),
        group("RF9c", withWords([{ text: "dotted", ...DOTS }], {}, multiple(2))),
        group("RF9d", withWords([{ text: "dotted", ...DOTS }], {}, multiple(0.8))),
        group("RF9e", withWords([{ text: "dotted", ...DOTS }], {}, atLeast(12))),
        group("RF9f", withWords([{ text: "dotted", ...DOTS }], {}, atLeast(16))),
        group("RF9g", withWords([{ text: "dotted", ...DOTS }], {}, atLeast(18))),
        group("RF9h", withWords([{ text: "dotted", ...UNDER_DOTS }], {}, multiple(1.5))),
        group("RF9i", withWords([{ text: "dotted", ...UNDER_DOTS }], {}, multiple(1.15))),
    ),

    // RF10: emphasis marks on lines taller than their fonts' own. a: Courier New 20 with marks in a line of Times New Roman
    // 20; b: a word with marks raised 6 points; c: a word with marks and a border; d: a word with marks beside a word raised
    // 6 points without them; e: the same raised word without marks, for d
    section(
        group("RF10a", withWords([{ text: "dotted", font: "Courier New", ...DOTS }], { font: "Times New Roman", size: 40 }), {
            font: "Times New Roman",
            size: 40,
        }),
        group("RF10b", withWords([{ text: "dotted", position: halfPoints(6), ...DOTS }])),
        group("RF10c", withWords([{ text: "dotted", border: border(4, 4), ...DOTS }])),
        group("RF10d", withWords([{ text: "dotted", ...DOTS }, { text: " " }, { text: "raised", position: halfPoints(6) }])),
        group("RF10e", withWords([{ text: "plain" }, { text: " " }, { text: "raised", position: halfPoints(6) }])),
    ),

    // RF11: lines whose last word is short of the end of the line by 20 to 140 twips: a without a border, 10 short and 10
    // past, d with the bordered run going on to the next line, e with it ending at the last word
    section(
        ...[10, -10, 20].map((slack) => slackLine("RF11a", slack, false, false)),
        ...[20, 45, 70, 110, 140].map((slack) => slackLine("RF11d", slack, true, true)),
        ...[20, 45, 70, 110, 140].map((slack) => slackLine("RF11e", slack, true, false)),
    ),

    // RF12: the room borders of each style take beside a word, with no space; nil with a space; and runs next to each other
    // with borders that are the same but for their colour, and the same in colour
    section(
        ...(
            [
                ["dotted", 4],
                ["dashed", 4],
                ["dashSmallGap", 4],
                ["dotDash", 4],
                ["dotDotDash", 4],
                ["thick", 4],
                ["wave", 6],
                ["doubleWave", 6],
                ["thinThickSmallGap", 4],
                ["thickThinSmallGap", 4],
                ["thinThickThinSmallGap", 4],
                ["thinThickMediumGap", 4],
                ["thinThickLargeGap", 4],
                ["threeDEmboss", 4],
                ["threeDEngrave", 4],
                ["outset", 4],
                ["inset", 4],
                ["single", 8],
                ["single", 12],
                ["double", 4],
                ["triple", 6],
            ] as const
        ).map(
            ([style, size]) =>
                new Paragraph({
                    children: [
                        new TextRun(`RF12 ${style}${size} x `),
                        new TextRun({ text: "boxed", border: border(size, 0, style) }),
                        new TextRun(" after"),
                    ],
                }),
        ),
        new Paragraph({
            children: [new TextRun("RF12 nil4 x "), new TextRun({ text: "boxed", border: border(4, 4, "nil") }), new TextRun(" after")],
        }),
        new Paragraph({
            children: [
                new TextRun("RF12 colour x "),
                new TextRun({ text: "boxed", border: border(4, 4) }),
                new TextRun({ text: "word", border: border(4, 4, BorderStyle.SINGLE, "FF0000") }),
                new TextRun(" after"),
            ],
        }),
        new Paragraph({
            children: [
                new TextRun("RF12 same x "),
                new TextRun({ text: "boxed", border: border(4, 4) }),
                new TextRun({ text: "word", border: border(4, 4) }),
                new TextRun(" after"),
            ],
        }),
    ),

    // RF13: a word with a border, raised and lowered 6 points
    section(
        group("RF13a", withWords([{ text: "boxed", border: border(4, 4), position: halfPoints(6) }])),
        group("RF13b", withWords([{ text: "boxed", border: border(4, 4), position: halfPoints(-6) }])),
    ),

    // RF14: a word with a border in superscript, and in small capitals of only small letters
    section(
        group("RF14a", withWords([{ text: "boxed", border: border(4, 4), superScript: true }])),
        group("RF14b", withWords([{ text: "boxed", border: border(4, 4), smallCaps: true }])),
    ),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const xml = INJECTIONS.reduce(
        (text, [marker, replacement]) => text.replace(marker, replacement),
        await zip.file("word/document.xml")!.async("string"),
    );
    zip.file("word/document.xml", xml);
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-run-formatting2.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
