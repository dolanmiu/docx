/**
 * Generates src/text-layout/font-widths.ts: how wide each character is
 * in the fonts Word documents use most, and in Office's other fonts that Word installs, so shapes can be sized to fit
 * their text and pages laid out.
 *
 * Calibri, Cambria, Arial, Times New Roman and Courier New: the widths come from fonts with an open license that are made
 * to have the same widths as Word's fonts:
 * Carlito (Calibri), Caladea (Cambria), and Liberation Sans, Serif and Mono (Arial, Times New Roman and Courier New).
 * Carlito and Liberation are in the Debian packages fonts-crosextra-carlito and fonts-liberation2. Caladea is the one
 * LibreOffice installs with itself: the one in Debian's fonts-crosextra-caladea (20200211) has narrower letters and
 * shorter lines than Cambria. They are all in the image scripts/shape-demos/Dockerfile builds.
 *
 * Each width is checked against Word's, from its PDFs of scripts/layout-probes/word-character-widths.ts, which has every
 * character of the tables in each font, plain and bold, and word-italic-widths, which the same script writes with "italic",
 * in italic and bold italic. Where Word's width isn't the open font's, it is Word's.
 *
 * A character a font doesn't have, Word draws in another font, which depends on the character and the face, but not on
 * the run's language or East Asian font (scripts/layout-probes/stops2/word-stops-office-fonts.ts FB1), and the line
 * makes room for that font's ascent and descent (FB2). Where that font is a face of the tables and Word draws the
 * character as wide as the tables have it there, the tables say so, and it is measured as that face's; elsewhere, as in
 * Cambria Math or Segoe UI Symbol, its width isn't known, so the layout stops at it.
 *
 * Office's other fonts that Word for Mac installs, such as Calibri Light, Aptos, Georgia and Trebuchet MS ({@link
 * OFFICE_FONTS}): the widths and heights come from Word's own font files, which aren't open, so aren't in the image: those
 * in Word's folder of fonts, and Georgia, Impact and Trebuchet MS, which Word takes from the Mac's. Word's PDFs of
 * scripts/layout-probes/stops2/word-stops-font-widths.ts, which has every character of the tables in each of them, plain
 * and bold, and of word-stops-font-italic-widths, in italic and bold italic, show that Word draws each character the font
 * has as wide as its file has it, but for the spaces Word works out itself, which are Word's, as for the five above. A
 * face the font has no file for, Word makes itself: an italic slanted from the upright face, as wide as it, which the
 * tables write as none, so the upright face is measured; and a bold, each character {@link MADE_BOLD} thousandths of an
 * em further on than in the face it is made from, at 8 to 72 points (word-stops-office-fonts MB1), which the tables write
 * as the font's bold. Each font's line is as tall as its file's hhea table makes it, which Word's PDF of
 * word-stops-font-heights shows (FH1 to FH16), with Corbel's and Book Antiqua's, whose ascent and descent for Windows make
 * their lines taller.
 *
 * Usage, with the open fonts' directory first, then Word's widths, as JSON, of the five, and for Office's fonts the
 * directories Word's fonts are in, searched in order, Word's widths of them, its heights of their lines, and how far apart
 * Word draws the characters of all four PDFs, and in which font, as word-stops-more-widths.py reads them:
 *   npm run run-ts -- scripts/generate-font-widths.ts build/fonts build/word-probes/word-character-widths.word.json \
 *     build/word-probes/word-italic-widths.word.json "/Applications/Microsoft Word.app/Contents/Resources/DFonts" \
 *     /System/Library/Fonts/Supplemental build/word-probes/word-stops-font-widths.word.json \
 *     build/word-probes/word-stops-font-italic-widths.word.json build/word-probes/word-stops-font-heights.word.json \
 *     build/word-probes/word-character-widths.pitch.json build/word-probes/word-italic-widths.pitch.json \
 *     build/word-probes/word-stops-font-widths.pitch.json build/word-probes/word-stops-font-italic-widths.pitch.json
 *
 * To copy the open fonts out of the image:
 *   docker run --rm --platform linux/amd64 -v "$PWD/build/fonts:/out" docx-shape-renderer \
 *     sh -c 'cp /usr/share/fonts/truetype/crosextra/Carlito-*.ttf /usr/share/fonts/truetype/liberation/*.ttf /out/ &&
 *       cp "$(ls -d /opt/libreoffice*)"/share/fonts/truetype/Caladea-*.ttf /out/'
 *
 * To read Word's widths from its PDF, with Poppler (in the same image), and the same for word-italic-widths and the
 * PDFs of scripts/layout-probes/stops2:
 *   pdftotext -bbox-layout scripts/layout-probes/word-character-widths.pdf build/word-probes/word-character-widths.html
 *   pdftohtml -xml -i -q -zoom 1 scripts/layout-probes/word-character-widths.pdf build/word-probes/word-character-widths
 *   python3 scripts/layout-probes/word-character-widths.py build/word-probes/word-character-widths --json \
 *     > build/word-probes/word-character-widths.word.json
 *
 * And Word's heights of the lines:
 *   pdftotext -bbox-layout scripts/layout-probes/stops2/word-stops-font-heights.pdf build/word-probes/word-stops-font-heights.html
 *   python3 scripts/layout-probes/stops2/word-font-heights.py build/word-probes/word-stops-font-heights --json \
 *     > build/word-probes/word-stops-font-heights.word.json
 *
 * And how far apart Word draws the characters, from the PDF's own content, and the same for the other three PDFs:
 *   python3 scripts/layout-probes/stops2/word-stops-more-widths.py scripts/layout-probes/word-character-widths.pdf --json \
 *     > build/word-probes/word-character-widths.pitch.json
 */
// cspell:ignore Caladea crosextra Poppler bbox pdftohtml DFonts hhea Aptos PSMT
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readFontFile } from "../src/text-layout/font-file";
import { MADE_BOLD } from "../src/text-layout/kerning";

import { OFFICE_FONTS, type OfficeFont } from "./office-fonts";

const OUTPUT = "src/text-layout/font-widths.ts";

// The faces of a font, each in a file of its own
const FACES = ["regular", "bold", "italic", "boldItalic"] as const;
type Face = (typeof FACES)[number];
const SUFFIXES: Readonly<Record<Face, string>> = { regular: "Regular", bold: "Bold", italic: "Italic", boldItalic: "BoldItalic" };

// Each font Word documents use, and the font files with the same widths, such as Carlito-BoldItalic.ttf
const FONTS = [
    { name: "Calibri", file: "Carlito" },
    // Word's lines of Cambria are 2401 of its 2048 units, 257.92 twips at 11 points (scripts/layout-probes/word-line-heights.ts
    // Hb), which Caladea, of 1000 units, rounds to 1172
    { name: "Cambria", file: "Caladea", lineHeight: (2401 * 1000) / 2048 },
    { name: "Arial", file: "LiberationSans" },
    { name: "Times New Roman", file: "LiberationSerif" },
    { name: "Courier New", file: "LiberationMono" },
] as const;
type Font = (typeof FONTS)[number];
const fileOf = (font: Font, face: Face): string => join(directory, `${font.file}-${SUFFIXES[face]}.ttf`);

/** The name word-character-widths.py gives a font's face, such as "Calibri bold italic" */
const keyOf = (font: string, face: Face): string =>
    `${font}${face === "bold" || face === "boldItalic" ? " bold" : ""}${face === "italic" || face === "boldItalic" ? " italic" : ""}`;

/**
 * The characters the widths are for, as ranges of code points: printable ASCII; Latin-1, Latin Extended-A and B, IPA and
 * the spacing modifier letters; Greek and Cyrillic; Latin Extended Additional, which Vietnamese is written in; and general
 * punctuation, which has the spaces other than U+0020, superscripts and subscripts, currency symbols, letterlike symbols,
 * number forms, arrows and mathematical operators. The combining accents between the spacing modifier letters and Greek
 * take no room, and aren't in the tables.
 */
const RANGES = [
    [0x20, 0x7e],
    [0xa0, 0x2ff],
    [0x370, 0x4ff],
    [0x1e00, 0x1eff],
    [0x2000, 0x22ff],
] as const;
const CHARACTERS = RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, index) => first + index));

const HYPHEN = 0x2d;
const SOFT_HYPHEN = 0xad;
const NO_BREAK_HYPHEN = 0x2011;

// The open fonts' directory first, then the readings of Word's PDFs, as JSON, and the directories of Word's own fonts
const [directory, ...rest] = process.argv.slice(2);
const wordPaths = rest.filter((path) => path.endsWith(".json"));
const fontDirectories = rest.filter((path) => !path.endsWith(".json") && existsSync(path) && statSync(path).isDirectory());
if (!directory || wordPaths.length === 0 || fontDirectories.length === 0) {
    console.error(
        "Usage: npm run run-ts -- scripts/generate-font-widths.ts <directory with the open .ttf files> <directories of Word's fonts>... <Word's widths, as JSON>... <Word's heights, as JSON>",
    );
    process.exit(1);
}

// Word's widths of the characters, as word-character-widths.py --json reads them from one of Word's PDFs: each character's
// width and the font Word drew it in, and each space's width, by font and face, such as "Calibri bold", in thousandths of
// an em
type WordWidths = {
    readonly widths: Readonly<Record<string, Readonly<Record<string, { readonly width: number; readonly font: string | null }>>>>;
    readonly spaces: Readonly<Record<string, Readonly<Record<string, number>>>>;
};
// How far apart Word draws ten of each character, as word-stops-more-widths.py --json reads them from the content of one
// of Word's PDFs, in thousandths of an em, and the font it draws them in, as the PDF names it, such as Calibri-Bold, by
// font and face, with the ascent and descent of each of those fonts
type WordPitches = {
    readonly widths: Readonly<Record<string, Readonly<Record<string, { readonly width: number; readonly font: string }>>>>;
    readonly fonts: Readonly<Record<string, unknown>>;
};
// How far Word's width can be from the open font's and still be it. Word's PDF puts ten of a character in 10 points
// where they are to within about half a thousandth of an em each, and reads a little wider: offsetOf, below
const TOLERANCE = 1;

/** Whether Word drew a character in a face's own font, such as ArialMT or Arial-BoldMT for Arial, and not another */
const isOwnFont = (drawnIn: string | null, font: string): boolean => {
    const name = (drawnIn ?? "").toLowerCase().replace(/[^a-z]/g, "");
    return name.startsWith(font.toLowerCase().replace(/[^a-z]/g, "")) && !name.includes("math");
};

/**
 * Reads a font's height of a line, how far it goes below the baseline, and the width of each of its characters, as
 * docx/layout reads the font files it is given.
 */
const readFont = (
    path: string,
): { readonly lineHeight: number; readonly descent: number; readonly widthOf: (code: number) => number | undefined } => {
    const [face] = readFontFile(readFileSync(path));
    return {
        // Not rounded, as Word doesn't round it: Calibri's 2500 units of 2048 are 1220.703125 thousandths, and lines of
        // 268.55 twips at 11 points, where 1221 would be 268.62
        lineHeight: face.lineHeight * 1000,
        descent: face.descent * 1000,
        // In thousandths of an em, or undefined when the font doesn't have the character
        widthOf: (code) => {
            const advance = face.advanceOf(code);
            return advance === undefined ? undefined : Math.round(advance * 1000);
        },
    };
};

/** The path of one of Word's own font files, from the first of the directories it is in */
const officeFileOf = (file: string): string => {
    const found = fontDirectories.map((folder) => join(folder, file)).find(existsSync);
    if (found === undefined) {
        throw new Error(`${file} isn't in ${fontDirectories.join(", ") || "any directory of Word's fonts"}`);
    }
    return found;
};

/**
 * How tall a line of one of Word's own fonts is, and how far it goes below its baseline, in thousandths of an em: as its
 * hhea table makes them, its ascender and descender and the line gap above them, as Word's lines are on the Mac
 * (word-stops-font-heights FH1 to FH16): Corbel's 1207.5 and Book Antiqua's 1205.6, where their ascent and descent for
 * Windows would make them 1220.7 and 1242.7
 */
const hheaOf = (path: string): { readonly lineHeight: number; readonly descent: number; readonly lineGap: number } => {
    const data = readFileSync(path);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const tables = new Map(
        Array.from({ length: view.getUint16(4) }, (_, index) => {
            const at = 12 + index * 16;
            return [String.fromCharCode(...data.subarray(at, at + 4)), view.getUint32(at + 8)] as const;
        }),
    );
    const unitsPerEm = view.getUint16(tables.get("head")! + 18);
    const hhea = tables.get("hhea")!;
    const [ascender, descender, lineGap] = [4, 6, 8].map((offset) => view.getInt16(hhea + offset));
    return {
        lineHeight: ((ascender - descender + lineGap) * 1000) / unitsPerEm,
        descent: (-descender * 1000) / unitsPerEm,
        lineGap: (lineGap * 1000) / unitsPerEm,
    };
};

/**
 * How much wider one of Word's PDFs reads characters than they are: the middle of how much wider than the fonts' Word's
 * widths of the characters in the faces' own fonts are, about 0.4 thousandths of an em, as Word's PDF puts each character
 * a little further on than its width
 */
const offsetOf = (
    word: WordWidths,
    faces: readonly { readonly key: string; readonly font: string; readonly widthOf: (code: number) => number | undefined }[],
): number => {
    const differences = faces.flatMap(({ key, font, widthOf }) =>
        Object.entries(word.widths[key] ?? {}).flatMap(([hex, { width, font: drawnIn }]) => {
            const open = widthOf(parseInt(hex, 16));
            return open !== undefined && isOwnFont(drawnIn, font) ? [width - open] : [];
        }),
    );
    return [...differences].sort((one, other) => one - other)[Math.floor(differences.length / 2)];
};

// Each of Word's PDFs, read, with how much wider it reads characters than they are, from the faces of the fonts it has
const READINGS = wordPaths.map((path) => JSON.parse(readFileSync(path, "utf8")));
const WORD = READINGS.filter((reading): reading is WordWidths => reading.spaces !== undefined).map((word) => ({
    ...word,
    offset: offsetOf(
        word,
        [
            ...FONTS.flatMap((font) =>
                FACES.map((face) => ({ key: keyOf(font.name, face), font: font.name, face, file: fileOf(font, face) })),
            ),
            ...OFFICE_FONTS.flatMap((font) =>
                FACES.flatMap((face) =>
                    font.files[face] === undefined
                        ? []
                        : [{ key: keyOf(font.name, face), font: font.name, face, file: officeFileOf(font.files[face]) }],
                ),
            ),
        ]
            .filter(({ key }) => word.widths[key] !== undefined)
            .map(({ key, font, file }) => ({ key, font, widthOf: readFont(file).widthOf })),
    ),
}));
// Word's heights of the lines of Office's fonts, in thousandths of an em, by font and size
const HEIGHTS: Readonly<Record<string, Readonly<Record<string, number>>>> =
    READINGS.find((reading) => reading.heights !== undefined)?.heights ?? {};

// Each of Word's PDFs, read from its content
const PITCHES = READINGS.filter((reading): reading is WordPitches => reading.fonts !== undefined);

/** The reading of Word's PDF that has a face */
const wordOf = (key: string): (typeof WORD)[number] => {
    const word = WORD.find((reading) => reading.widths[key] !== undefined);
    if (word === undefined) {
        throw new Error(`None of Word's widths are of ${key}`);
    }
    return word;
};

/** How far apart Word draws ten of each character of a face, and in which font, read from its PDF's content */
const pitchesOf = (key: string): WordPitches["widths"][string] => {
    const pitches = PITCHES.find((reading) => reading.widths[key] !== undefined);
    if (pitches === undefined) {
        throw new Error(`None of Word's PDFs, read from their content, are of ${key}`);
    }
    return pitches.widths[key];
};

/**
 * The width of a character that takes no room, or that the layout measures as another: marks, which go on the character
 * before them, and formatting characters, such as the zero-width space, take no room, but for the soft hyphen, which Word
 * draws as a hyphen. A font without a soft hyphen, as Carlito has none, has it as wide as a hyphen, as Word draws it
 * (word-watertight-text TX10b: 67.4 twips for each U+00AD in Calibri 11), and the no-break hyphen is as wide as a hyphen,
 * as the layout reads `w:noBreakHyphen` as one, which Word draws as a hyphen whether the font has a no-break hyphen or not
 * (TX17: "state-of-the-art" 1388.3 twips with them and 1388.5 with hyphens). Undefined for the other characters.
 */
const specialWidthOf = (code: number, widthOf: (code: number) => number | undefined): number | undefined => {
    if (/[\p{Mn}\p{Me}\p{Cf}]/u.test(String.fromCodePoint(code)) && code !== SOFT_HYPHEN) {
        return 0;
    }
    if (code === SOFT_HYPHEN || code === NO_BREAK_HYPHEN) {
        return (code === SOFT_HYPHEN ? widthOf(code) : undefined) ?? widthOf(HYPHEN);
    }
    return undefined;
};

/**
 * The width of each character of a font's face, in thousandths of an em, or undefined where Word's width isn't known.
 * Each is the open font's, where Word's PDF shows it is Word's too, or else Word's own, and undefined where Word drew the
 * character in another font, which depends on the fonts where the document is opened, or where Word's PDF doesn't show
 * it. Characters that take no room, and the hyphens, are as {@link specialWidthOf} says.
 */
const widthsOf = (font: Font, face: Face): readonly (number | undefined)[] => {
    const { widthOf } = readFont(fileOf(font, face));
    const key = keyOf(font.name, face);
    const word = wordOf(key);
    /** The open font's width where it is Word's, or else Word's */
    const checked = (open: number | undefined, word: number): number =>
        open !== undefined && Math.abs(open - word) <= TOLERANCE ? open : Math.round(word);
    return CHARACTERS.map((code) => {
        const hex = code.toString(16).padStart(4, "0");
        const special = specialWidthOf(code, widthOf);
        if (special !== undefined) {
            return special;
        }
        // Spaces are read from the space between letters, so Word's PDF reads them as they are
        const space = word.spaces[key]?.[hex];
        if (space !== undefined) {
            return checked(widthOf(code), space);
        }
        const drawn = word.widths[key][hex];
        return drawn !== undefined && isOwnFont(drawn.font, font.name) ? checked(widthOf(code), drawn.width - word.offset) : undefined;
    });
};

// What Word's PDFs showed of Office's fonts that the tables don't follow, for the report printed at the end
const report: string[] = [];

/**
 * The width of each character of a face of one of Office's fonts, from Word's own file of it, in thousandths of an em,
 * or undefined where the font doesn't have the character, which Word draws in another font, or for a face the font has
 * no file for, which Word makes itself. Word's PDF of the face is checked: Word draws each character the file has in
 * the font, as wide as the file has it, to within its reading, but for some of the spaces, which Word works out itself,
 * as it does Calibri's em space, 905 thousandths of an em where its file has 1000, and are Word's. Characters that take
 * no room, and the hyphens, are as {@link specialWidthOf} says.
 */
const officeWidthsOf = (font: OfficeFont, face: Face): readonly (number | undefined)[] | undefined => {
    const file = font.files[face];
    if (file === undefined) {
        return undefined;
    }
    const { widthOf } = readFont(officeFileOf(file));
    const key = keyOf(font.name, face);
    const word = wordOf(key);
    const off: string[] = [];
    const elsewhere = new Map<string, number>();
    const widths = CHARACTERS.map((code) => {
        const hex = code.toString(16).padStart(4, "0");
        const special = specialWidthOf(code, widthOf);
        if (special !== undefined) {
            return special;
        }
        const own = widthOf(code);
        // A space the font doesn't have is as wide as Word draws it too, in whichever font, as spaces take no part in a
        // line's height (word-stops-more-widths)
        const space = word.spaces[key]?.[hex];
        if (space !== undefined) {
            return own !== undefined && Math.abs(own - space) <= TOLERANCE ? own : Math.round(space);
        }
        const drawn = word.widths[key][hex];
        if (own === undefined) {
            if (drawn?.font) {
                elsewhere.set(drawn.font, (elsewhere.get(drawn.font) ?? 0) + 1);
            }
            return undefined;
        }
        if (drawn !== undefined && !isOwnFont(drawn.font, font.name)) {
            throw new Error(`Word drew ${hex} in ${drawn.font}, where ${font.name}'s file has it`);
        }
        if (drawn !== undefined && Math.abs(drawn.width - word.offset - own) > TOLERANCE) {
            off.push(`${hex} ${(drawn.width - word.offset - own).toFixed(1)}`);
        }
        return own;
    });
    report.push(
        `${key}: ${widths.filter((width) => width !== undefined).length} characters; Word's PDF reads ${off.length} of them otherwise` +
            `${off.length > 0 ? ` (${off.join(", ")})` : ""}; the rest Word draws in ${[...elsewhere]
                .sort(([, one], [, other]) => other - one)
                .map(([name, count]) => `${name} ${count}`)
                .join(", ")}`,
    );
    return widths;
};

/**
 * Checks Word's PDF of a face of one of Office's fonts that it makes itself: an italic is as wide as the upright face,
 * and a bold, each character {@link MADE_BOLD} thousandths of an em further on than in the face it is made from, but for
 * the spaces, which are as wide as they are. The PDF's reading of ten of a character in a row reads that as 18 wider, as
 * the ten are nine of them further on and one as wide as the face it is made from (word-stops-office-fonts MB1 reads the
 * distance between them)
 */
const checkMadeFace = (font: OfficeFont, face: Face): void => {
    const bold = face === "bold" || face === "boldItalic";
    const italic = face === "italic" || face === "boldItalic";
    // Word makes a bold for a font without one from its regular face, or its italic for bold italic, and an italic from
    // the upright face as bold as it
    const madeBold = bold && font.files.bold === undefined;
    const from: Face = madeBold ? (italic && font.files.italic !== undefined ? "italic" : "regular") : bold ? "bold" : "regular";
    const { widthOf } = readFont(officeFileOf(font.files[from]!));
    const key = keyOf(font.name, face);
    const word = wordOf(key);
    const differences = Object.entries(word.widths[key])
        .filter(([hex, { font: drawnIn }]) => isOwnFont(drawnIn, font.name) && widthOf(parseInt(hex, 16)) !== undefined)
        .map(([hex, { width }]) => width - word.offset - widthOf(parseInt(hex, 16))!)
        .sort((one, other) => one - other);
    const middle = differences[Math.floor(differences.length / 2)];
    const expected = madeBold ? (MADE_BOLD * 9) / 10 : 0;
    if (Math.abs(middle - expected) > TOLERANCE) {
        throw new Error(`Word's ${key} is ${middle.toFixed(2)} wider than ${font.name} ${from}, not ${expected}`);
    }
    report.push(
        `${key}: made by Word from ${from}, read ${middle.toFixed(2)} thousandths of an em wider in the middle of ${differences.length} characters`,
    );
};

/**
 * The widths of a bold Word makes itself, for a font without a bold face, from those of the face it makes it from: each
 * character {@link MADE_BOLD} thousandths of an em wider, but for those that take no room, and the spaces, which are
 * Word's, as its PDF reads them from the space between letters: as wide as they were, but for Calibri Light's en and em
 * spaces, which are 20 wider, and its three-, four- and six-per-em spaces, about a third, a quarter and a sixth of that
 * wider (word-stops-font-widths S). Each is checked against how far apart Word's PDF draws ten of it
 */
const madeBoldWidthsOf = (font: OfficeFont, face: Face, from: readonly (number | undefined)[]): readonly (number | undefined)[] => {
    const key = keyOf(font.name, face);
    const word = wordOf(key);
    const pitches = pitchesOf(key);
    const off: string[] = [];
    const widths = CHARACTERS.map((code, index) => {
        const hex = code.toString(16).padStart(4, "0");
        const width = from[index];
        if (width === undefined || width === 0) {
            return width;
        }
        const space = word.spaces[key]?.[hex];
        if (space !== undefined) {
            return [width, width + MADE_BOLD].find((made) => Math.abs(made - space) <= TOLERANCE) ?? Math.round(space);
        }
        const pitch = pitches[hex];
        if (pitch !== undefined && isOwnFont(pitch.font, font.name) && Math.abs(pitch.width - width - MADE_BOLD) > TOLERANCE) {
            off.push(`${hex} ${(pitch.width - width - MADE_BOLD).toFixed(1)}`);
        }
        return width + MADE_BOLD;
    });
    report.push(
        `${key}: made by Word, ${MADE_BOLD} wider; Word's PDF draws ${off.length} of its characters other distances apart` +
            `${off.length > 0 ? ` (${off.join(", ")})` : ""}`,
    );
    return widths;
};

/** A font of the tables: how tall its lines are, and the widths of its faces, before the fallbacks are found */
type TableFont = {
    readonly name: string;
    readonly lineHeight: number;
    readonly descent: number;
    /** The line gap of its hhea table, in thousandths of an em, which is part of its line above the baseline */
    readonly lineGap: number;
    readonly faces: Readonly<Partial<Record<Face, readonly (number | undefined)[]>>>;
};

// The faces' lines are as tall as each other: the open fonts' faces have the same heights
const TABLE_FONTS: readonly TableFont[] = [
    ...FONTS.map((font) => ({
        name: font.name,
        lineHeight: "lineHeight" in font ? font.lineHeight : readFont(fileOf(font, "regular")).lineHeight,
        descent: readFont(fileOf(font, "regular")).descent,
        lineGap: hheaOf(fileOf(font, "regular")).lineGap,
        faces: Object.fromEntries(FACES.map((face) => [face, widthsOf(font, face)])),
    })),
    // Office's fonts, whose faces' files have the same hhea tables, so their lines are as tall as each other's too
    ...OFFICE_FONTS.map((font) => {
        const heights = FACES.flatMap((face) => (font.files[face] === undefined ? [] : [hheaOf(officeFileOf(font.files[face]))]));
        const [{ lineHeight, descent, lineGap }] = heights;
        if (heights.some((height) => height.lineHeight !== lineHeight || height.descent !== descent)) {
            throw new Error(`${font.name}'s faces' lines aren't as tall as each other`);
        }
        for (const [size, height] of Object.entries(HEIGHTS[font.name] ?? {})) {
            if (Math.abs(height - lineHeight) > TOLERANCE) {
                throw new Error(`Word's lines of ${font.name} ${size} are ${height}, not ${lineHeight}`);
            }
        }
        if (HEIGHTS[font.name] === undefined) {
            throw new Error(`Word's heights don't have ${font.name}`);
        }
        const faces: Partial<Record<Face, readonly (number | undefined)[]>> = {};
        for (const face of FACES) {
            const widths = officeWidthsOf(font, face);
            if (widths !== undefined) {
                faces[face] = widths;
                continue;
            }
            checkMadeFace(font, face);
            // A bold Word makes itself, from the regular face, and for bold italic from the italic face, when the font has
            // one: Word draws the bold italic of a font without one as its bold, slanted, as wide as it
            if (font.files.bold === undefined && (face === "bold" || (face === "boldItalic" && faces.italic !== undefined))) {
                faces[face] = madeBoldWidthsOf(font, face, face === "bold" ? faces.regular! : faces.italic!);
            }
        }
        return { name: font.name, lineHeight, descent, lineGap, faces };
    }),
];

// The faces of the tables Word draws characters other fonts don't have in, by the name Word's PDFs give each
const FALLBACK_NAMES: Readonly<Record<string, readonly [font: string, face: Face]>> = {
    Calibri: ["Calibri", "regular"],
    "Calibri-Bold": ["Calibri", "bold"],
    "Calibri-Italic": ["Calibri", "italic"],
    "Calibri-BoldItalic": ["Calibri", "boldItalic"],
    Cambria: ["Cambria", "regular"],
    "Cambria-Bold": ["Cambria", "bold"],
    "Cambria-Italic": ["Cambria", "italic"],
    "Cambria-BoldItalic": ["Cambria", "boldItalic"],
    ArialMT: ["Arial", "regular"],
    "Arial-BoldMT": ["Arial", "bold"],
    "Arial-ItalicMT": ["Arial", "italic"],
    "Arial-BoldItalicMT": ["Arial", "boldItalic"],
    TimesNewRomanPSMT: ["Times New Roman", "regular"],
    "TimesNewRomanPS-BoldMT": ["Times New Roman", "bold"],
    "TimesNewRomanPS-ItalicMT": ["Times New Roman", "italic"],
    "TimesNewRomanPS-BoldItalicMT": ["Times New Roman", "boldItalic"],
    Tahoma: ["Tahoma", "regular"],
    "Tahoma-Bold": ["Tahoma", "bold"],
};
const tableFontOf = (name: string): TableFont => TABLE_FONTS.find((font) => font.name === name)!;

// The faces Word draws characters in that their fonts don't have, as the tables write them, in the order they are found
const FALLBACK_FACES: (readonly [font: string, face: Face])[] = [];

/**
 * The face of the tables Word draws each character of a face in that the face doesn't have, by its index in {@link
 * FALLBACK_FACES}: where Word's PDF draws it in a face of the tables as wide as the tables have it there, and that face
 * can't make the line taller in a way not yet known. Word makes room in a line for the ascent and descent of the font
 * it draws a character in (word-stops-office-fonts FB2: Calibri's and Cambria Math's), but whether that takes in the line
 * gap of a font with one, as Arial's and Times New Roman's hhea tables have, isn't known, so a character in one of those
 * is only where its line gap can't make the line taller than the face's own, or where it is a space, which takes no part
 */
const fallbacksOf = (font: TableFont, face: Face): readonly (number | undefined)[] => {
    const key = keyOf(font.name, face);
    const pitches = pitchesOf(key);
    const widths = font.faces[face]!;
    const known = new Map<string, number>();
    const unknown = new Map<string, number>();
    const fallbacks = CHARACTERS.map((code, index) => {
        const pitch = pitches[code.toString(16).padStart(4, "0")];
        if (widths[index] !== undefined || pitch === undefined) {
            return undefined;
        }
        const name = FALLBACK_NAMES[pitch.font];
        const other = name === undefined ? undefined : tableFontOf(name[0]);
        const width = other?.faces[name![1]]?.[index];
        const ascent = font.lineHeight - font.descent;
        // Spaces take no part in a line's height (word-stops-more-widths)
        if (
            width === undefined ||
            Math.abs(pitch.width - width) > TOLERANCE ||
            (other!.lineGap > 0 && other!.lineHeight - other!.descent > ascent && !/\s/u.test(String.fromCodePoint(code)))
        ) {
            unknown.set(pitch.font, (unknown.get(pitch.font) ?? 0) + 1);
            return undefined;
        }
        known.set(pitch.font, (known.get(pitch.font) ?? 0) + 1);
        const found = FALLBACK_FACES.findIndex(([fallback, fallbackFace]) => fallback === name![0] && fallbackFace === name![1]);
        if (found >= 0) {
            return found;
        }
        FALLBACK_FACES.push(name!);
        return FALLBACK_FACES.length - 1;
    });
    const counts = (found: ReadonlyMap<string, number>): string =>
        [...found]
            .sort(([, one], [, other]) => other - one)
            .map(([name, count]) => `${name} ${count}`)
            .join(", ") || "none";
    report.push(`${key}: drawn in another face of the tables: ${counts(known)}; in another font, not known: ${counts(unknown)}`);
    return fallbacks;
};

// The digits of the widths, two to a width, from 0 to 4095 thousandths of an em
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
const CHARACTER_INDEX = new Map(CHARACTERS.map((code, index) => [code, index]));

/**
 * Writes the widths of a font's face as a string, which text-width.ts reads: each width is two of {@link DIGITS}; "=" is
 * a width that is the same as the letter's the character is made from, such as "a" for "ą", which comes before it; "~"
 * and a digit is a character the face doesn't have, which Word draws in the face of {@link FALLBACK_FACES} of that index;
 * "!" is a character whose width isn't known; and "*" with two digits repeats what is before it that many more times.
 */
const encode = (widths: readonly (number | undefined)[], fallbacks: readonly (number | undefined)[]): string => {
    const tokens = widths.map((width, index) => {
        if (fallbacks[index] !== undefined) {
            return `~${DIGITS[fallbacks[index]]}`;
        }
        if (width === undefined) {
            return "!";
        }
        if (width > 4095) {
            throw new Error(`A width of ${width} is more than two digits can write`);
        }
        const base = CHARACTER_INDEX.get(String.fromCodePoint(CHARACTERS[index]).normalize("NFD").codePointAt(0)!);
        // As wide as the letter it is made from, unless the character before is as wide too, so the width repeats
        return base !== undefined && base < index && widths[base] === width && widths[index - 1] !== width
            ? "="
            : `${DIGITS[Math.floor(width / 64)]}${DIGITS[width % 64]}`;
    });
    let encoded = "";
    for (let index = 0; index < tokens.length;) {
        let end = index + 1;
        while (end < tokens.length && tokens[end] === tokens[index] && end - index <= 4095) {
            end++;
        }
        const repeats = end - index - 1;
        encoded +=
            repeats > 1 ? `${tokens[index]}*${DIGITS[Math.floor(repeats / 64)]}${DIGITS[repeats % 64]}` : tokens[index].repeat(repeats + 1);
        index = end;
    }
    return encoded;
};

const entries = TABLE_FONTS.map((font) => {
    if (font.faces.bold === undefined) {
        throw new Error(`${font.name} has no bold, its own or one Word makes`);
    }
    return `    {
        name: "${font.name}",
        lineHeight: ${font.lineHeight},
        descent: ${font.descent},
${FACES.flatMap((face) => (font.faces[face] === undefined ? [] : [`        ${face}: "${encode(font.faces[face], fallbacksOf(font, face))}",`])).join("\n")}
    },`;
});

writeFileSync(
    OUTPUT,
    `/**
 * How wide each character is in the fonts Word documents use most, and in Office's other fonts that Word installs, and how
 * tall a line of text is.
 *
 * Generated by scripts/generate-font-widths.ts from fonts with an open license that have the same widths:
 * Carlito (Calibri), Caladea (Cambria), and Liberation Sans, Serif and Mono (Arial, Times New Roman and Courier New),
 * plain, bold, italic and bold italic, checked against Word's: Word's own widths where its PDFs show they differ; and from
 * Word's own files of Office's other fonts, checked against Word's PDFs of every character of them, and of how tall their
 * lines are. A character a font doesn't have is as wide as the face of the tables Word draws it in, where it is one. Do not
 * edit by hand.
 *
 * @module
 */
// cspell:ignore Caladea

/**
 * The widths of a font's characters.
 */
export type FontWidths = {
    /** The font's name */
    readonly name: string;
    /** Height of a line of single-spaced text, in thousandths of an em, unrounded */
    readonly lineHeight: number;
    /**
     * How far a line of single-spaced text goes below its baseline, in thousandths of an em, unrounded. The rest of the
     * line is above it, with the font's line gap at the top
     */
    readonly descent: number;
    /**
     * The width of each character of {@link FONT_WIDTH_RANGES}, in thousandths of an em, written in a string: each width
     * is two digits of the 64 of \`0-9a-zA-Z+/\`, the first of 64ths; "=" is a width that is the same as that of the letter
     * the character is made from, by its decomposition, such as "a" for "ą"; "~" and a digit is a character the face
     * doesn't have, which Word draws in the face of {@link FALLBACK_FACES} the digit is the index of, as wide as it is
     * there; "!" is a character whose width in Word isn't known; and "*" with two digits repeats what is before it that
     * many more times
     */
    readonly regular: string;
    /**
     * The same for bold text: the font's bold face, or for a font without one, such as Calibri Light, the bold Word makes
     * itself, each character 20 thousandths of an em wider than in the regular face, but for the spaces, as Word works
     * them out
     */
    readonly bold: string;
    /**
     * The same for italic text, or none for a font without an italic face, such as Tahoma, whose italic Word slants from
     * the upright face, as wide as it
     */
    readonly italic?: string;
    /**
     * The same for bold italic text: the font's own, or the bold Word makes of its italic face, or none for a font
     * without either, whose bold italic is as wide as its bold
     */
    readonly boldItalic?: string;
};

/**
 * The characters the widths are for, as ranges of code points: printable ASCII; Latin-1, Latin Extended-A and B, IPA and
 * the spacing modifier letters; Greek and Cyrillic; Latin Extended Additional, for Vietnamese; and general punctuation,
 * superscripts and subscripts, currency symbols, letterlike symbols, number forms, arrows and mathematical operators.
 */
export const FONT_WIDTH_RANGES: readonly (readonly [number, number])[] = [
${RANGES.map(([first, last]) => `    [0x${first.toString(16)}, 0x${last.toString(16)}],`).join("\n")}
];

/**
 * The faces of the tables Word draws characters in that other fonts don't have, such as Calibri for Gill Sans MT's
 * Cyrillic: the font, and whether the face is bold and italic.
 */
export const FALLBACK_FACES: readonly { readonly font: string; readonly bold: boolean; readonly italic: boolean }[] = [
${FALLBACK_FACES.map(([font, face]) => `    { font: "${font}", bold: ${face === "bold" || face === "boldItalic"}, italic: ${face === "italic" || face === "boldItalic"} },`).join("\n")}
];

/* cspell:disable */
export const FONT_WIDTHS: readonly FontWidths[] = [
${entries.join("\n")}
];
/* cspell:enable */
`,
);
execSync(`npx prettier --write ${OUTPUT}`);
console.log(report.join("\n"));
