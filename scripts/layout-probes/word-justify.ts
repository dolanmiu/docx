/**
 * Probes of when Word squeezes the spaces of a justified line to fit one more word on it. word-watertight-text.ts TX20
 * showed that it does, and word-watertight-stops.ts SP18 that it squeezed "coast" in at the end of a line of 18 spaces
 * when that took 20% of their width, and not 24%. But TX20's justified paragraph wrapped "the" at the end of a line of 20
 * spaces when that would have taken only 14%, so how far Word squeezes depends on more than the spaces: perhaps on how much
 * of the word is past the margin, or on how much the spaces would have to stretch if it went on the next line.
 *
 * Each paragraph's first line ends with a word that is past the margin by an amount the paragraph's right indent sets,
 * so it fits only with the line's spaces squeezed. The rest of the paragraph is on a second line. Each paragraph starts
 * with a label with no space in it, such as "J04_07", all as wide as each other. Calibri 11, single spaced, no space before
 * or after, on A4 with 1440 margins: lines 9026 twips wide. word-justify.py works out from the PDF how far past the margin
 * each word was, from the widths of the words there, so what it gives doesn't depend on docx/layout's width tables.
 *
 * J01 to J07: lines of 19, 6 and 2 spaces, ending with "a" (105 twips), "coast" (474) or "lighthouse" (937), past the
 *             margin by a share of the word's width from below where Word squeezes it in to above:
 *             J01 19 spaces and "a", J02 6 and "a", J03 2 and "a", J04 19 and "coast", J05 6 and "coast", J06 2 and
 *             "coast", J07 19 and "lighthouse"
 * J08: Times New Roman 12, 19 spaces, "coast": whether the share is the same in another font and size
 * J09: Calibri 11 with 4 of its 19 spaces in Courier New 11, which are 132 twips rather than 49.7, "coast"
 * J10: the last line of a paragraph, its last word past the margin by 10% and 25% of its width: whether Word squeezes a
 *      line it doesn't justify
 * J11: a line ending with a line break, by 10% and 25%
 * J12: the last line of a distributed paragraph, by 10% and 25%
 * J13: distributed, as J04
 * J14: thaiDistribute, lowKashida, mediumKashida and highKashida, by 10% and 70%
 * J15: a line with a tab after its 13th space and 3 spaces after the tab, by 5%, 10% and 25%: whether the spaces before a
 *      tab are squeezed
 * J16: no-break spaces for 8 of the line's 19 spaces, by 10%: whether no-break spaces are squeezed
 * J17: a line of ideographs in MS Mincho 12, in Japanese, whose next ideograph is past the margin by 10%, 30% and 50% of
 *      its width, and whose next character is a full stop (。) past it by 10% and 50%: whether Word squeezes ideographs, or
 *      lets a full stop hang past the margin, in a justified line
 * J18: a paragraph that starts with 8 spaces, then 11 between its words, by 10%: whether the spaces at the start of a line
 *      are squeezed
 * J00: left-aligned lines in Calibri 11, Times New Roman 12 and Courier New 11, whose spaces show how wide the reader
 *      finds a space unsqueezed
 *
 * Word's PDF of word-justify.docx showed that Word squeezes a justified line's spaces by at most a quarter, when they
 * would stretch more than twice as much with the word on the next line, but that it squeezes a distributed line's less
 * (J13). A second document, word-justify2.docx, has the probes of distributed lines and the rest that J didn't settle.
 * Each paragraph has two lines after its first, so that its second, which starts with the word when it doesn't fit, isn't
 * its last, whose letters a distributed paragraph spreads out:
 *
 * K01 to K07: distributed, as J01 to J07
 * K08, K09: thaiDistribute and lowKashida, as K04
 * K10, K11: justified lines of a word and one space, then "a" or "coast" past the margin by 4% to 60% of a space: whether
 *           Word squeezes a line with no other spaces, which couldn't stretch
 * K12: distributed, as K10
 * K00: a left-aligned line in Calibri 11, as J00
 */
// cspell:ignore bbox Kashida Mincho lighthousekeeper unsqueezed
import { mkdirSync, writeFileSync } from "node:fs";

import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";

import { measureTextWidth } from "../../src/text-layout/text-width";

type Alignment = (typeof AlignmentType)[keyof typeof AlignmentType];
type Font = { readonly font: string; readonly size: number };
/** A piece of a line's text, in a font, or the paragraph's font when it doesn't give one */
type Piece = { readonly text: string; readonly font?: Font };

// The width of the text, in twips
const WIDTH = 9026;
const CALIBRI: Font = { font: "Calibri", size: 11 };
const TIMES: Font = { font: "Times New Roman", size: 12 };
const COURIER: Font = { font: "Courier New", size: 11 };
const MINCHO = "MS Mincho";
const NO_BREAK_SPACE = String.fromCodePoint(0xa0);

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const LONG_WORDS = ["lighthousekeepers", "circumnavigation", "hydrographically", "cartographers", "surveyorship"];
const TAIL = "and on foot from the river";

const twips = (text: string, font: Font, start = 0): number => measureTextWidth(text, font, start / 20) * 20;

/** How wide pieces are, one after the other, from the start of a line: a tab goes to the next default stop */
const widthOf = (pieces: readonly Piece[], font: Font): number =>
    pieces.reduce((position, piece) => position + twips(piece.text, piece.font ?? font, position), 0);

type Probe = {
    readonly label: string;
    /** The first line's words before its last, which are each after a space */
    readonly line: readonly Piece[];
    /** The first line's last word, which is after a space too */
    readonly word?: string;
    /** How far past the margin the last word is, as a share of its width */
    readonly share: number;
    readonly font?: Font;
    readonly alignment?: Alignment;
    /** What follows the last word: the next line's text, after a space, or after a line break, or nothing */
    readonly after?: "space" | "break" | "end";
    /** The text after the first line */
    readonly tail?: string;
};

/** A paragraph whose first line ends with a word past the margin by `share` of its width, unless it is squeezed in */
const probe = ({
    label,
    line,
    word = "coast",
    share,
    font = CALIBRI,
    alignment = AlignmentType.JUSTIFIED,
    after = "space",
    tail = TAIL,
}: Probe): Paragraph => {
    const pieces: readonly Piece[] = [{ text: label }, ...line, { text: ` ${word}` }];
    const natural = widthOf(pieces, font);
    const right = Math.round(WIDTH - (natural - share * twips(word, font)));
    if (right < 0 || share * twips(word, font) >= twips(` ${word}`, font)) {
        throw new Error(`${label} doesn't fit its line`);
    }
    return new Paragraph({
        alignment,
        indent: { right },
        children: [
            ...pieces.map(({ text, font: own }) => new TextRun({ text, font: (own ?? font).font, size: (own ?? font).size * 2 })),
            ...(after === "end"
                ? []
                : [
                      new TextRun({
                          text: after === "space" ? ` ${tail}` : tail,
                          font: font.font,
                          size: font.size * 2,
                          ...(after === "break" ? { break: 1 } : {}),
                      }),
                  ]),
        ],
    });
};

/** The shares from `from` to `to`, in steps of `step` */
const shares = (from: number, to: number, step: number): readonly number[] =>
    Array.from({ length: Math.round((to - from) / step) + 1 }, (_, index) => Math.round((from + index * step) * 1000) / 1000);

const labelOf = (series: number, index: number, document = "J"): string =>
    `${document}${String(series).padStart(2, "0")}_${String(index + 1).padStart(2, "0")}`;

/** `count` words from `words` in turn, each after a space */
const wordsOf = (words: readonly string[], count: number): readonly Piece[] =>
    Array.from({ length: count }, (_, index) => ({ text: ` ${words[index % words.length]}` }));

/** A series of probes of the same line, its last word past the margin by each share */
const series = (
    number: number,
    line: readonly Piece[],
    all: readonly number[],
    options: Partial<Probe> = {},
    document = "J",
): readonly Paragraph[] => all.map((share, index) => probe({ label: labelOf(number, index, document), line, share, ...options }));

// Lines of 19 spaces, the label's and the last word's among them: 18 words between them
const LINE_19 = wordsOf(
    WORDS.filter((word) => word !== "lighthouse"),
    18,
);
// Of 6 spaces: 5 long words
const LINE_6 = wordsOf(LONG_WORDS, 5);
// Of 2 spaces: one word as long as most of a line
const LINE_2: readonly Piece[] = [{ text: ` ${"lighthousekeeper".repeat(4)}lighthouse` }];
// Of 19 spaces, with shorter words, for "lighthouse"
const LINE_19_SHORT = wordsOf(["of", "the", "by", "in", "to", "and", "on"], 18);
// Of 19 spaces in Times New Roman 12, whose words are wider
const LINE_19_TIMES = wordsOf(
    WORDS.filter((word) => word.length <= 5),
    18,
);

// J09: the line of J04 with the spaces before, between and after its 6th to 8th words in Courier New
const LINE_COURIER: readonly Piece[] = [
    ...LINE_19.slice(0, 5),
    {
        text: ` ${LINE_19.slice(5, 8)
            .map(({ text }) => text.trim())
            .join(" ")} `,
        font: COURIER,
    },
    { text: LINE_19[8].text.trim() },
    ...LINE_19.slice(9),
];

// J15: 13 words, so 13 spaces with the label's, then a tab, then 3 words and the last, with 3 spaces after the tab
const LINE_TAB: readonly Piece[] = [...wordsOf(WORDS, 13), { text: "\tlighthouse river mouth" }];

// J16: the line of J04 with its first 8 spaces after the label no-break spaces
const LINE_NO_BREAK: readonly Piece[] = LINE_19.map(({ text }, index) => ({ text: index < 8 ? `${NO_BREAK_SPACE}${text.trim()}` : text }));

/**
 * J17: a line of ideographs in MS Mincho 12, in Japanese, after a label in Calibri, whose next character, `last`, is
 * past the margin by `share` of its width. Each ideograph, and the full stop, is an em wide: 240 twips
 */
const IDEOGRAPHS = "海岸測量灯台河口夏季徒歩船舶";
const ideographs = (label: string, share: number, last: string): Paragraph => {
    const head = twips(label, CALIBRI);
    const count = Math.floor((WIDTH - head) / 240) - 1;
    const text = Array.from({ length: count }, (_, index) => IDEOGRAPHS[index % IDEOGRAPHS.length]).join("");
    const right = Math.round(WIDTH - (head + (count + 1) * 240 - share * 240));
    const japanese = { font: { ascii: "Calibri", hAnsi: "Calibri", eastAsia: MINCHO }, size: 24, language: { eastAsia: "ja-JP" } };
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { right },
        children: [new TextRun(label), new TextRun({ text: `${text}${last}${IDEOGRAPHS.repeat(2)}`, ...japanese })],
    });
};

/** J00: a left-aligned paragraph of words, unsqueezed */
const unsqueezed = (index: number, font: Font, document = "J"): Paragraph =>
    new Paragraph({
        children: [
            new TextRun({
                text: `${labelOf(0, index, document)}${wordsOf(WORDS, 40)
                    .map(({ text }) => text)
                    .join("")}`,
                font: font.font,
                size: font.size * 2,
            }),
        ],
    });

const children: readonly Paragraph[] = [
    unsqueezed(0, CALIBRI),
    unsqueezed(1, TIMES),
    unsqueezed(2, COURIER),
    ...series(1, LINE_19, shares(0.2, 0.88, 0.04), { word: "a" }),
    ...series(2, LINE_6, shares(0.2, 0.88, 0.04), { word: "a" }),
    ...series(3, LINE_2, shares(0.04, 0.89, 0.05), { word: "a" }),
    ...series(4, LINE_19, shares(0.28, 0.62, 0.02)),
    ...series(5, LINE_6, shares(0.04, 0.72, 0.04)),
    ...series(6, LINE_2, shares(0.01, 0.35, 0.02)),
    ...series(7, LINE_19_SHORT, shares(0.06, 0.6, 0.03), { word: "lighthouse" }),
    ...series(8, LINE_19_TIMES, shares(0.28, 0.62, 0.02), { font: TIMES }),
    ...series(9, LINE_COURIER, shares(0.28, 0.62, 0.02)),
    ...series(10, LINE_19, [0.1, 0.25], { after: "end" }),
    ...series(11, LINE_19, [0.1, 0.25], { after: "break" }),
    ...series(12, LINE_19, [0.1, 0.25], { after: "end", alignment: AlignmentType.DISTRIBUTE }),
    ...series(13, LINE_19, shares(0.28, 0.6, 0.04), { alignment: AlignmentType.DISTRIBUTE }),
    ...[AlignmentType.THAI_DISTRIBUTE, AlignmentType.LOW_KASHIDA, AlignmentType.MEDIUM_KASHIDA, AlignmentType.HIGH_KASHIDA].flatMap(
        (alignment, index) => [0.1, 0.7].map((share, at) => probe({ label: labelOf(14, index * 2 + at), line: LINE_19, share, alignment })),
    ),
    ...series(15, LINE_TAB, [0.05, 0.1, 0.25]),
    ...series(16, LINE_NO_BREAK, [0.1]),
    ...[0.1, 0.3, 0.5].map((share, index) => ideographs(labelOf(17, index), share, IDEOGRAPHS[0])),
    ...[0.1, 0.5].map((share, index) => ideographs(labelOf(17, index + 3), share, "。")),
    probe({ label: `${" ".repeat(8)}${labelOf(18, 0)}`, line: wordsOf(WORDS, 10), share: 0.1 }),
];

// K: two lines after the first, so the second isn't the last
const LONG_TAIL = wordsOf(WORDS, 30)
    .map(({ text }) => text)
    .join("")
    .trimStart();
const DISTRIBUTED = { alignment: AlignmentType.DISTRIBUTE, tail: LONG_TAIL };

/** K10 to K12: a line of one word and a space, then `word` past the margin by `share` of a space */
const ONE_SPACE = "lighthousekeeper".repeat(5);
const oneSpace = (number: number, word: string, alignment: Alignment): readonly Paragraph[] =>
    shares(0.04, 0.6, 0.04).map((share, index) =>
        probe({
            label: `${labelOf(number, index, "K")}${ONE_SPACE}`,
            line: [],
            word,
            share: (share * twips(" ", CALIBRI)) / twips(word, CALIBRI),
            alignment,
            tail: LONG_TAIL,
        }),
    );

const second: readonly Paragraph[] = [
    unsqueezed(0, CALIBRI, "K"),
    ...series(1, LINE_19, shares(0.1, 0.78, 0.04), { ...DISTRIBUTED, word: "a" }, "K"),
    ...series(2, LINE_6, shares(0.1, 0.78, 0.04), { ...DISTRIBUTED, word: "a" }, "K"),
    ...series(3, LINE_2, shares(0.04, 0.89, 0.05), { ...DISTRIBUTED, word: "a" }, "K"),
    ...series(4, LINE_19, shares(0.18, 0.52, 0.02), DISTRIBUTED, "K"),
    ...series(5, LINE_6, shares(0.02, 0.36, 0.02), DISTRIBUTED, "K"),
    ...series(6, LINE_2, shares(0.01, 0.35, 0.02), DISTRIBUTED, "K"),
    ...series(7, LINE_19_SHORT, shares(0.04, 0.4, 0.02), { ...DISTRIBUTED, word: "lighthouse" }, "K"),
    ...series(8, LINE_19, shares(0.18, 0.52, 0.02), { alignment: AlignmentType.THAI_DISTRIBUTE, tail: LONG_TAIL }, "K"),
    ...series(9, LINE_19, shares(0.18, 0.52, 0.02), { alignment: AlignmentType.LOW_KASHIDA, tail: LONG_TAIL }, "K"),
    ...oneSpace(10, "a", AlignmentType.JUSTIFIED),
    ...oneSpace(11, "coast", AlignmentType.JUSTIFIED),
    ...oneSpace(12, "a", AlignmentType.DISTRIBUTE),
];

const documentOf = (paragraphs: readonly Paragraph[]): Document =>
    new Document({
        styles: {
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        },
        sections: [{ children: [...paragraphs] }],
    });

const main = async (): Promise<void> => {
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-justify.docx", await Packer.toBuffer(documentOf(children)));
    writeFileSync("build/word-probes/word-justify2.docx", await Packer.toBuffer(documentOf(second)));
};

void main();
