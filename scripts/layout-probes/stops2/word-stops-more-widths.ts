// lay-stops2: the widths of the characters outside the width tables' ranges, which docx/layout measured as an average
// letter without stopping: Hebrew, Arabic, Devanagari, Thai, box drawing, blocks, geometric shapes (docx's bullets ● ○ ■),
// symbols and dingbats, in the fonts of the tables, plain and bold, and the font Word draws each in. Made from
// scripts/layout-probes/word-character-widths.ts with its ranges changed, so it writes that one's probes of the spaces too
// (S, B and H), which its PDF settled. With STOPS_ITALIC=1 it writes the italic and bold italic faces.
//
// W: every character of the ranges that is drawn, ten times over as one word, in 10-point Calibri, Cambria, Arial, Times
//    New Roman and Courier New, plain and bold, 16 characters to a paragraph, each after its code point, such as u05d0,
//    in 6-point Calibri. A word's width over ten is the character's, and the font it is drawn in shows whether the font
//    has it, or Word draws it in another
// S, B and H: as word-character-widths.ts's
//
// The fonts, and the spaces and words of S, B and H, are written in word-stops-more-widths.json, beside the document, for
// the reader, word-stops-more-widths.py.
//
// Word's PDF, saved from Word 16 for Mac on 2026-10-05, showed:
// W: each face's Hebrew, Thai, Arabic-Indic digits, box drawing, shapes, symbols and dingbats as wide as the font it draws
//    them in has them: its own, or another where it lacks them, such as Calibri's Thai in Tahoma, its Devanagari digits in
//    Mangal, its box drawing in MS Gothic and its ★ in Segoe UI Symbol. A line is as tall as the tallest of the fonts on
//    it, by their ascents and descents, as their descriptors give them, but for Kohinoor Devanagari, in which Cambria and
//    Times New Roman's Devanagari is drawn, whose lines are 300 twips apart where its descriptor makes 280. Ten of an
//    Arabic or Devanagari letter in a row Word joined into forms of other widths, so their widths aren't shown
//
// Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-more-widths.ts [folder]; STOPS_ITALIC=1 for italics
// cspell:ignore bbox Caladea
import { mkdirSync, writeFileSync } from "node:fs";

import { Document, Packer, Paragraph, TextRun } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

// The ranges: Hebrew; Arabic; Devanagari; Thai; and box drawing, block elements, geometric shapes, miscellaneous symbols
// and dingbats
const RANGES = [
    [0x590, 0x5ff],
    [0x600, 0x6ff],
    [0x900, 0x97f],
    [0xe00, 0xe7f],
    [0x2500, 0x257f],
    [0x2580, 0x259f],
    [0x25a0, 0x25ff],
    [0x2600, 0x26ff],
    [0x2700, 0x27bf],
] as const;

const FONTS = ["Calibri", "Cambria", "Arial", "Times New Roman", "Courier New"] as const;
const ITALIC = process.env.STOPS_ITALIC === "1";
const NAME = ITALIC ? "word-stops-more-italic-widths" : "word-stops-more-widths";
const FACES = FONTS.flatMap((font) => [false, true].map((bold) => (ITALIC ? { font, bold, italic: true } : { font, bold })));

// Points, and how many times each character is written in its word
const SIZE = 10;
const COPIES = 10;
const PER_PARAGRAPH = 16;
// The size of the code point written before each character's word, small to save room
const LABEL_SIZE = 6;

// Characters that are drawn: not spaces, marks, which go on the character before them, formatting characters, or code
// points that aren't characters
const isDrawn = (code: number): boolean => !/[\p{C}\p{Z}\p{M}]/u.test(String.fromCodePoint(code));
const DRAWN = RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, index) => first + index)).filter(isDrawn);

// The spaces, and the characters that take no room, between H's
const SPACES = [
    0x20, 0xa0, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x202f, 0x205f, 0x3000, 0x200b,
    0x200c, 0x200d, 0x200e, 0x200f, 0x2060,
];
// The spaces lines may break after
const BREAKS = [0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x202f, 0x205f, 0x3000];

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): readonly string[] => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]);

const hex = (code: number): string => code.toString(16).padStart(4, "0");
const label = (text: string): TextRun => new TextRun({ text: `${text} `, font: "Calibri", size: SIZE * 2 });

// Calibri 11, in which B and H are, and the width of its lines on A4 with margins of an inch, in twips
const CALIBRI = { font: "Calibri", size: 11 };
const LINE = 11906 - 2 * 1440;
const twips = (text: string): number => measureTextWidth(text, CALIBRI) * 20;
// Calibri's widths of the spaces, in thousandths of an em, from Carlito, and Word's for the en and em spaces (word-watertight-text
// TX19a and TX19b): half of one is how far before the margin H's last word ends
const SPACE_WIDTHS: Readonly<Record<number, number>> = {
    0x20: 226,
    0x2000: 500,
    0x2001: 1000,
    0x2002: 498,
    0x2003: 905,
    0x2004: 335,
    0x2005: 250,
    0x2006: 167,
    0x2007: 539,
    0x2008: 217,
    0x2009: 200,
    0x200a: 125,
    0x202f: 226,
    0x205f: 222,
    0x3000: 1000,
};

/**
 * A word as wide as `width` twips in Calibri 11, to within a twip, from letters of different widths.
 */
const wordOfWidth = (width: number): string => {
    const letters = [..."eoirtfsc"];
    const widths = letters.map(twips);
    let best = { word: "", error: Infinity };
    const search = (index: number, word: string, total: number): void => {
        if (Math.abs(width - total) < best.error) {
            best = { word, error: Math.abs(width - total) };
        }
        if (index === letters.length || total > width) {
            return;
        }
        for (let count = 0; count <= 4; count++) {
            search(index + 1, word + letters[index].repeat(count), total + count * widths[index]);
        }
    };
    search(0, "", 0);
    return best.word;
};

// The characters of each paragraph of W, which are the same in each face
const PARAGRAPHS = Array.from({ length: Math.ceil(DRAWN.length / PER_PARAGRAPH) }, (_, index) =>
    DRAWN.slice(index * PER_PARAGRAPH, (index + 1) * PER_PARAGRAPH),
);
const BREAK_WORDS = prose(40);

// A face's bold and italic, as a run writes them
const runFace = ({
    bold,
    italic,
}: {
    readonly bold: boolean;
    readonly italic?: boolean;
}): { readonly bold: boolean; readonly italics?: boolean } => (italic ? { bold, italics: true } : { bold });

// W1 to W1250: the paragraphs of characters in each face in turn, the first face's first
const widthParagraphs = FACES.flatMap(({ font, ...face }, faceIndex) =>
    PARAGRAPHS.map(
        (codes, index) =>
            new Paragraph({
                children: [
                    label(`W${faceIndex * PARAGRAPHS.length + index + 1}`),
                    ...codes.flatMap((code) => [
                        new TextRun({ text: `u${hex(code)}`, font: "Calibri", size: LABEL_SIZE * 2 }),
                        // The spaces around the word are in its font, so they are wide enough for pdftotext to part the words
                        new TextRun({ text: ` ${String.fromCodePoint(code).repeat(COPIES)} `, font, ...runFace(face), size: SIZE * 2 }),
                    ]),
                ],
            }),
    ),
);

// S1 to S220: each space in each face in turn
const spaceParagraphs = FACES.flatMap(({ font, ...face }, faceIndex) =>
    SPACES.map(
        (code, index) =>
            new Paragraph({
                children: [
                    label(`S${faceIndex * SPACES.length + index + 1}`),
                    new TextRun({
                        text: `${"H".repeat(COPIES)} H${`${String.fromCodePoint(code)}H`.repeat(COPIES)}`,
                        font,
                        ...runFace(face),
                        size: SIZE * 2,
                    }),
                ],
            }),
    ),
);

// B1 to B14: each space lines may break after
const breakParagraphs = BREAKS.map(
    (code, index) => new Paragraph({ children: [new TextRun(`B${index + 1} ${BREAK_WORDS.join(String.fromCodePoint(code))}`)] }),
);

// H1 to H15: U+0020, and each space lines may break after
const HANGS = [0x20, ...BREAKS].map((code, index) => {
    const name = `H${index + 1}`;
    // The word ends half the space's width before the margin
    const end = LINE - (SPACE_WIDTHS[code] * 220) / 1000 / 2;
    const filler = prose(40).reduce((text, word) => (twips(`${text} ${word} `) < end - 600 ? `${text} ${word}` : text), name);
    const word = wordOfWidth(end - twips(`${filler} `));
    return { code, filler, word, end, after: prose(12).join(" ") };
});
const hangParagraphs = HANGS.map(
    ({ code, filler, word, after }) => new Paragraph({ children: [new TextRun(`${filler} ${word}${String.fromCodePoint(code)}${after}`)] }),
);

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections: [
        { children: widthParagraphs },
        { children: spaceParagraphs },
        ...(ITALIC ? [] : [{ children: [...breakParagraphs, ...hangParagraphs] }]),
    ],
});

const main = async (): Promise<void> => {
    const OUT = process.argv[2] ?? "build/word-stops";
    mkdirSync(OUT, { recursive: true });
    writeFileSync(`${OUT}/${NAME}.docx`, await Packer.toBuffer(doc));
    const sidecar = {
        size: SIZE,
        copies: COPIES,
        faces: FACES,
        paragraphs: PARAGRAPHS,
        spaces: SPACES,
        breaks: ITALIC ? { codes: [], words: [] } : { codes: BREAKS, words: BREAK_WORDS },
        hangs: ITALIC ? [] : HANGS.map(({ code, word, end }) => ({ code, word, end })),
    };
    writeFileSync(`${OUT}/${NAME}.json`, `${JSON.stringify(sidecar)}\n`);
    console.log(`${DRAWN.length} characters in each of ${FACES.length} faces, in ${widthParagraphs.length} paragraphs`);
    if (ITALIC) {
        return;
    }
    console.log(
        HANGS.map(
            ({ code, word, end, filler }, index) =>
                `H${index + 1} ${hex(code)} ${word} ends at ${end.toFixed(1)}, ${(end - twips(`${filler} ${word}`)).toFixed(2)} off`,
        ).join("\n"),
    );
};

void main();
