/**
 * Probes of how Word lays out run formatting, where the round-8 probes (word-watertight-text.ts TX1, TX2, TX4, TX15 and
 * TX16) left it open. Each line's text names its probe, so the lines can be found in a PDF saved from Word with
 * pdftotext -bbox-layout, which word-run-formatting.py reads. Calibri 11, single spaced, no space before or after, on A4
 * with 1440 margins. Each probe starts a page.
 *
 * Most probes are a group of 10 one-line paragraphs between a plain line above and a plain line below, so the pitch of the
 * group's lines, and the gaps from the line above and to the line below, show how tall Word makes the lines, and whether
 * it adds the height above their text or below it.
 *
 * Round 8 showed superscript and subscript in Calibri 11 and 20 drawn at 65% of the size to the nearest half point, in a
 * line no taller than Calibri's own; small capitals at 80% to the nearest half point; a run raised or lowered 6 points
 * making its line 120 twips taller, and 2 points 40; emphasis marks adding 67 twips above a line of Calibri 11; and a run's
 * border adding its space and width beside the run, and above and below it. What isn't known:
 *
 * RF1: the size of superscript and subscript in other fonts and sizes, and at the sizes where 65% is a quarter point (5, 15
 *      and 25 points): rounded up or down
 * RF2: whether superscript and subscript make a line of Times New Roman, Arial, Cambria, Courier New or Calibri 20 taller
 * RF3: which size counts for a line's height: a line of only superscript or subscript, and a superscript or subscript run
 *      larger than the rest of its line
 * RF4: the size of small capitals in other fonts and sizes, and with superscript, and the height of a line of only small
 *      letters in small capitals
 * RF5: raised and lowered text (`w:position`) smaller than its line, in another font, at 1.5 lines and at least 18 points,
 *      with superscript, and written with units ("6pt"), as docx writes it, rather than in half-points
 * RF6: emphasis marks at other sizes, in other fonts, of each kind, on a smaller run, at 1.5 lines, in a run with an East
 *      Asian font, and on a space
 * RF7: run borders of other sizes, spaces and styles, on a smaller run, at 1.5 lines, of no style, on runs next to each
 *      other, on a run that starts its line, and on a run that wraps onto the next line
 * RF8: empty paragraphs whose marks are raised, in superscript, with emphasis marks, or with a border
 *
 * docx writes a position only with a unit, so a position in half-points is written in picas, which no probe uses, and
 * replaced in the XML: see `INJECTIONS`.
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import { BorderStyle, Document, EmphasisMarkType, type ISectionOptions, LineRuleType, Packer, Paragraph, TextRun } from "docx";

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

/** A line of its label and an x in the label's formatting, then a word in its own */
const withWord =
    (word: Run, plain: Run = {}, options: Options = {}) =>
    (label: string, keepNext: boolean): Paragraph =>
        new Paragraph({
            ...options,
            keepNext,
            children: [new TextRun({ ...plain, text: `${label} x ` }), new TextRun({ ...plain, ...word })],
        });

const section = (...children: (Paragraph | readonly Paragraph[])[]): ISectionOptions => ({ children: children.flat() });

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789".repeat(4);
const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number, from = 0): string => Array.from({ length: count }, (_, i) => WORDS[(from + i * 7) % WORDS.length]).join(" ");

/** A position in half-points, written in picas and replaced in the XML */
const halfPoints = (points: number): Measure => `${points}pi`;

const border = (size: number, space: number, style: (typeof BorderStyle)[keyof typeof BorderStyle] = BorderStyle.SINGLE) => ({
    style,
    size,
    space,
    color: "auto",
});

/** The XML docx can't write, which replaces a marker it can, in document.xml */
const INJECTIONS: readonly (readonly [RegExp, (match: string, ...groups: string[]) => string])[] = [
    // RF5: positions in half-points, as Word writes them, from the picas no probe uses otherwise
    [/<w:position w:val="(-?[\d.]+)pi"\/>/g, (_, points: string) => `<w:position w:val="${Number(points) * 2}"/>`],
];

// RF1 and RF4: fonts, by the short name a line's label gives them
const FONTS: Readonly<Record<string, string>> = {
    tnr: "Times New Roman",
    arial: "Arial",
    cambria: "Cambria",
    courier: "Courier New",
    calibri: "Calibri",
};

const sections: ISectionOptions[] = [
    // RF1: 40 digits in superscript or subscript, after a label in Calibri 11, beside the same digits plain at 10 points in
    // each font, for their size. The key is the font, the size in half-points and the kind: 65% of 10, 30, 50 and 70
    // half-points is a quarter point
    section(
        ...Object.keys(FONTS).map(
            (font) =>
                new Paragraph({
                    children: [new TextRun(`RF1 ${font}20plain `), new TextRun({ text: DIGITS, font: FONTS[font], size: 20 })],
                }),
        ),
        ...(
            [
                ["tnr", 20, "sup"],
                ["tnr", 18, "sup"],
                ["tnr", 15, "sup"],
                ["tnr", 24, "sup"],
                ["tnr", 26, "sup"],
                ["tnr", 10, "sup"],
                ["tnr", 30, "sup"],
                ["tnr", 50, "sup"],
                ["tnr", 30, "sub"],
                ["tnr", 24, "sub"],
                ["arial", 22, "sup"],
                ["cambria", 22, "sup"],
                ["courier", 20, "sup"],
                ["calibri", 30, "sup"],
                ["calibri", 18, "sub"],
            ] as const
        ).map(
            ([font, size, kind]) =>
                new Paragraph({
                    children: [
                        new TextRun(`RF1 ${font}${size}${kind} `),
                        new TextRun({
                            text: DIGITS,
                            font: FONTS[font],
                            size,
                            ...(kind === "sup" ? { superScript: true } : { subScript: true }),
                        }),
                    ],
                }),
        ),
    ),

    // RF2: a superscript or subscript digit at the end of each line, all of it in one font and size
    section(
        ...(
            [
                ["RF2a", "Times New Roman", 20, "sup"],
                ["RF2b", "Times New Roman", 20, "sub"],
                ["RF2c", "Times New Roman", 24, "sup"],
                ["RF2d", "Times New Roman", 24, "sub"],
                ["RF2e", "Arial", 22, "sup"],
                ["RF2f", "Arial", 22, "sub"],
                ["RF2g", "Cambria", 22, "sup"],
                ["RF2h", "Cambria", 22, "sub"],
                ["RF2i", "Courier New", 20, "sup"],
                ["RF2j", "Courier New", 20, "sub"],
                ["RF2k", "Calibri", 40, "sup"],
                ["RF2l", "Calibri", 40, "sub"],
            ] as const
        ).map(([probe, font, size, kind]) =>
            group(probe, withWord({ text: "2", ...(kind === "sup" ? { superScript: true } : { subScript: true }) }, { font, size }), {
                font,
                size,
            }),
        ),
    ),

    // RF3: lines of only superscript or subscript, and a superscript or subscript digit of 20 points in a line of Calibri 11
    section(
        group(
            "RF3a",
            (label, keepNext) =>
                new Paragraph({ keepNext, children: [new TextRun({ text: `${label} superscript only`, superScript: true })] }),
        ),
        group(
            "RF3b",
            (label, keepNext) => new Paragraph({ keepNext, children: [new TextRun({ text: `${label} subscript only`, subScript: true })] }),
        ),
        group("RF3c", withWord({ text: "2", superScript: true, size: 40 })),
        group("RF3d", withWord({ text: "2", subScript: true, size: 40 })),
    ),

    // RF4: the alphabet in small capitals and typed in capitals, for their size, then small capitals with superscript, and
    // lines of only small letters in small capitals, whose label has no digits
    section(
        ...(
            [
                ["tnr", 20],
                ["tnr", 24],
                ["tnr", 26],
                ["tnr", 14],
                ["arial", 22],
                ["cambria", 22],
                ["calibri", 30],
            ] as const
        ).flatMap(([font, size]) => [
            new Paragraph({
                children: [
                    new TextRun(`RF4 ${font}${size}small `),
                    new TextRun({ text: ALPHABET, font: FONTS[font], size, smallCaps: true }),
                ],
            }),
            new Paragraph({
                children: [new TextRun(`RF4 ${font}${size}caps `), new TextRun({ text: ALPHABET.toUpperCase(), font: FONTS[font], size })],
            }),
        ]),
        new Paragraph({
            children: [
                new TextRun("RF4 supsmall "),
                new TextRun({ text: ALPHABET, font: "Times New Roman", size: 24, smallCaps: true, superScript: true }),
            ],
        }),
        new Paragraph({
            children: [
                new TextRun("RF4 supcaps "),
                new TextRun({ text: ALPHABET.toUpperCase(), font: "Times New Roman", size: 24, superScript: true }),
            ],
        }),
        new Paragraph({ children: [new TextRun("RF4 below")] }),
        new Paragraph({ keepNext: true, children: [new TextRun("rffour above")] }),
        ..."abcdefghij".split("").map(
            (letter) =>
                new Paragraph({
                    keepNext: true,
                    children: [new TextRun({ text: `rffour ${letter} small letters only`, smallCaps: true })],
                }),
        ),
        new Paragraph({ children: [new TextRun("rffour below")] }),
    ),

    // RF5: raised and lowered text. a: 7 points raised 3; b: Courier New 11 raised 2; c: 7 points lowered 3; d: raised 6 at
    // 1.5 lines; e: Times New Roman 10 raised 6; f to k: written with units, as docx writes them; l: a superscript digit
    // raised 6; m: raised 6 at least 18 points
    section(
        group("RF5a", withWord({ text: "raised", size: 14, position: halfPoints(3) })),
        group("RF5b", withWord({ text: "raised", font: "Courier New", position: halfPoints(2) })),
        group("RF5c", withWord({ text: "lowered", size: 14, position: halfPoints(-3) })),
        group("RF5d", withWord({ text: "raised", position: halfPoints(6) }, {}, { spacing: { line: 360, lineRule: LineRuleType.AUTO } })),
        group("RF5e", withWord({ text: "raised", font: "Times New Roman", size: 20, position: halfPoints(6) })),
        group("RF5f", withWord({ text: "raised", position: "6pt" })),
        group("RF5g", withWord({ text: "lowered", position: "-6pt" })),
        group("RF5h", withWord({ text: "raised", position: "2.75pt" })),
        group("RF5i", withWord({ text: "raised", position: "0.1in" })),
        group("RF5j", withWord({ text: "raised", position: "3mm" })),
        group("RF5k", withWord({ text: "raised", position: "1pc" })),
        group("RF5l", withWord({ text: "2", superScript: true, position: halfPoints(6) })),
        group(
            "RF5m",
            withWord({ text: "raised", position: halfPoints(6) }, {}, { spacing: { line: 360, lineRule: LineRuleType.AT_LEAST } }),
        ),
    ),

    // RF6: emphasis marks. a to c: Calibri 10, 12 and 20; d to f: Times New Roman 10, Arial 11 and Cambria 11; g to i: a
    // comma, a circle and a dot below; j: on a word of 7 points; k: at 1.5 lines; l and m: in a run whose East Asian font is
    // MS Mincho, and Yu Gothic; n: on a space between two words
    section(
        ...(
            [
                ["RF6a", {}, { size: 20 }],
                ["RF6b", {}, { size: 24 }],
                ["RF6c", {}, { size: 40 }],
                ["RF6d", {}, { font: "Times New Roman", size: 20 }],
                ["RF6e", {}, { font: "Arial" }],
                ["RF6f", {}, { font: "Cambria" }],
                ["RF6g", { type: "comma" }, {}],
                ["RF6h", { type: "circle" }, {}],
                ["RF6i", { type: "underDot" }, {}],
            ] as const
        ).map(([probe, mark, plain]) =>
            group(
                probe,
                withWord({ text: "dotted", emphasisMark: { type: EmphasisMarkType.DOT, ...mark } as Run["emphasisMark"] }, plain),
                plain,
            ),
        ),
        group("RF6j", withWord({ text: "dotted", size: 14, emphasisMark: { type: EmphasisMarkType.DOT } })),
        group(
            "RF6k",
            withWord(
                { text: "dotted", emphasisMark: { type: EmphasisMarkType.DOT } },
                {},
                { spacing: { line: 360, lineRule: LineRuleType.AUTO } },
            ),
        ),
        group(
            "RF6l",
            withWord({
                text: "dotted",
                font: { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "MS Mincho" },
                emphasisMark: { type: EmphasisMarkType.DOT },
            }),
        ),
        group(
            "RF6m",
            withWord({
                text: "dotted",
                font: { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "Yu Gothic" },
                emphasisMark: { type: EmphasisMarkType.DOT },
            }),
        ),
        group(
            "RF6n",
            (label, keepNext) =>
                new Paragraph({
                    keepNext,
                    children: [
                        new TextRun(`${label} x`),
                        new TextRun({ text: " ", emphasisMark: { type: EmphasisMarkType.DOT } }),
                        new TextRun("y"),
                    ],
                }),
        ),
    ),

    // RF7: run borders. a: half a point 4 points away, as TX16a; b: half a point, touching; c: 3 points, touching; d: double;
    // e: triple; f: a word of 7 points; g: at 1.5 lines; h: of no style
    section(
        group("RF7a", withWord({ text: "boxed", border: border(4, 4) })),
        group("RF7b", withWord({ text: "boxed", border: border(4, 0) })),
        group("RF7c", withWord({ text: "boxed", border: border(24, 0) })),
        group("RF7d", withWord({ text: "boxed", border: border(6, 0, BorderStyle.DOUBLE) })),
        group("RF7e", withWord({ text: "boxed", border: border(4, 0, BorderStyle.TRIPLE) })),
        group("RF7f", withWord({ text: "boxed", size: 14, border: border(4, 4) })),
        group("RF7g", withWord({ text: "boxed", border: border(4, 4) }, {}, { spacing: { line: 360, lineRule: LineRuleType.AUTO } })),
        group("RF7h", withWord({ text: "boxed", border: border(4, 4, BorderStyle.NONE) })),
    ),

    // RF7: where a border goes across the line. i: the same border on two runs next to each other; j: one run of the same
    // text; k: two runs with borders of other sizes; l: no border; m: a bordered run that starts its line; n: a bordered run
    // that wraps onto the next two lines
    section(
        new Paragraph({
            children: [
                new TextRun("RF7i before "),
                new TextRun({ text: "boxed", bold: true, border: border(4, 4) }),
                new TextRun({ text: "word", border: border(4, 4) }),
                new TextRun(" after"),
            ],
        }),
        new Paragraph({
            children: [new TextRun("RF7j before "), new TextRun({ text: "boxedword", border: border(4, 4) }), new TextRun(" after")],
        }),
        new Paragraph({
            children: [
                new TextRun("RF7k before "),
                new TextRun({ text: "boxed", bold: true, border: border(4, 4) }),
                new TextRun({ text: "word", border: border(12, 4) }),
                new TextRun(" after"),
            ],
        }),
        new Paragraph({ children: [new TextRun("RF7l before "), new TextRun({ text: "boxed", bold: true }), new TextRun("word after")] }),
        new Paragraph({ children: [new TextRun({ text: "RF7m boxed", border: border(4, 4) }), new TextRun(" after")] }),
        new Paragraph({ children: [new TextRun("RF7m2 boxed after")] }),
        new Paragraph({
            children: [new TextRun(`RF7n ${prose(10)} `), new TextRun({ text: prose(36, 3), border: border(4, 4) }), new TextRun(" after")],
        }),
        new Paragraph({ children: [new TextRun(`RF7o ${prose(10)} ${prose(36, 3)} after`)] }),
    ),

    // RF8: 10 empty paragraphs between a line above and a line below, whose marks are raised 6 points, in superscript, with
    // emphasis marks, and with a border
    section(
        ...(
            [
                ["RF8a", { position: halfPoints(6) }],
                ["RF8b", { superScript: true }],
                ["RF8c", { emphasisMark: { type: EmphasisMarkType.DOT } }],
                ["RF8d", { border: border(4, 4) }],
            ] as const
        ).map(([probe, mark]) => [
            new Paragraph({ keepNext: true, children: [new TextRun(`${probe} above`)] }),
            ...Array.from({ length: LINES }, () => new Paragraph({ keepNext: true, run: mark as Options["run"] })),
            new Paragraph({ children: [new TextRun(`${probe} below`)] }),
        ]),
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
    writeFileSync("build/word-probes/word-run-formatting.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
