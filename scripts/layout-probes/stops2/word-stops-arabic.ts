/**
 * Probes of how wide Word draws Arabic's letters in each of the forms it joins them in, for the next batch Word saves.
 * `word-stops-more-widths.docx` measured ten of each letter in a row, which Word joins, so it showed their digits'
 * widths, which docx/layout follows, but not their letters'; docx/layout stops at Arabic letters ("a character whose width
 * in its font isn't known"), and so at Arabic text justified for Thai or with a kashida.
 *
 * word-stops-arabic.docx, in each of the width tables' five fonts, plain and bold, at 10 points, in right-to-left runs:
 * AR1: each letter of Arabic (U+0621 to U+063A and U+0641 to U+064A) and Persian's peh, tcheh, jeh, keheh, gaf and farsi
 *   yeh, in each of its four forms, ten times over as one word, after its code point and form in Calibri 6, such as
 *   u0628m: isolated (i, the letter alone), final (f, after a tatweel, U+0640), initial (n, before one) and medial (m,
 *   between two), each copy parted from the next by a zero-width non-joiner (U+200C), so that the copies don't join;
 *   the lam-alef ligatures (U+0644 with U+0627, U+0623, U+0625 and U+0622), alone and after a tatweel; and ten tatweels,
 *   which join each other, whose width is taken from the others'. A letter that joins only the letter before it, such as
 *   alef, has no initial or medial form, so its n and m words show what Word does with the tatweel after it
 * AR2: three lines of Arabic prose, left aligned, in each face, for the line breaks a model of the joined forms gives
 *
 * Read Word's PDF with word-stops-arabic.py, which reads word-stops-arabic.json, written beside the document.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-arabic.ts [folder]
 */
// cspell:ignore tatweel tatweels tcheh keheh
import { mkdirSync, writeFileSync } from "node:fs";

import { Document, Packer, Paragraph, TextRun } from "docx";

const FONTS = ["Calibri", "Cambria", "Arial", "Times New Roman", "Courier New"] as const;
const FACES = FONTS.flatMap((font) => [false, true].map((bold) => ({ font, bold })));
// Points, and how many times each form is written in its word
const SIZE = 10;
const COPIES = 10;
const PER_PARAGRAPH = 16;
const LABEL_SIZE = 6;

const TATWEEL = "ـ";
const NON_JOINER = "‌";
const LETTERS = [
    ...Array.from({ length: 0x63a - 0x621 + 1 }, (_, index) => 0x621 + index),
    ...Array.from({ length: 0x64a - 0x641 + 1 }, (_, index) => 0x641 + index),
    0x67e,
    0x686,
    0x698,
    0x6a9,
    0x6af,
    0x6cc,
];
const FORMS = {
    i: (letter: string): string => letter,
    f: (letter: string): string => `${TATWEEL}${letter}`,
    n: (letter: string): string => `${letter}${TATWEEL}`,
    m: (letter: string): string => `${TATWEEL}${letter}${TATWEEL}`,
} as const;
const LAM_ALEFS = [0x627, 0x623, 0x625, 0x622];

/** A word to measure: its label, and its text, ten copies parted by zero-width non-joiners */
type Word = { readonly label: string; readonly text: string; readonly tatweels: number };
const hex = (code: number): string => code.toString(16).padStart(4, "0");
const copies = (unit: string): string => Array.from({ length: COPIES }, () => unit).join(NON_JOINER);
const WORDS: readonly Word[] = [
    ...LETTERS.flatMap((code) =>
        Object.entries(FORMS).map(([form, write]) => ({
            label: `u${hex(code)}${form}`,
            text: copies(write(String.fromCodePoint(code))),
            tatweels: write("").length,
        })),
    ),
    ...LAM_ALEFS.flatMap((alef) => [
        { label: `l${hex(alef)}i`, text: copies(`ل${String.fromCodePoint(alef)}`), tatweels: 0 },
        { label: `l${hex(alef)}f`, text: copies(`${TATWEEL}ل${String.fromCodePoint(alef)}`), tatweels: 1 },
    ]),
    { label: "t0640", text: TATWEEL.repeat(COPIES), tatweels: 0 },
];
const PARAGRAPHS = Array.from({ length: Math.ceil(WORDS.length / PER_PARAGRAPH) }, (_, index) =>
    WORDS.slice(index * PER_PARAGRAPH, (index + 1) * PER_PARAGRAPH),
);

const label = (text: string, size = SIZE): TextRun => new TextRun({ text, font: "Calibri", size: size * 2 });
const arabic = (text: string, { font, bold }: (typeof FACES)[number]): TextRun =>
    new TextRun({ text, font, bold, size: SIZE * 2, rightToLeft: true });

// AR1 1 to AR1 n: the paragraphs of words in each face in turn, the first face's first
const formParagraphs = FACES.flatMap((face, faceIndex) =>
    PARAGRAPHS.map(
        (words, index) =>
            new Paragraph({
                children: [
                    label(`AR1 ${faceIndex * PARAGRAPHS.length + index + 1} `),
                    ...words.flatMap(({ label: name, text }) => [label(name, LABEL_SIZE), arabic(` ${text} `, face)]),
                ],
            }),
    ),
);

const ARABIC_WORDS = ["المسح", "الساحل", "صنع", "في", "الصيف", "بالقارب", "وعلى", "الأقدام", "من", "المنارة", "إلى", "مصب", "النهر"];
const PROSE = Array.from({ length: 40 }, (_, index) => ARABIC_WORDS[index % ARABIC_WORDS.length]).join(" ");
// AR2a to AR2j: prose in each face
const proseParagraphs = FACES.map((face, index) => new Paragraph({ children: [label(`AR2${"abcdefghij"[index]} `), arabic(PROSE, face)] }));

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections: [{ children: formParagraphs }, { children: proseParagraphs }],
});

const OUT = process.argv[2] ?? "build/word-stops";
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/word-stops-arabic.docx`, await Packer.toBuffer(doc));
writeFileSync(
    `${OUT}/word-stops-arabic.json`,
    `${JSON.stringify({
        size: SIZE,
        copies: COPIES,
        faces: FACES,
        paragraphs: PARAGRAPHS.map((words) => words.map(({ label: name, tatweels }) => ({ label: name, tatweels }))),
    })}\n`,
);
console.log(`${WORDS.length} words in each of ${FACES.length} faces, in ${formParagraphs.length} paragraphs`);
