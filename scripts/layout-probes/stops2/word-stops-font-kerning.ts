// lay-stops2: how Word kerns text and joins ligatures in Office's fonts that Word for Mac installs, which docx/layout's
// width tables don't have ("kerned text in a font whose kerning isn't known", "ligatures in a font whose ligatures aren't
// known"): every document made from Word's Normal template kerns its text from 1 point, so Calibri Light's headings, and
// Aptos's text since Word 365 made it the default, are kerned. #3661 found Word kerns Aptos tighter than its font file's
// GPOS and kern tables say on 3% of words, so the kerning comes from Word's own PDF, as for the tables' fonts.
// Made from scripts/layout-probes/word-kerning.ts with its fonts changed: I, K, L (Normal's ligatures and all) and P for
// each face of the fonts, and R and SP as there. Read Word's PDF with word-kerning.py, which reads the .json beside it.
//
// It writes word-stops-font-kerning.docx: Calibri Light, Aptos, Aptos Narrow, Georgia, Trebuchet MS and Verdana; and with
// STOPS_SET=2, word-stops-font-kerning2.docx: Century Gothic, Consolas, Candara, Corbel, Constantia, Book Antiqua, Gill Sans
// MT, Franklin Gothic Book, Tahoma and Impact.
//
// Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-font-kerning.ts [folder]
/**
 * Probes of how Word kerns text and joins ligatures in the fonts of the width tables, and in Aptos, for docx/layout's
 * kerning (`w:kern`) and ligatures (`w14:ligatures`), which Word's own Normal template turns on: kerning from 1 point,
 * and standard and contextual ligatures. Open the document in Word and save it as a PDF beside it, and read the PDF with
 * word-kerning.py, which reads where Word draws each glyph.
 *
 * Its pages are 22 inches square, the largest Word has, with margins of half an inch, so a paragraph is one line of up to
 * 1,512 points. Each paragraph is one line, in 10 points, and word-kerning.json, beside the document, has the text of
 * each in order, for the reader. The lines of each probe come after a line naming it, such as "K3 Calibri italic".
 *
 * I: each character of Windows-1252, apart, in each face of the probes, so the reader knows the glyph Word draws for each
 * K: every pair of the characters of Windows-1252 (WinAnsi, the characters of most text in Western European languages:
 *    printable ASCII, Latin-1 and 27 more, such as curly quotes, dashes and €), kerned from 1 point, in Calibri, Cambria,
 *    Arial and Times New Roman, plain, bold, italic and bold italic, and every pair of printable ASCII in Courier New.
 *    The characters follow each other so that each pair is next to each other once (a de Bruijn sequence), so a pair's
 *    kerning is how much nearer Word draws its second character than the first's width
 * L: words of two and three characters that a font could join, each after a space, not kerned, in each face of Calibri,
 *    Cambria and Times New Roman, with each ligature setting Word's Font dialog writes: standard ligatures only, standard
 *    and contextual (Normal's), historical and discretional, and all; and in Arial and Courier New with all. The words are
 *    "f" and "t", and for the discretional settings "T", "c", "ç", "s" and "i", each followed by each character, and "ff",
 *    "tt", "ft" and "tf" each followed by each character
 * LK: the kerning beside the glyphs of joined letters: each of the ligatures Carlito, as wide as Calibri, joins, and those
 *    of Cambria and Times New Roman, before and after each character, and before each other, kerned from 1 point, with
 *    standard and contextual ligatures, and with all for discretional ones
 * A: L's words in Aptos, plain and bold, kerned from 1 point with Normal's ligatures, and with all, for measuring fonts
 *    from their files, and lines of prose in Aptos with Normal's settings
 * P: lines of prose with Normal's settings in each font of the width tables, and in Calibri bold and italic, for where
 *    Word puts each word
 * R: kerning and ligatures across runs: letters in runs that differ only in their colour or their language, and a word
 *    split into runs that are the same, in Calibri 11
 * SP: kerning and ligatures with space between the characters, characters drawn wider, and small capitals, in Calibri 11
 *
 * Word's PDF, saved from Word 16 for Mac on 2026-10-02 (word-kerning.pdf, beside it), showed:
 * K: Word kerns every face but Courier New, which it kerns not at all, as the open fonts as wide as them do, Carlito and
 *    Liberation Sans and Serif, to within a thousandth of an em, but for a few characters its own fonts kern otherwise,
 *    such as Calibri's ƒ, Calibri Bold's apostrophe and Calibri Italic's æ. Arial and Times New Roman kern an A, L, P, T,
 *    V, W or Y with the space beside it. Cambria kerns ten times the pairs Caladea does, and draws its regular face's
 *    letters with accents, kerned, as the letter and the accent, each a glyph. Word draws a hyphen, en dash, no-break
 *    space, ™ and backslash, and an à in kerned text, up to 25 thousandths of an em from where their widths and kerning
 *    put them, and the text after them with them, in text kerned or not, so the pairs before them aren't read
 * L: Calibri joins ff, fi, fl, ffi, ffl, ft, tt, tti, ti and the rest of its standard ligatures with standard ligatures,
 *    standard and contextual, and all; and ch, ck, ct, st and ij with historical and discretional, and all. Times New Roman
 *    joins fi, fl, ff, ffi, ffl, fj, ffj and Th only with discretional ligatures. Cambria draws an f before some letters
 *    another way, as wide, and Arial and Courier New join nothing
 * LK: Word kerns the glyphs Calibri's ligatures make as Carlito kerns its own, to within a thousandth of an em for 98.8%
 *    of the pairs read, and those off are off as the pairs before the characters it moves are
 * A: Aptos joins ff, fi and fl with Normal's ligatures, and fj too with all, as its GSUB table has them
 * P: the width tables, kerned and with Normal's ligatures, put each word where Word does, to within 0.25 points across a
 *    line of 1,300, in Calibri, Arial and Times New Roman
 * R: Word kerns letters across runs of other colours (R1c), and joins them across runs (R2c, R2d), but doesn't kern them
 *    across runs of other languages (R1d)
 * SP: Word joins no letters in text with a point between its characters, or half a point taken away, but kerns it (SP1,
 *    SP2); kerns and joins letters drawn wider (SP3); and kerns the small capitals of small capitals, but not a capital
 *    with the small capital after it (SP4)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/word-kerning.ts, which writes build/word-probes/word-kerning.docx and
 * word-kerning.json
 */
// cspell:ignore bbox Carlito WinAnsi Aptos Caladea GSUB GPOS
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import { Document, Packer, Paragraph, type ParagraphChild, TextRun } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

const range = (first: number, last: number): readonly number[] => Array.from({ length: last - first + 1 }, (_, index) => first + index);

// The characters Windows-1252 has besides printable ASCII and Latin-1, in its bytes 0x80 to 0x9F
const WINDOWS_1252_MORE = [
    0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d,
    0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
];
// The characters of Windows-1252, with the space and the no-break space, less the soft hyphen, which Word doesn't draw
const WINDOWS_1252 = [...range(0x20, 0x7e), ...range(0xa0, 0xff).filter((code) => code !== 0xad), ...WINDOWS_1252_MORE]
    .sort((one, other) => one - other)
    .map((code) => String.fromCodePoint(code));
const ASCII = range(0x20, 0x7e).map((code) => String.fromCodePoint(code));

type Face = { readonly font: string; readonly bold: boolean; readonly italic: boolean };
const facesOf = (font: string): readonly Face[] =>
    [
        [false, false],
        [true, false],
        [false, true],
        [true, true],
    ].map(([bold, italic]) => ({ font, bold, italic }));
const nameOf = ({ font, bold, italic }: Face): string => `${font}${bold ? " bold" : ""}${italic ? " italic" : ""}`;

// The ligature settings of Word's Font dialog, as w14:ligatures writes them
const STANDARD_SETTINGS = ["standard", "standardContextual"] as const;
const DISCRETIONAL_SETTINGS = ["historicalDiscretional", "all"] as const;
type Setting = (typeof STANDARD_SETTINGS)[number] | (typeof DISCRETIONAL_SETTINGS)[number];

// Points, and the width of a line, in points: 22 inches less half an inch on each side
const SIZE = 10;
const PAGE = 22 * 1440;
const MARGIN = 720;
const LINE = (PAGE - 2 * MARGIN) / 20;
// How much of a line a paragraph fills, measured without kerning or ligatures, so that each is one line in Word
const FILL = 0.9;

/**
 * A sequence of the characters in which each pair of them, the same character twice too, is next to each other once: a
 * de Bruijn sequence of order 2, with its first character again at its end.
 */
const everyPair = (characters: readonly string[]): readonly string[] => {
    const count = characters.length;
    const sequence: number[] = [];
    const digits = [0, 0, 0];
    const build = (at: number, period: number): void => {
        if (at > 2) {
            if (2 % period === 0) {
                sequence.push(...digits.slice(1, period + 1));
            }
            return;
        }
        digits[at] = digits[at - period];
        build(at + 1, period);
        for (let digit = digits[at - period] + 1; digit < count; digit++) {
            digits[at] = digit;
            build(at + 1, at);
        }
    };
    build(1, 1);
    return [...sequence, sequence[0]].map((index) => characters[index]);
};

/** Splits characters into lines that fill a line, each starting with the character the line before ends with */
const linesOf = (characters: readonly string[], face: Face): readonly string[] => {
    const lines: string[] = [];
    let start = 0;
    while (start < characters.length - 1) {
        let end = start + 1;
        let width = measureTextWidth(characters[start], { ...face, size: SIZE });
        while (end < characters.length && width + measureTextWidth(characters[end], { ...face, size: SIZE }) < LINE * FILL) {
            width += measureTextWidth(characters[end], { ...face, size: SIZE });
            end += 1;
        }
        lines.push(characters.slice(start, end).join(""));
        start = end - 1;
    }
    return lines;
};

/** Words, each after a space, in lines that fill a line */
const wordLines = (words: readonly string[], face: Face): readonly string[] =>
    words.reduce<readonly string[]>((lines, word) => {
        const last = lines[lines.length - 1];
        return last !== undefined && measureTextWidth(`${last} ${word}`, { ...face, size: SIZE }) < LINE * FILL
            ? [...lines.slice(0, -1), `${last} ${word}`]
            : [...lines, ` ${word}`];
    }, []);

// The words of L: the letters fonts join after, each followed by each character, and the pairs of them followed by each
const STANDARD_STARTS = ["f", "t", "ff", "tt", "ft", "tf"];
const DISCRETIONAL_STARTS = [...STANDARD_STARTS, "T", "c", "ç", "s", "i"];
const wordsAfter = (starts: readonly string[]): readonly string[] =>
    starts.flatMap((start) => WINDOWS_1252.map((character) => `${start}${character}`));

// The joined letters of LK: Carlito's standard ligatures of the characters of Windows-1252, and its discretional ones,
// which Calibri's are, and the letters Cambria and Times New Roman may join
const ACCENTED_I = ["ì", "í", "î", "ï"];
const CALIBRI_STANDARD = [
    ..."ff fi fl ffi ffl ft fft tt tti ttf ti tf fb fh fk fj ffb ffh ffk ffj".split(" "),
    ...["f", "ff", "t", "tt"].flatMap((start) => ACCENTED_I.map((letter) => `${start}${letter}`)),
];
const CALIBRI_DISCRETIONAL = "ch ck ct çt ij st".split(" ");
const CAMBRIA_STANDARD = ["ff", "fi", "fl", "ffi", "ffl", "fb", "fh", "fk", "fj", "ft", ...ACCENTED_I.map((letter) => `f${letter}`)];
const TIMES_DISCRETIONAL = "ff fi fl ffi ffl fj ffj Th".split(" ");
/** The words of LK for joined letters: after each character, before each, and before each of the others */
const besideEach = (joined: readonly string[]): readonly string[] =>
    joined.flatMap((letters) => [
        ...WINDOWS_1252.map((character) => `${letters}${character}`),
        ...WINDOWS_1252.map((character) => `${character}${letters}`),
        ...joined.map((other) => `${letters}${other}`),
    ]);

/** A paragraph of the probes, for the reader: what is in it, in which face, kerned or not, and with which ligatures */
type Line = {
    readonly probe: string;
    readonly face: Face;
    readonly size: number;
    readonly kerned: boolean;
    readonly ligatures?: Setting;
    readonly text: string;
};

const lines: Line[] = [];
const paragraphs: Paragraph[] = [];

/**
 * Ligatures are written as a language that this script replaces with them (see `main`), as docx doesn't write them. The
 * language is the last of a run's properties, where w14:ligatures goes
 */
const ligatureRun = (setting: Setting | undefined): { readonly language?: { readonly value: string } } =>
    setting === undefined ? {} : { language: { value: `x-ligatures-${setting}` } };

const add = (line: Line): void => {
    lines.push(line);
    const { face, size, kerned, ligatures, text } = line;
    paragraphs.push(
        new Paragraph({
            children: [
                new TextRun({
                    text,
                    font: face.font,
                    size: size * 2,
                    bold: face.bold,
                    italics: face.italic,
                    ...(kerned ? { kern: 2 } : {}),
                    ...ligatureRun(ligatures),
                }),
            ],
        }),
    );
};

const LABEL_FACE: Face = { font: "Calibri", bold: false, italic: false };
const label = (text: string): void => add({ probe: "label", face: LABEL_FACE, size: SIZE, kerned: false, text });

// I1 to I24: each character of Windows-1252 in each face of the probes, apart, not kerned and with no ligatures, so the
// reader knows each character's glyph
// The faces of Office's fonts that Word for Mac installs, which docx/layout's tables don't have: each font's own faces
const SECOND = process.env.STOPS_SET === "2";
const NEW_FACES: readonly Face[] = SECOND
    ? [
          ...["Century Gothic", "Consolas", "Candara", "Corbel", "Constantia", "Book Antiqua", "Gill Sans MT"].flatMap((font) =>
              facesOf(font),
          ),
          ...["Franklin Gothic Book"].flatMap((font) => facesOf(font).filter(({ bold }) => !bold)),
          ...["Tahoma"].flatMap((font) => facesOf(font).filter(({ italic }) => !italic)),
          { font: "Impact", bold: false, italic: false },
      ]
    : [
          ...["Calibri Light"].flatMap((font) => facesOf(font).filter(({ bold }) => !bold)),
          ...["Aptos", "Aptos Narrow", "Georgia", "Trebuchet MS", "Verdana"].flatMap((font) => facesOf(font)),
      ];
const NAME = SECOND ? "word-stops-font-kerning2" : "word-stops-font-kerning";
const FACES = NEW_FACES;
const APTOS_FACES: readonly Face[] = [];
[...FACES, ...APTOS_FACES].forEach((face, index) => {
    label(`I${index + 1} ${nameOf(face)}`);
    // The space is the one between them
    for (const text of wordLines(WINDOWS_1252.slice(1), face)) {
        add({ probe: `I${index + 1}`, face, size: SIZE, kerned: false, text });
    }
});

// K1 to K20
const KERNED = [...NEW_FACES.map((face) => ({ face, characters: WINDOWS_1252 }))];
KERNED.forEach(({ face, characters }, index) => {
    label(`K${index + 1} ${nameOf(face)}`);
    for (const text of linesOf(everyPair(characters), face)) {
        add({ probe: `K${index + 1}`, face, size: SIZE, kerned: true, text });
    }
});

// L1 to L56
const JOINED: readonly { readonly face: Face; readonly setting: Setting }[] = [
    ...NEW_FACES.flatMap((face) => [
        { face, setting: "standardContextual" as const },
        { face, setting: "all" as const },
    ]),
];
JOINED.forEach(({ face, setting }, index) => {
    label(`L${index + 1} ${nameOf(face)} ${setting}`);
    const words = wordsAfter((STANDARD_SETTINGS as readonly string[]).includes(setting) ? STANDARD_STARTS : DISCRETIONAL_STARTS);
    for (const text of wordLines(words, face)) {
        add({ probe: `L${index + 1}`, face, size: SIZE, kerned: false, ligatures: setting, text });
    }
});

// LK1 to LK16
const BESIDE: readonly { readonly face: Face; readonly setting: Setting; readonly joined: readonly string[] }[] = [];
BESIDE.forEach(({ face, setting, joined }, index) => {
    label(`LK${index + 1} ${nameOf(face)} ${setting}`);
    for (const text of wordLines(besideEach(joined), face)) {
        add({ probe: `LK${index + 1}`, face, size: SIZE, kerned: true, ligatures: setting, text });
    }
});

// A1 to A4, and A5, prose
const APTOS: readonly { readonly face: Face; readonly setting: Setting }[] = [];
APTOS.forEach(({ face, setting }, index) => {
    label(`A${index + 1} ${nameOf(face)} ${setting}`);
    const words = wordsAfter(setting === "all" ? DISCRETIONAL_STARTS : STANDARD_STARTS);
    for (const text of wordLines(words, face)) {
        add({ probe: `A${index + 1}`, face, size: SIZE, kerned: true, ligatures: setting, text });
    }
});
const PROSE =
    "The official staff of the office offered fifty different affiliations after the first stiff fight; with difficulty " +
    "they flew to Tiffany's fjord, effectively fitting the attitude of affluent artists who fill the coffee shop at night. ";

// P1 to P7: prose with Normal's settings, kerned from 1 point with standard and contextual ligatures, in each font, and
// in Calibri bold and italic, for where Word puts each word
const STORY =
    "“To Wyatt’s office,” Avery wrote — fifty-five affluent officials flew to Tyrone’s fjord at 7:45; Yvonne’s staff " +
    "offered “efficient” coffee, attitude & difficult afflictions (Vol. VII, p. 14). L’Atelier’s AVANT-GARDE “Façade” " +
    "kept 98.6% of the WAVY yellow awnings; Tom’s P.T.A. took Ty, Wa and Yo to the “Fjord-Café” for 3½ hours. ";
const PROSE_FACES: readonly Face[] = [...NEW_FACES.filter(({ bold, italic }) => !bold && !italic)];
PROSE_FACES.forEach((face, index) => {
    label(`P${index + 1} ${nameOf(face)}`);
    for (const text of wordLines(STORY.repeat(12).trim().split(" "), face).slice(0, 8)) {
        add({ probe: `P${index + 1}`, face, size: SIZE, kerned: true, ligatures: "standardContextual", text: text.trimStart() });
    }
});

/**
 * R and SP: probes of a few runs each, on letter-sized pages in Calibri 11, each line's first word naming it. The reader
 * reads the width of the word after the name.
 */
type Piece = { readonly text: string } & Readonly<Record<string, unknown>>;
const CALIBRI_11 = { font: "Calibri", size: 22 };
const small: { readonly name: string; readonly pieces: readonly Piece[]; readonly kerned: boolean; readonly ligatures?: Setting }[] = [];
const probe = (name: string, pieces: readonly Piece[], kerned: boolean, ligatures?: Setting): void => {
    small.push({ name, pieces, kerned, ligatures });
};
const KERN_WORD = "ToToToToToToToToToTo";
const LIGATURE_WORD = "officialofficialofficial";
const alternate = (text: string, other: Readonly<Record<string, unknown>>): readonly Piece[] =>
    [...text].map((letter, index) => (index % 2 === 0 ? { text: letter } : { text: letter, ...other }));
// R1: kerning between letters in runs of other colours, and of other languages, against one run, kerned and not
probe("R1a", [{ text: KERN_WORD }], false);
probe("R1b", [{ text: KERN_WORD }], true);
probe("R1c", alternate(KERN_WORD, { color: "C00000" }), true);
probe("R1d", alternate(KERN_WORD, { language: { value: "fr-FR" } }), true);
probe("R1e", alternate(KERN_WORD, {}), true);
// R2: ligatures across runs: "official" split after "of" in runs that are the same, of another colour, of another language
probe("R2a", [{ text: LIGATURE_WORD }], false);
probe("R2b", [{ text: LIGATURE_WORD }], false, "standardContextual");
const splitWord = (other: Readonly<Record<string, unknown>>): readonly Piece[] =>
    LIGATURE_WORD.split("official").flatMap((part, index) => (index === 0 ? [] : [{ text: "of" }, { text: "ficial", ...other }]));
probe("R2c", splitWord({}), false, "standardContextual");
probe("R2d", splitWord({ color: "C00000" }), false, "standardContextual");
// SP1: kerning and ligatures with a point between the characters, and with half a point taken away
for (const [name, spacing] of [
    ["SP1", 20],
    ["SP2", -10],
] as const) {
    probe(`${name}a`, [{ text: KERN_WORD, characterSpacing: spacing }], false);
    probe(`${name}b`, [{ text: KERN_WORD, characterSpacing: spacing }], true);
    probe(`${name}c`, [{ text: LIGATURE_WORD, characterSpacing: spacing }], false);
    probe(`${name}d`, [{ text: LIGATURE_WORD, characterSpacing: spacing }], false, "standardContextual");
}
// SP3: characters drawn half as wide again
probe("SP3a", [{ text: KERN_WORD, scale: 150 }], false);
probe("SP3b", [{ text: KERN_WORD, scale: 150 }], true);
probe("SP3c", [{ text: LIGATURE_WORD, scale: 150 }], false);
probe("SP3d", [{ text: LIGATURE_WORD, scale: 150 }], false, "standardContextual");
// SP4: small capitals, whose capitals are kerned with the small ones, or not
probe("SP4a", [{ text: "TodayTodayTodayToday", smallCaps: true }], false);
probe("SP4b", [{ text: "TodayTodayTodayToday", smallCaps: true }], true);
probe("SP4c", [{ text: LIGATURE_WORD, smallCaps: true }], false, "standardContextual");
probe("SP4d", [{ text: LIGATURE_WORD, smallCaps: true }], false);

const smallParagraphs = small.map(
    ({ name, pieces, kerned, ligatures }) =>
        new Paragraph({
            children: [
                // The probe's name is a word of its own, not kerned and with no ligatures, so the word after it is boxed alone
                new TextRun({ ...CALIBRI_11, text: `${name} ` }),
                ...pieces.map(
                    (piece): ParagraphChild =>
                        new TextRun({
                            ...CALIBRI_11,
                            ...piece,
                            ...(kerned ? { kern: 2 } : {}),
                            ...(ligatures === undefined ? {} : ligatureRun(ligatures)),
                        }),
                ),
            ],
        }),
);

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: SIZE * 2 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections: [
        {
            properties: {
                page: { size: { width: PAGE, height: PAGE }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
            },
            children: paragraphs,
        },
        { children: smallParagraphs },
    ],
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    // Ligatures, written as a language, at the end of the run's properties, as their schema has them
    const xml = (await zip.file("word/document.xml")!.async("string")).replace(
        /<w:lang w:val="x-ligatures-(\w+)"\/>/g,
        '<w14:ligatures w14:val="$1"/>',
    );
    zip.file("word/document.xml", xml);
    const OUT = process.argv[2] ?? "build/word-stops";
    mkdirSync(OUT, { recursive: true });
    writeFileSync(`${OUT}/${NAME}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
    // Each line as [its probe, its face's name, whether it is kerned, its ligatures or "", its text]
    const sidecar = {
        size: SIZE,
        characters: WINDOWS_1252.join(""),
        lines: lines.map(({ probe, face, kerned, ligatures, text }) => [probe, nameOf(face), kerned, ligatures ?? "", text]),
        small: small.map(({ name, pieces, kerned, ligatures }) => [name, pieces.map(({ text }) => text).join(""), kerned, ligatures ?? ""]),
    };
    writeFileSync(`${OUT}/${NAME}.json`, `${JSON.stringify(sidecar)}\n`);
    const count = (probe: string): number =>
        lines.filter((line) => line.probe.replace(/\d+$/, "") === probe).reduce((total, line) => total + [...line.text].length, 0);
    console.log(
        `${lines.length} lines: K ${count("K")} characters, L ${count("L")}, LK ${count("LK")}, A ${count("A")}, P ${count("P")}; ` +
            `${small.length} small probes`,
    );
};

void main();
