/**
 * Generates src/text-layout/font-kerning.ts: how Word kerns the characters of the fonts of the width tables, and which
 * letters it joins into ligatures, how wide they are and how they are kerned, from Word's PDF of
 * scripts/layout-probes/word-kerning.ts, as word-kerning.py reads it.
 *
 * The pairs are those of the characters of Windows-1252, and of printable ASCII in Courier New. Word's PDF gives each
 * pair's kerning to within about a thousandth of an em, but where Word moves a character a little of its own accord, as
 * it does a hyphen, en dash, no-break space, ™ and backslash, and an à in kerned text, the pair before it can be up to
 * 25 thousandths off, whether it is kerned or not. So:
 *
 * - Calibri, Arial, Times New Roman and Courier New are kerned as the open fonts as wide as them are, Carlito and
 *   Liberation Sans, Serif and Mono, which Word's PDF shows they are for all but a few pairs: those of a character Word's
 *   own font kerns otherwise, such as Calibri's ƒ, Calibri Bold's apostrophe and Calibri Italic's æ, which are Word's.
 *   A pair is Word's where Word's PDF has it more than 5.5 thousandths off the open font's and either at least 5 of its
 *   first or second character's pairs are too, or at least 2 other characters kerned as its first is by the open font
 *   are off by as much with its second. A no-break space is kerned as the space where Word's PDF kerns it so.
 * - Cambria, whose open font, Caladea, kerns a tenth of the pairs Cambria does, is kerned as Word's PDF has it: the
 *   characters it kerns the same before each other character, to within 1.5 thousandths, are a class, as are those it
 *   kerns the same after each, and each pair is the middle of its class's. So a pair the PDF doesn't show is its
 *   class's. The pairs before a character Word moves aren't known, which a layout stops at.
 *
 * A ligature is a rule of the setting Word's PDF showed it in, and a glyph as wide as Word drew it and kerned with the
 * glyphs beside it as the open font kerns the same glyph, where it has it, as Carlito has Calibri's, or as Word kerned
 * them, from LK, where it read them. A glyph Word put in place of letters that is as
 * wide as they are and kerned as they are, as Cambria's f before some letters is, changes nothing, and isn't a rule.
 *
 * Office's other fonts that Word for Mac installs (scripts/office-fonts.ts), from Word's PDFs of
 * scripts/layout-probes/stops2/word-stops-font-kerning.ts, which has the same pairs and words in each of their faces, are
 * kerned as Word's own files of them are, as the four above are kerned as the open fonts, which Word's PDF shows they are
 * for all but a few pairs. The glyphs their ligatures make are as wide as the files have them, and kerned as the files
 * kern them. A face a font has no file for, which Word makes itself, has none: an italic is kerned as the upright face,
 * as Word draws Trebuchet MS bold italic as its bold, slanted, and kerns it as the bold (K18).
 *
 * Usage, with Poppler, and the open fonts copied out of the image scripts/shape-demos/Dockerfile builds, as
 * scripts/generate-font-widths.ts says, then the directories Word's own fonts are in, searched in order:
 *   pdftocairo -svg scripts/layout-probes/word-kerning.pdf build/word-probes/word-kerning.svg
 *   pdftotext -bbox-layout scripts/layout-probes/word-kerning.pdf build/word-probes/word-kerning.html
 *   python3 scripts/layout-probes/word-kerning.py build/word-probes/word-kerning --json > build/word-probes/word-kerning.word.json
 * and the same for scripts/layout-probes/stops2/word-stops-font-kerning.pdf and word-stops-font-kerning2.pdf, then
 *   npm run run-ts -- scripts/generate-font-kerning.ts build/word-probes/word-kerning.word.json build/fonts \
 *     "/Applications/Microsoft Word.app/Contents/Resources/DFonts" /System/Library/Fonts/Supplemental \
 *     build/word-probes/word-stops-font-kerning.word.json build/word-probes/word-stops-font-kerning2.word.json
 *
 * Each reading's probe's lines, which word-kerning.py wrote beside it, are read from the .json of the probe's name in
 * scripts/layout-probes, or in scripts/layout-probes/stops2.
 */
// cspell:ignore Caladea Carlito bbox pdftocairo Poppler DFonts DFLT
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { readFontFile } from "../src/text-layout/font-file";
import { type Glyph, WINDOWS_1252, indexRules, joinLetters } from "../src/text-layout/kerning";

import { OFFICE_FONTS } from "./office-fonts";

const OUTPUT = "src/text-layout/font-kerning.ts";

/** What word-kerning.py reads, with --json */
type Reading = {
    /** Each face's glyphs' widths, by name: a character, or the characters a ligature covers in angle brackets */
    readonly advances: Readonly<Record<string, Readonly<Record<string, number>>>>;
    /** Each face's pairs of characters read, and their kerning */
    readonly kerning: Readonly<Record<string, Readonly<Record<string, number>>>>;
    /** The glyphs of each word of L, by face and setting, that has any glyph other than a character's */
    readonly joined: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>;
    /** The words of L read, by face and setting */
    readonly words: Readonly<Record<string, readonly string[]>>;
    /** The kerning beside ligatures, by face and setting: "left|right" */
    readonly beside: Readonly<Record<string, Readonly<Record<string, number>>>>;
};
type Line = readonly [probe: string, face: string, kerned: boolean, ligatures: string, text: string];
type Rule = readonly [letters: string, units: readonly (number | string)[], next?: string];

// The readings of Word's PDFs, as JSON, and the directories of fonts: the open fonts', then Word's own
const argumentsGiven = process.argv.slice(2);
const readingPaths = argumentsGiven.filter((path) => path.endsWith(".json"));
const [fontDirectory, ...officeDirectories] = argumentsGiven.filter(
    (path) => !path.endsWith(".json") && existsSync(path) && statSync(path).isDirectory(),
);
if (readingPaths.length === 0 || !fontDirectory || officeDirectories.length === 0) {
    console.error(
        "Usage: npm run run-ts -- scripts/generate-font-kerning.ts <word-kerning.py --json's outputs>... <directory with the open fonts> <directories of Word's fonts>...",
    );
    process.exit(1);
}
/** The probe's lines a reading is of, from the .json of its name, such as word-kerning.json for word-kerning.word.json */
const linesOf = (path: string): readonly Line[] => {
    const name = `${basename(path).replace(/\.word\.json$/, "")}.json`;
    const sidecar = ["scripts/layout-probes", "scripts/layout-probes/stops2"].map((folder) => join(folder, name)).find(existsSync);
    if (sidecar === undefined) {
        throw new Error(`No probe's lines for ${path}: ${name} isn't in scripts/layout-probes or its stops2`);
    }
    return (JSON.parse(readFileSync(sidecar, "utf8")) as { readonly lines: readonly Line[] }).lines;
};
const READINGS = readingPaths.map((path) => ({ reading: JSON.parse(readFileSync(path, "utf8")) as Reading, lines: linesOf(path) }));
/** The reading of a face, and its probe's lines */
const readingOf = (face: string): (typeof READINGS)[number] => {
    const found = READINGS.find(({ reading }) => reading.kerning[face] !== undefined);
    if (found === undefined) {
        throw new Error(`None of Word's PDFs read have ${face}`);
    }
    return found;
};
/** The path of one of Word's own font files, from the first of the directories it is in */
const officeFileOf = (file: string): string => {
    const found = officeDirectories.map((folder) => join(folder, file)).find(existsSync);
    if (found === undefined) {
        throw new Error(`${file} isn't in ${officeDirectories.join(", ")}`);
    }
    return found;
};

const FACES = [
    ["regular", "", "Regular"],
    ["bold", " bold", "Bold"],
    ["italic", " italic", "Italic"],
    ["boldItalic", " bold italic", "BoldItalic"],
] as const;
type FaceKey = (typeof FACES)[number][0];
// Each font, and the file of each face whose kerning Word's is but for a few pairs: the open font as wide as it, or
// Word's own file, or none for Cambria, whose open font kerns too few. A face of one of Office's fonts with no file is one
// Word makes itself, which has no kerning of its own
const FONTS: readonly { readonly name: string; readonly files?: Readonly<Partial<Record<FaceKey, string>>>; readonly own?: boolean }[] = [
    ...[
        { name: "Calibri", open: "Carlito" },
        { name: "Cambria" },
        { name: "Arial", open: "LiberationSans" },
        { name: "Times New Roman", open: "LiberationSerif" },
        { name: "Courier New", open: "LiberationMono" },
    ].map(({ name, open }) => ({
        name,
        ...(open === undefined
            ? {}
            : { files: Object.fromEntries(FACES.map(([key, , suffix]) => [key, join(fontDirectory, `${open}-${suffix}.ttf`)])) }),
    })),
    ...OFFICE_FONTS.map(({ name, files }) => ({
        name,
        files: Object.fromEntries(Object.entries(files).map(([key, file]) => [key, officeFileOf(file)])),
        own: true,
    })),
];
const ASCII = Array.from({ length: 0x7f - 0x20 }, (_, index) => String.fromCodePoint(0x20 + index)).join("");
const NO_BREAK_SPACE = " ";
// The characters Word moves a little of its own accord, so the pairs before them aren't read
const MOVED = new Set(["-", "–", NO_BREAK_SPACE, "™", "\\", "à"]);
// In Office's other fonts, Word moves ý too: the pairs before it are as scattered as those before à, by up to 16
// thousandths of an em either way, in faces whose files kern nothing with it, such as Impact's and Georgia's
const MOVED_IN_OFFICE_FONTS = new Set([...MOVED, "ý"]);

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
const twoDigits = (value: number): string => {
    if (!Number.isInteger(value) || value < 0 || value >= 4096) {
        throw new Error(`${value} doesn't fit in two digits`);
    }
    return DIGITS[Math.floor(value / 64)] + DIGITS[value % 64];
};
// The kerning a pair of classes is written with when it isn't known
const UNKNOWN = 4095;

const isGlyph = (name: string): boolean => name.startsWith("⟨");
const lettersOf = (name: string): string => (isGlyph(name) ? name.slice(1, name.indexOf("⟩")) : name);

/** The words of L of a face and setting, each after a space */
const wordsOf = (face: string, setting: string): readonly string[] => [
    ...new Set(
        readingOf(face)
            .lines.filter(([probe, other, , ligatures]) => /^L\d/.test(probe) && other === face && ligatures === setting)
            .flatMap(([, , , , text]) => text.split(" ").filter((word) => word.length > 0)),
    ),
];

/**
 * The kerning of each pair of characters, in thousandths of an em, or NaN where it isn't known, by "first|second".
 */
const kerningOfCharacters = (
    face: string,
    characters: readonly string[],
    open?: string,
    moved: ReadonlySet<string> = MOVED,
): Map<string, number> => {
    const measured = readingOf(face).reading.kerning[face];
    const read = (left: string, right: string): number => measured[left + right] ?? Number.NaN;
    const kerning = new Map<string, number>();
    if (open === undefined) {
        // Cambria: the rows of characters Word's PDF kerns the same, to within its noise, are one class, as are the
        // columns, and each pair is the middle of its class's pairs
        const steady = characters.filter((right) => !MOVED.has(right));
        const grid = characters.map((left) => steady.map((right) => read(left, right)));
        const clustered = (rows: readonly (readonly number[])[]): readonly (readonly number[])[] => {
            const groups: { readonly members: number[]; readonly first: readonly number[] }[] = [];
            rows.forEach((row, index) => {
                const group = groups.find(({ first }) =>
                    row.every((value, at) => Number.isNaN(value) || Number.isNaN(first[at]) || Math.abs(value - first[at]) <= 1.5),
                );
                if (group) {
                    group.members.push(index);
                } else {
                    groups.push({ members: [index], first: row });
                }
            });
            const middle = (values: readonly number[]): number => {
                const known = values.filter((value) => !Number.isNaN(value)).sort((one, other) => one - other);
                return known.length === 0 ? Number.NaN : known[Math.floor(known.length / 2)];
            };
            // A pair Word's PDF doesn't show stays unknown, as it may be the one its character kerns otherwise
            const byIndex = new Map(
                groups.flatMap(({ members }) => {
                    const values = rows[0].map((_, at) => middle(members.map((member) => rows[member][at])));
                    return members.map(
                        (member) => [member, values.map((value, at) => (Number.isNaN(rows[member][at]) ? Number.NaN : value))] as const,
                    );
                }),
            );
            return rows.map((_, index) => byIndex.get(index)!);
        };
        const transpose = (rows: readonly (readonly number[])[]): readonly (readonly number[])[] =>
            rows[0].map((_, at) => rows.map((row) => row[at]));
        const cleaned = transpose(clustered(transpose(clustered(grid))));
        characters.forEach((left, index) =>
            characters.forEach((right) => {
                const at = steady.indexOf(right);
                const value = at < 0 ? Number.NaN : cleaned[index][at];
                kerning.set(`${left}|${right}`, Number.isNaN(value) ? Number.NaN : Math.round(value));
            }),
        );
        return kerning;
    }
    const [font] = readFontFile(readFileSync(open));
    const prior = (left: string, right: string): number => {
        const [first, second] = [left, right].map((character) => character.codePointAt(0)!);
        return font.advanceOf(first) === undefined || font.advanceOf(second) === undefined ? 0 : font.kerningOf(first, second) * 1000;
    };
    // A no-break space is kerned as the space where Word kerns it with what is after it as it does the space
    const steadyColumns = characters.filter((right) => !moved.has(right));
    const spaceLike =
        characters.includes(NO_BREAK_SPACE) &&
        steadyColumns.filter((right) => Math.abs(read(NO_BREAK_SPACE, right) - read(" ", right)) <= 2.5).length >=
            steadyColumns.length * 0.95;
    const asSpace = (character: string): string => (spaceLike && character === NO_BREAK_SPACE ? " " : character);
    const openOf = (left: string, right: string): number => prior(asSpace(left), asSpace(right));
    const offBy = (left: string, right: string): number => read(left, right) - openOf(left, right);
    const off = (left: string, right: string): boolean => !moved.has(right) && Math.abs(offBy(left, right)) > 5.5;
    const rowKey = new Map(characters.map((left) => [left, characters.map((right) => Math.round(openOf(left, right))).join(",")]));
    // A row Word kerns otherwise has at least 5 pairs off, as Word's font kerns classes of characters, where Word's
    // drawing is off here and there
    const ownRows = new Set(characters.filter((left) => characters.filter((right) => off(left, right)).length >= 5));
    const ownColumns = new Set(characters.filter((right) => characters.filter((left) => off(left, right)).length >= 5));
    for (const left of characters) {
        for (const right of characters) {
            const value = read(left, right);
            const own =
                !Number.isNaN(value) &&
                !moved.has(right) &&
                (((ownRows.has(left) || ownColumns.has(right)) && Math.abs(offBy(left, right)) > 1.5) ||
                    (off(left, right) &&
                        characters.filter(
                            (other) =>
                                other !== left &&
                                rowKey.get(other) === rowKey.get(left) &&
                                Math.abs(offBy(other, right) - offBy(left, right)) <= 2,
                        ).length >= 2));
            kerning.set(`${left}|${right}`, Math.round(own ? value : openOf(left, right)));
        }
    }
    return kerning;
};

/**
 * The rules that join a setting's letters, from the words Word joined: a word of two characters drawn as one glyph is a
 * rule that joins them; one whose first character is drawn as another glyph before the second is a rule for that
 * character before the second, which the second can start a rule of its own after; and a longer word the shorter rules
 * don't draw as Word drew it is a rule of its own. Each rule is checked against every word.
 */
const rulesOf = (
    words: readonly string[],
    joined: Readonly<Record<string, readonly string[]>>,
    glyphIndex: (name: string) => number,
    glyphs: readonly (readonly [string, number, number, number])[],
): readonly Rule[] => {
    const outcome = (word: string): readonly string[] => joined[word] ?? [...word];
    const unitsOf = (names: readonly string[]): readonly (number | string)[] =>
        names.map((name) => (isGlyph(name) ? glyphIndex(name) : name));
    const drawn = (glyphsOf: readonly Glyph[], word: string): boolean => {
        const expected = outcome(word);
        return (
            glyphsOf.length === expected.length &&
            glyphsOf.every((glyph, index) =>
                isGlyph(expected[index]) ? glyph.glyph === glyphIndex(expected[index]) : glyph.text === expected[index],
            )
        );
    };
    const rules: Rule[] = [];
    for (const word of words.filter((each) => [...each].length === 2)) {
        const names = outcome(word);
        const [first, second] = [...word];
        if (names.every((name) => !isGlyph(name))) {
            continue;
        }
        if (names.length === 2 && isGlyph(names[0]) && lettersOf(names[0]) === first && names[1] === second) {
            rules.push([first, unitsOf([names[0]]), second]);
        } else {
            rules.push([word, unitsOf(names)]);
        }
    }
    for (const word of words.filter((each) => [...each].length > 2)) {
        if (!drawn(joinLetters([...word], indexRules(rules), glyphs), word)) {
            rules.push([word, unitsOf(outcome(word))]);
        }
    }
    const wrong = words.filter((word) => !drawn(joinLetters([...word], indexRules(rules), glyphs), word));
    if (wrong.length > 0) {
        throw new Error(`The rules don't draw ${wrong.length} words as Word did: ${wrong.slice(0, 10).join(" ")}`);
    }
    return rules;
};

/** Groups items by a key, giving each the index of its group, with the group of `zero` first */
const classesBy = <T>(items: readonly T[], keyOf: (item: T) => string, zero: string): ReadonlyMap<T, number> => {
    const keys = new Map<string, number>([[zero, 0]]);
    return new Map(
        items.map((item) => {
            const key = keyOf(item);
            if (!keys.has(key)) {
                keys.set(key, keys.size);
            }
            return [item, keys.get(key)!];
        }),
    );
};

/**
 * Whether a font file's GPOS table kerns Latin text: whether the features of its Latin script, or its default one when it
 * has none, have kerning. Word kerns text with ligatures with those alone, and leaves text in a font whose kerning is
 * only in its kern table, such as Trebuchet MS, Tahoma, Impact, Gill Sans MT and Franklin Gothic Book, not kerned, where
 * it kerns the same text without ligatures (word-stops-font-kerning P, against K)
 */
const kernsLatinInGlyphPositioning = (path: string): boolean => {
    const data = readFileSync(path);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const tables = new Map(
        Array.from({ length: view.getUint16(4) }, (_, index) => {
            const at = 12 + index * 16;
            return [String.fromCharCode(...data.subarray(at, at + 4)), view.getUint32(at + 8)] as const;
        }),
    );
    const gpos = tables.get("GPOS");
    if (gpos === undefined) {
        return false;
    }
    const tagAt = (offset: number): string => String.fromCharCode(...data.subarray(offset, offset + 4));
    const scripts = gpos + view.getUint16(gpos + 4);
    const features = gpos + view.getUint16(gpos + 6);
    const scriptTags = Array.from({ length: view.getUint16(scripts) }, (_, index) => scripts + 2 + index * 6);
    const script = scriptTags.find((at) => tagAt(at) === "latn") ?? scriptTags.find((at) => tagAt(at) === "DFLT");
    if (script === undefined) {
        return false;
    }
    const table = scripts + view.getUint16(script + 4);
    const languageSystem = view.getUint16(table);
    if (languageSystem === 0) {
        return false;
    }
    const system = table + languageSystem;
    return Array.from({ length: view.getUint16(system + 4) }, (_, index) => view.getUint16(system + 6 + index * 2)).some(
        (feature) => tagAt(features + 2 + feature * 6) === "kern",
    );
};

const generated: string[] = [];
const report: string[] = [];
for (const { name: font, files, own = false } of FONTS) {
    const faces: string[] = [];
    for (const [key, suffix] of FACES) {
        const face = `${font}${suffix}`;
        const path = files?.[key];
        // A face of one of Office's fonts that Word makes itself has no kerning of its own
        if (own && path === undefined) {
            continue;
        }
        const { reading } = readingOf(face);
        const characters = [...(font === "Courier New" ? ASCII : WINDOWS_1252)];
        const kerning = kerningOfCharacters(face, characters, path, own ? MOVED_IN_OFFICE_FONTS : MOVED);

        // The settings whose words were all read, but those ending in a no-break space, which no font joins
        const settings = Object.keys(reading.joined)
            .filter((name) => name.startsWith(`${face}|`))
            .map((name) => name.slice(face.length + 1))
            .filter((setting) => {
                const read = new Set(reading.words[`${face}|${setting}`] ?? []);
                return wordsOf(face, setting).every((word) => read.has(word) || word.endsWith(NO_BREAK_SPACE));
            });
        const advances = reading.advances[face];
        const besideOf = (setting: string): Readonly<Record<string, number>> => reading.beside[`${face}|${setting}`] ?? {};
        const allNames = [...new Set(settings.flatMap((setting) => Object.values(reading.joined[`${face}|${setting}`]).flat()))].filter(
            isGlyph,
        );
        const openFace = path === undefined ? undefined : readFontFile(readFileSync(path))[0];
        /** The glyph the open font, or Word's own file, joins a ligature's letters into, or a character's glyph */
        const openGlyphOf = (name: string): number | undefined => {
            if (openFace === undefined) {
                return undefined;
            }
            const glyphs = [...lettersOf(name)].map((letter) => openFace.glyphOf(letter.codePointAt(0)!));
            const joinedGlyphs = isGlyph(name) ? openFace.join(glyphs, "all").glyphs : glyphs;
            return joinedGlyphs.length === 1 && joinedGlyphs[0] !== 0 ? joinedGlyphs[0] : undefined;
        };
        // A glyph as wide as its letters and kerned as they are changes nothing, but where its letters are kerned with each
        // other, which Word doesn't kern in the glyph, or, in Word's own file of one of Office's fonts, the glyph is kerned
        // otherwise than its letters are with a character beside it, as Aptos's ff is with an e, which its f is and its ff
        // isn't (word-stops-font-kerning P: "offered" 0.13 points wider in Word than its letters kerned)
        const widthOfLetters = (name: string): number =>
            [...lettersOf(name)].reduce((total, letter) => total + (advances[letter] ?? Number.NaN), 0);
        const kernedOtherwiseInFile = (name: string): boolean => {
            const glyph = own ? openGlyphOf(name) : undefined;
            if (glyph === undefined) {
                return false;
            }
            const letters = [...lettersOf(name)];
            return characters.some((character) => {
                const other = openGlyphOf(character);
                return (
                    other !== undefined &&
                    (Math.abs(
                        openFace!.kerningOfGlyphs(glyph, other) * 1000 - (kerning.get(`${letters[letters.length - 1]}|${character}`) ?? 0),
                    ) > 0.5 ||
                        Math.abs(openFace!.kerningOfGlyphs(other, glyph) * 1000 - (kerning.get(`${character}|${letters[0]}`) ?? 0)) > 0.5)
                );
            });
        };
        const changes = (name: string): boolean => {
            if (advances[name] === undefined || !(Math.abs(advances[name] - widthOfLetters(name)) <= 1)) {
                return true;
            }
            const letters = [...lettersOf(name)];
            if (
                letters.slice(1).some((letter, index) => (kerning.get(`${letters[index]}|${letter}`) ?? 0) !== 0) ||
                kernedOtherwiseInFile(name)
            ) {
                return true;
            }
            return settings.some((setting) =>
                Object.entries(besideOf(setting)).some(([pair, value]) => {
                    const [left, right] = pair.split("|");
                    const asLetters =
                        left === name
                            ? kerning.get(`${letters[letters.length - 1]}|${right}`)
                            : right === name
                              ? kerning.get(`${left}|${letters[0]}`)
                              : undefined;
                    return asLetters !== undefined && !Number.isNaN(asLetters) && !MOVED.has(right) && Math.abs(value - asLetters) > 2.5;
                }),
            );
        };
        const names = allNames.filter(changes);
        const glyphIndex = (name: string): number => names.indexOf(name);
        // The glyphs' widths: Word's, or those of Word's own file, where it joins the same letters, which Word's PDF shows
        // to within its reading, and has where it reads none, as at the end of a line
        const widths = names.map((name) => {
            const glyph = own ? openGlyphOf(name) : undefined;
            if (glyph === undefined) {
                return Math.round(advances[name]);
            }
            const width = openFace!.advanceOfGlyph(glyph) * 1000;
            if (advances[name] !== undefined && Math.abs(advances[name] - width) > 1.5) {
                report.push(`${face}: Word's PDF reads ${name} ${advances[name]} wide, where the file has ${width.toFixed(1)}`);
            }
            return Math.round(width);
        });
        const plainGlyphs = names.map((name, index) => [lettersOf(name), widths[index], -1, -1] as const);
        const rules = Object.fromEntries(
            settings.map((setting) => {
                // Glyphs that change nothing are their letters
                const joined = Object.fromEntries(
                    Object.entries(reading.joined[`${face}|${setting}`]).map(([word, units]) => [
                        word,
                        units.flatMap((unit) => (isGlyph(unit) && glyphIndex(unit) < 0 ? [...lettersOf(unit)] : [unit])),
                    ]),
                );
                return [setting, rulesOf(wordsOf(face, setting), joined, glyphIndex, plainGlyphs)];
            }),
        );

        // The kerning of the ligatures' glyphs with the glyphs beside them: the open font's, where it joins the same
        // letters, as Carlito does Calibri's, whose kerning of them Word's PDF shows is Word's for 98.8% of the pairs it
        // read, and those off are as off as the pairs before the characters Word moves; or from LK. Office's fonts' are
        // their own files', as their pairs of characters are
        const units = [...characters, ...names];
        for (const name of names) {
            for (const other of units) {
                for (const [left, right] of [
                    [name, other],
                    [other, name],
                ]) {
                    const [first, second] = [openGlyphOf(left), openGlyphOf(right)];
                    if (first !== undefined && second !== undefined) {
                        kerning.set(`${left}|${right}`, Math.round(openFace!.kerningOfGlyphs(first, second) * 1000));
                    }
                }
            }
        }
        for (const setting of settings) {
            for (const [pair, value] of Object.entries(besideOf(setting))) {
                const [left, right] = pair.split("|");
                if (
                    (isGlyph(left) && glyphIndex(left) < 0) ||
                    (isGlyph(right) && glyphIndex(right) < 0) ||
                    MOVED.has(right) ||
                    kerning.has(`${left}|${right}`)
                ) {
                    continue;
                }
                kerning.set(`${left}|${right}`, Math.abs(value) < 1.5 ? 0 : Math.round(value));
            }
        }
        const indexes = settings.map((setting) => indexRules(rules[setting]));
        const nameOf = (glyph: Glyph): string => (glyph.glyph === undefined ? glyph.text : names[glyph.glyph]);
        const possible = (left: string, right: string): boolean =>
            indexes.some((index) => {
                const glyphsOf = joinLetters([...lettersOf(left), ...lettersOf(right)], index, plainGlyphs);
                return glyphsOf.length === 2 && nameOf(glyphsOf[0]) === left && nameOf(glyphsOf[1]) === right;
            });
        let unread = 0;
        for (const name of names) {
            for (const other of units) {
                for (const [left, right] of [
                    [name, other],
                    [other, name],
                ]) {
                    if (!kerning.has(`${left}|${right}`) && possible(left, right)) {
                        kerning.set(`${left}|${right}`, Number.NaN);
                        unread += 1;
                    }
                }
            }
        }
        const valueOf = (left: string, right: string): number => kerning.get(`${left}|${right}`) ?? 0;
        const label = (value: number): string => (Number.isNaN(value) ? "?" : String(value));
        const zero = units.map(() => "0").join(",");
        const firstClass = classesBy(units, (unit) => units.map((other) => label(valueOf(unit, other))).join(","), zero);
        const secondClass = classesBy(units, (unit) => units.map((other) => label(valueOf(other, unit))).join(","), zero);
        const pairs = new Map<string, number>();
        for (const left of units) {
            for (const right of units) {
                const value = valueOf(left, right);
                if (value !== 0) {
                    pairs.set(
                        `${twoDigits(firstClass.get(left)!)}${twoDigits(secondClass.get(right)!)}`,
                        Number.isNaN(value) ? UNKNOWN : value + 2048,
                    );
                }
            }
        }
        const glyphs = names.map((name, index) => [lettersOf(name), widths[index], firstClass.get(name)!, secondClass.get(name)!] as const);
        const unknown = [...kerning.values()].filter((value) => Number.isNaN(value)).length;
        report.push(
            `${face}: ${new Set(firstClass.values()).size} and ${new Set(secondClass.values()).size} classes, ${pairs.size} pairs of classes, ` +
                `${unknown} pairs not known (${unread} beside ligatures); ${names.length} ligatures in ${settings.join(", ") || "no settings"}`,
        );
        faces.push(
            [
                `        ${key}: {`,
                ...(font === "Courier New" ? [`            characters: ${JSON.stringify(characters.join(""))},`] : []),
                `            first: "${characters.map((character) => twoDigits(firstClass.get(character)!)).join("")}",`,
                `            second: "${characters.map((character) => twoDigits(secondClass.get(character)!)).join("")}",`,
                `            pairs: "${[...pairs].map(([classes, value]) => classes + twoDigits(value)).join("")}",`,
                `            glyphs: ${JSON.stringify(glyphs)},`,
                `            ligatures: ${JSON.stringify(rules)},`,
                ...(own && pairs.size > 0 && !kernsLatinInGlyphPositioning(path!) ? ["            notKernedWithLigatures: true,"] : []),
                "        },",
            ].join("\n"),
        );
    }
    generated.push(`    {\n        name: ${JSON.stringify(font)},\n${faces.join("\n")}\n    },`);
}

const source = `/**
 * How Word kerns the characters of the fonts of the width tables, and which letters it joins into ligatures.
 *
 * Generated by scripts/generate-font-kerning.ts from Word's PDF of scripts/layout-probes/word-kerning.ts, saved from Word
 * 16 for Mac: every pair of the characters of Windows-1252, and of printable ASCII in Courier New, kerned from 1 point;
 * words of the letters fonts join, with each ligature setting of Word's Font dialog; and the kerning beside the glyphs
 * they join. And for Office's other fonts in the width tables, from Word's PDFs of
 * scripts/layout-probes/stops2/word-stops-font-kerning.ts, of the same pairs and words, and Word's own files of them. Do
 * not edit by hand.
 *
 * @module
 */
// cspell:ignore GPOS
import type { Ligatures } from "./text-width";

/**
 * A rule of ligatures: the characters it puts glyphs in place of, and those glyphs, each the index of one of the face's
 * glyphs or a character drawn as itself, and the character that must come after its characters, which it leaves for the
 * next rule, when it looks at one.
 */
export type LigatureRule = readonly [letters: string, units: readonly (number | string)[], next?: string];

/**
 * A face's kerning and ligatures.
 */
export type FaceKerning = {
    /** The characters whose kerning is known, when they aren't those of Windows-1252 */
    readonly characters?: string;
    /**
     * The kerning class of each of those characters as the first of a pair, and as the second, in their order: two digits
     * each, of the 64 of \`0-9a-zA-Z+/\`, the first of 64ths
     */
    readonly first: string;
    readonly second: string;
    /**
     * The kerning of each pair of classes that is kerned, in thousandths of an em: the first's class, the second's, and
     * the kerning plus 2048, two digits each, or ${UNKNOWN} for a pair whose kerning isn't known
     */
    readonly pairs: string;
    /**
     * The glyphs ligatures put in place of characters: the characters each is drawn for, its width in thousandths of an
     * em, and its kerning classes
     */
    readonly glyphs: readonly (readonly [letters: string, width: number, first: number, second: number])[];
    /** The rules of each ligature setting Word's PDF showed */
    readonly ligatures: Readonly<Partial<Record<Ligatures, readonly LigatureRule[]>>>;
    /**
     * Whether Word leaves the face's text not kerned when it has ligatures: it kerns text with ligatures as the font's GPOS
     * table kerns Latin text, which this face's file doesn't, and other text with its kern table
     */
    readonly notKernedWithLigatures?: boolean;
};

/**
 * The kerning and ligatures of a font's faces.
 */
export type FontKerning = {
    /** The font's name, as the width tables name it */
    readonly name: string;
    readonly regular: FaceKerning;
    /**
     * None for a font without a bold face, such as Calibri Light, whose bold Word makes itself, and whose kerning hasn't
     * been seen
     */
    readonly bold?: FaceKerning;
    /**
     * None for a font without an italic face, such as Tahoma, whose italic Word slants from the upright face, and kerns
     * as it, as it does Trebuchet MS's bold italic, which it draws as its bold
     */
    readonly italic?: FaceKerning;
    readonly boldItalic?: FaceKerning;
};

/* cspell:disable */
export const FONT_KERNING: readonly FontKerning[] = [
${generated.join("\n")}
];
/* cspell:enable */
`;
writeFileSync(OUTPUT, source);
execSync(`npx prettier --write ${OUTPUT}`, { stdio: "inherit" });
console.log(report.join("\n"));
