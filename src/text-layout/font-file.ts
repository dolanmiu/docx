/**
 * Reads the widths, kerning and line height of a font's characters from a TrueType or OpenType font file, so text can
 * be measured in fonts that aren't in the width tables. Works on the file's bytes, in Node and in browsers.
 *
 * @module
 */
// cspell:ignore hhea hmtx cmap fsSelection ttcf OTTO GPOS DFLT Aptos
import { DEFAULT_MEASURER, type TextMeasurer } from "./line-breaking";
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, type TextFont, takesNoRoom } from "./text-width";

/**
 * A font file's bytes: a TrueType or OpenType font (`.ttf` or `.otf`), or a collection of them (`.ttc`).
 */
export type FontData = Uint8Array | ArrayBuffer;

/**
 * One face of a font, such as Aptos Bold, as read from its file.
 */
export type FontFace = {
    /** The font's name, as documents name it, such as `"Aptos"` */
    readonly name: string;
    readonly bold: boolean;
    readonly italic: boolean;
    /** How tall a line of single-spaced text is, in ems, as Word works it out */
    readonly lineHeight: number;
} & {
    /** How wide a character is, in ems, or undefined when the font has no glyph for it */
    readonly advanceOf: (code: number) => number | undefined;
    /** How much closer, or further apart, kerning puts two characters, in ems. Negative when it brings them together */
    readonly kerningOf: (left: number, right: number) => number;
};

type Tables = ReadonlyMap<string, number>;

// The two tags of a font file's start that mean TrueType outlines, and the one for OpenType's CFF outlines
const FONT_TAGS = new Set([0x00010000, 0x74727565, 0x4f54544f]);
// "ttcf", the start of a font collection
const COLLECTION_TAG = 0x74746366;
// "wOFF" and "wOF2", the start of web fonts, which are compressed
const WEB_FONT_TAGS = new Set([0x774f4646, 0x774f4632]);

/** Whether a bit is set in a number of flags, such as 0x20 in an OS/2 table's fsSelection */
const hasFlag = (flags: number, flag: number): boolean => Math.floor(flags / flag) % 2 === 1;

const tagOf = (view: DataView, offset: number): string =>
    String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));

/** Where each table of the font at an offset starts */
const readTables = (view: DataView, offset: number): Tables =>
    new Map(
        Array.from({ length: view.getUint16(offset + 4) }, (_, index) => {
            const record = offset + 12 + index * 16;
            const tag = tagOf(view, record);
            const start = view.getUint32(record + 8);
            // A file cut short, so its tables are read before it is laid out, rather than failing as it is
            if (start + view.getUint32(record + 12) > view.byteLength) {
                throw new Error(`The font file is cut short: its ${tag} table goes past its end`);
            }
            return [tag, start] as const;
        }),
    );

/**
 * Reads the name the font is known by in documents: its family name (name 1), in English when it has one. Bold and
 * italic faces share their regular face's family name.
 */
const readName = (view: DataView, tables: Tables): string | undefined => {
    const table = tables.get("name");
    if (table === undefined) {
        return undefined;
    }
    const strings = table + view.getUint16(table + 4);
    const records = Array.from({ length: view.getUint16(table + 2) }, (_, index) => {
        const record = table + 6 + index * 12;
        return {
            platform: view.getUint16(record),
            encoding: view.getUint16(record + 2),
            language: view.getUint16(record + 4),
            name: view.getUint16(record + 6),
            length: view.getUint16(record + 8),
            offset: strings + view.getUint16(record + 10),
        };
    }).filter(({ name }) => name === 1);
    // Windows' names in English first, then Windows' in any language, then Unicode's, then Mac's
    const chosen =
        records.find(({ platform, language }) => platform === 3 && language === 0x409) ??
        records.find(({ platform }) => platform === 3 || platform === 0) ??
        records.find(({ platform, encoding }) => platform === 1 && encoding === 0);
    if (chosen === undefined) {
        return undefined;
    }
    // Mac's names are in bytes, and the others in UTF-16
    return chosen.platform === 1
        ? String.fromCharCode(...Array.from({ length: chosen.length }, (_, index) => view.getUint8(chosen.offset + index)))
        : String.fromCharCode(...Array.from({ length: chosen.length / 2 }, (_, index) => view.getUint16(chosen.offset + index * 2)));
};

/**
 * The glyph of each character, from the font's character map (`cmap`): its Unicode map of the whole of Unicode (format
 * 12), or of the characters up to U+FFFF (format 4).
 */
const readCharacterMap = (view: DataView, tables: Tables): ((code: number) => number) => {
    const table = tables.get("cmap")!;
    const subtables = Array.from({ length: view.getUint16(table + 2) }, (_, index) => {
        const record = table + 4 + index * 8;
        const start = table + view.getUint32(record + 4);
        return { platform: view.getUint16(record), encoding: view.getUint16(record + 2), offset: start, format: view.getUint16(start) };
    });
    const unicode = ({ platform, encoding }: { readonly platform: number; readonly encoding: number }): boolean =>
        platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    const subtable =
        subtables.find((found) => unicode(found) && found.format === 12) ?? subtables.find((found) => unicode(found) && found.format === 4);
    if (subtable === undefined) {
        throw new Error("The font has no Unicode character map");
    }
    const { offset, format } = subtable;
    if (format === 12) {
        const groups = Array.from({ length: view.getUint32(offset + 12) }, (_, index) => {
            const group = offset + 16 + index * 12;
            return { start: view.getUint32(group), end: view.getUint32(group + 4), glyph: view.getUint32(group + 8) };
        });
        return (code) => {
            const group = groups.find(({ end }) => end >= code);
            return group === undefined || group.start > code ? 0 : group.glyph + code - group.start;
        };
    }
    const segments = view.getUint16(offset + 6) / 2;
    const ends = offset + 14;
    const starts = ends + segments * 2 + 2;
    const deltas = starts + segments * 2;
    const rangeOffsets = deltas + segments * 2;
    return (code) => {
        const segment = Array.from({ length: segments }, (_, index) => index).find((index) => view.getUint16(ends + index * 2) >= code);
        if (segment === undefined || view.getUint16(starts + segment * 2) > code) {
            return 0;
        }
        const delta = view.getUint16(deltas + segment * 2);
        const rangeOffset = view.getUint16(rangeOffsets + segment * 2);
        if (rangeOffset === 0) {
            return (code + delta) % 0x10000;
        }
        const glyph = view.getUint16(rangeOffsets + segment * 2 + rangeOffset + (code - view.getUint16(starts + segment * 2)) * 2);
        return glyph === 0 ? 0 : (glyph + delta) % 0x10000;
    };
};

/** The kerning of a pair of glyphs, in font units */
type Kerning = (left: number, right: number) => number;

/**
 * The kerning of pairs of glyphs in the font's `kern` table, as Windows' fonts have it: its horizontal subtables of
 * pairs (format 0), in font units.
 */
const readKernTable = (view: DataView, tables: Tables): Kerning => {
    const table = tables.get("kern");
    // Apple's kern tables start with a version of 1 in 32 bits, and Windows' with 0 in 16
    if (table === undefined || view.getUint16(table) !== 0) {
        return () => 0;
    }
    const pairs = new Map<number, number>();
    let subtable = table + 4;
    for (let index = 0; index < view.getUint16(table + 2); index++) {
        const coverage = view.getUint16(subtable + 4);
        const format = Math.floor(coverage / 0x100);
        // Format 0, horizontal, and kerning rather than minimum values or cross-stream
        if (format === 0 && coverage % 8 === 1) {
            for (let pair = 0; pair < view.getUint16(subtable + 6); pair++) {
                const record = subtable + 14 + pair * 6;
                const key = view.getUint16(record) * 0x10000 + view.getUint16(record + 2);
                // eslint-disable-next-line functional/immutable-data
                pairs.set(key, (pairs.get(key) ?? 0) + view.getInt16(record + 4));
            }
        }
        // A subtable of pairs is as long as its pairs: the length it gives is too short when it is longer than 16 bits
        // can say, as Aptos's and Calibri's are
        subtable += format === 0 ? 14 + view.getUint16(subtable + 6) * 6 : view.getUint16(subtable + 2);
    }
    return (left, right) => pairs.get(left * 0x10000 + right) ?? 0;
};

/** The index of each glyph a coverage table covers */
const readCoverage = (view: DataView, offset: number): ReadonlyMap<number, number> => {
    const indexes = new Map<number, number>();
    const count = view.getUint16(offset + 2);
    for (let index = 0; index < count; index++) {
        if (view.getUint16(offset) === 1) {
            // eslint-disable-next-line functional/immutable-data
            indexes.set(view.getUint16(offset + 4 + index * 2), index);
            continue;
        }
        // Ranges of glyphs, and the index of the first of each
        const range = offset + 4 + index * 6;
        for (let glyph = view.getUint16(range); glyph <= view.getUint16(range + 2); glyph++) {
            // eslint-disable-next-line functional/immutable-data
            indexes.set(glyph, view.getUint16(range + 4) + glyph - view.getUint16(range));
        }
    }
    return indexes;
};

/** The class of each glyph a class definition table gives one. Other glyphs are in class 0 */
const readClasses = (view: DataView, offset: number): ReadonlyMap<number, number> => {
    const classes = new Map<number, number>();
    if (view.getUint16(offset) === 1) {
        const first = view.getUint16(offset + 2);
        for (let index = 0; index < view.getUint16(offset + 4); index++) {
            // eslint-disable-next-line functional/immutable-data
            classes.set(first + index, view.getUint16(offset + 6 + index * 2));
        }
        return classes;
    }
    for (let index = 0; index < view.getUint16(offset + 2); index++) {
        const range = offset + 4 + index * 6;
        for (let glyph = view.getUint16(range); glyph <= view.getUint16(range + 2); glyph++) {
            // eslint-disable-next-line functional/immutable-data
            classes.set(glyph, view.getUint16(range + 4));
        }
    }
    return classes;
};

/** How long a value record of this format is, in bytes: 2 for each of the 8 values it can have that it has */
const valueSize = (format: number): number => [1, 2, 4, 8, 16, 32, 64, 128].filter((flag) => hasFlag(format, flag)).length * 2;

/** The change to the advance of a glyph in a value record (its XAdvance, 4), after its X and Y placements, if it has them */
const advanceIn = (view: DataView, record: number, format: number): number =>
    hasFlag(format, 4) ? view.getInt16(record + valueSize(format % 4)) : 0;

/**
 * A subtable of pairs of glyphs to kern (a pair adjustment, format 1 or 2): the kerning of a pair, or undefined when the
 * subtable doesn't cover it, and the next subtable is tried.
 */
const readPairSubtable = (view: DataView, offset: number): ((left: number, right: number) => number | undefined) => {
    const coverage = readCoverage(view, offset + view.getUint16(offset + 2));
    const firstFormat = view.getUint16(offset + 4);
    const secondFormat = view.getUint16(offset + 6);
    const firstSize = valueSize(firstFormat);
    const kerning = (record: number): number => advanceIn(view, record, firstFormat) + advanceIn(view, record + firstSize, secondFormat);
    if (view.getUint16(offset) === 1) {
        // A set of the glyphs after each covered glyph, with the kerning of each
        return (left, right) => {
            const index = coverage.get(left);
            if (index === undefined) {
                return undefined;
            }
            const set = offset + view.getUint16(offset + 10 + index * 2);
            const size = 2 + firstSize + valueSize(secondFormat);
            for (let pair = 0; pair < view.getUint16(set); pair++) {
                const record = set + 2 + pair * size;
                if (view.getUint16(record) === right) {
                    return kerning(record + 2);
                }
            }
            return undefined;
        };
    }
    // The kerning of each class of first glyphs with each class of second glyphs
    const firstClasses = readClasses(view, offset + view.getUint16(offset + 8));
    const secondClasses = readClasses(view, offset + view.getUint16(offset + 10));
    const secondCount = view.getUint16(offset + 14);
    return (left, right) =>
        coverage.has(left)
            ? kerning(
                  offset +
                      16 +
                      ((firstClasses.get(left) ?? 0) * secondCount + (secondClasses.get(right) ?? 0)) *
                          (firstSize + valueSize(secondFormat)),
              )
            : undefined;
};

/**
 * The kerning of pairs of glyphs in the font's GPOS table, in font units: the pair adjustments of its `kern` feature for
 * Latin text, as Word kerns with them (word-fonts.docx F2). Undefined when the font has none.
 */
const readGlyphPositioning = (view: DataView, tables: Tables): Kerning | undefined => {
    const table = tables.get("GPOS");
    if (table === undefined) {
        return undefined;
    }
    const tagAt = (offset: number): string => tagOf(view, offset);
    // The script for Latin text, or the default one, or the first
    const scriptList = table + view.getUint16(table + 4);
    const scripts = Array.from({ length: view.getUint16(scriptList) }, (_, index) => scriptList + 2 + index * 6);
    const script = ["latn", "DFLT"].map((tag) => scripts.find((record) => tagAt(record) === tag)).find(Boolean) ?? scripts[0];
    if (script === undefined) {
        return undefined;
    }
    // Its features for any language, or for the first language it has
    const scriptTable = scriptList + view.getUint16(script + 4);
    const languages = scriptTable + (view.getUint16(scriptTable) || view.getUint16(scriptTable + 8));
    const featureList = table + view.getUint16(table + 6);
    const lookups = [
        ...new Set(
            Array.from({ length: view.getUint16(languages + 4) }, (_, index) => view.getUint16(languages + 6 + index * 2))
                .map((feature) => featureList + 2 + feature * 6)
                .filter((record) => tagAt(record) === "kern")
                .flatMap((record) => {
                    const feature = featureList + view.getUint16(record + 4);
                    return Array.from({ length: view.getUint16(feature + 2) }, (_, index) => view.getUint16(feature + 4 + index * 2));
                }),
        ),
    ].sort((one, other) => one - other);
    if (lookups.length === 0) {
        return undefined;
    }
    // Each lookup's subtables of pair adjustments, through the extensions that point to subtables further on
    const lookupList = table + view.getUint16(table + 8);
    const subtablesOf = lookups.map((index) => {
        const lookup = lookupList + view.getUint16(lookupList + 2 + index * 2);
        return Array.from({ length: view.getUint16(lookup + 4) }, (_, subtable) => lookup + view.getUint16(lookup + 6 + subtable * 2))
            .map((subtable) =>
                view.getUint16(lookup) === 9
                    ? { type: view.getUint16(subtable + 2), offset: subtable + view.getUint32(subtable + 4) }
                    : { type: view.getUint16(lookup), offset: subtable },
            )
            .filter(({ type }) => type === 2)
            .map(({ offset }) => readPairSubtable(view, offset));
    });
    // Each lookup kerns a pair with the first of its subtables that covers it, and the lookups' kerning adds up
    return (left, right) =>
        subtablesOf.reduce((total, subtables) => {
            for (const subtable of subtables) {
                const kerning = subtable(left, right);
                if (kerning !== undefined) {
                    return total + kerning;
                }
            }
            return total;
        }, 0);
};

/**
 * Reads a face of a font file, whose table directory is at `offset`.
 */
const readFace = (view: DataView, offset: number): FontFace => {
    const tables = readTables(view, offset);
    for (const tag of ["head", "hhea", "hmtx", "cmap"]) {
        if (!tables.has(tag)) {
            throw new Error(`The font has no ${tag} table`);
        }
    }
    const unitsPerEm = view.getUint16(tables.get("head")! + 18);
    const macStyle = view.getUint16(tables.get("head")! + 44);
    const hhea = tables.get("hhea")!;
    const ascender = view.getInt16(hhea + 4);
    const descender = view.getInt16(hhea + 6);
    const lineGap = view.getInt16(hhea + 8);
    const metricCount = view.getUint16(hhea + 34);
    const hmtx = tables.get("hmtx")!;
    const os2 = tables.get("OS/2");

    // Word's single line: the font's ascent and descent for Windows, and the gap between lines its hhea table adds to
    // them, as Windows works out a font's height and external leading. Calibri's is 1.2207 ems, and Arial's and Times New
    // Roman's 1.1499, as Word's lines are (word-rules.docx P6). A font without an OS/2 table uses its hhea table's. A font
    // that asks for its typographic ascent, descent and line gap to be used instead (USE_TYPO_METRICS) has them, as
    // Aptos does: 1.2207 ems, rather than 1.2847 for Windows (word-fonts.docx F6)
    const fsSelection = os2 === undefined ? 0 : view.getUint16(os2 + 62);
    const windowsHeight = os2 === undefined ? ascender - descender : view.getUint16(os2 + 74) + view.getUint16(os2 + 76);
    const externalLeading = Math.max(0, lineGap - (windowsHeight - (ascender - descender)));
    const lineHeight = hasFlag(fsSelection, 0x80)
        ? view.getInt16(os2! + 68) - view.getInt16(os2! + 70) + view.getInt16(os2! + 72)
        : windowsHeight + externalLeading;

    const glyphOf = readCharacterMap(view, tables);
    // Word kerns with the GPOS table, and with the kern table of fonts without one (word-fonts.docx F1 and F2). It is read
    // with the rest, in a few milliseconds, so a damaged table throws here rather than when text is laid out
    const kerning = readGlyphPositioning(view, tables) ?? readKernTable(view, tables);
    const pairs = new Map<number, number>();
    const advances = new Map<number, number | undefined>();
    const glyphs = new Map<number, number>();
    const advanceOfGlyph = (glyph: number): number => view.getUint16(hmtx + Math.min(glyph, metricCount - 1) * 4) / unitsPerEm;
    const cachedGlyph = (code: number): number => {
        const glyph = glyphs.get(code) ?? glyphOf(code);
        // eslint-disable-next-line functional/immutable-data
        glyphs.set(code, glyph);
        return glyph;
    };

    return {
        name: readName(view, tables) ?? "",
        // Bold and italic as the font's OS/2 table says, or its head table when it has none
        bold: os2 === undefined ? hasFlag(macStyle, 1) : hasFlag(fsSelection, 0x20),
        italic: os2 === undefined ? hasFlag(macStyle, 2) : hasFlag(fsSelection, 1),
        lineHeight: lineHeight / unitsPerEm,
        advanceOf: (code) => {
            if (advances.has(code)) {
                return advances.get(code);
            }
            const glyph = cachedGlyph(code);
            const advance = glyph === 0 ? undefined : advanceOfGlyph(glyph);
            // eslint-disable-next-line functional/immutable-data
            advances.set(code, advance);
            return advance;
        },
        kerningOf: (left, right) => {
            const key = cachedGlyph(left) * 0x10000 + cachedGlyph(right);
            const value = pairs.get(key) ?? kerning(cachedGlyph(left), cachedGlyph(right)) / unitsPerEm;
            // eslint-disable-next-line functional/immutable-data
            pairs.set(key, value);
            return value;
        },
    };
};

/**
 * Reads the faces of a font file: one for a TrueType or OpenType font, and each of a collection's.
 */
export const readFontFile = (data: FontData): readonly FontFace[] => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const tag = bytes.byteLength < 12 ? 0 : view.getUint32(0);
    /** Reads faces, turning a read past the end of the file, from an offset in it that is wrong, into an error that says so */
    const read = (faces: () => readonly FontFace[]): readonly FontFace[] => {
        try {
            return faces();
        } catch (error) {
            if (error instanceof RangeError) {
                throw new Error("The font file is damaged: it points past its end", { cause: error });
            }
            throw error;
        }
    };
    if (tag === COLLECTION_TAG) {
        return read(() => Array.from({ length: view.getUint32(8) }, (_, index) => readFace(view, view.getUint32(12 + index * 4))));
    }
    if (FONT_TAGS.has(tag)) {
        return read(() => [readFace(view, 0)]);
    }
    throw new Error(
        WEB_FONT_TAGS.has(tag)
            ? "The font is a web font (WOFF), which is compressed. Give it as a TrueType or OpenType font (.ttf or .otf)"
            : "The data isn't a TrueType or OpenType font",
    );
};

// Half an inch, in points
const TAB_STOP = 36;

/**
 * Measures text in the fonts of these faces with their own widths, kerning and line height, and text in other fonts with
 * `fallback`. Text that is bold, or not, is measured with a face that is too, and with one that is italic, or not, as the
 * text is, when there is one. A character a face has no glyph for is one whose width isn't known, as Word draws it in
 * another font, unless it takes no room, such as a soft hyphen.
 */
export const createFontFileMeasurer = (faces: readonly FontFace[], fallback: TextMeasurer = DEFAULT_MEASURER): TextMeasurer => {
    // The face of each font, bold or not, and italic or not, as text is measured many times in each
    const chosen = new Map<string, FontFace | undefined>();
    const faceOf = ({ font = DEFAULT_FONT, bold = false, italic = false }: TextFont): FontFace | undefined => {
        const key = `${font.toLowerCase()}|${bold}|${italic}`;
        if (!chosen.has(key)) {
            const named = faces.filter((face) => face.name.toLowerCase() === font.toLowerCase() && face.bold === bold);
            // eslint-disable-next-line functional/immutable-data
            chosen.set(key, named.find((face) => face.italic === italic) ?? named[0]);
        }
        return chosen.get(key);
    };
    /** How wide text with no tabs is in a face, in points */
    const widthIn = (face: FontFace, text: string, font: TextFont): number => {
        const { size = DEFAULT_FONT_SIZE, characterSpacing = 0, scale = 100, kerning } = font;
        const kerns = kerning !== undefined && size >= kerning;
        const em = (size * scale) / 100;
        const characters = [...text];
        return characters.reduce((width, character, index) => {
            const advance = face.advanceOf(character.codePointAt(0)!);
            if (advance === undefined) {
                // The layout stops at a character the font has no glyph for, unless it takes no room
                return takesNoRoom(character) ? width : width + fallback.measureWidth(character, font);
            }
            const before = characters[index - 1]?.codePointAt(0);
            const kern =
                kerns && before !== undefined && face.advanceOf(before) !== undefined
                    ? face.kerningOf(before, character.codePointAt(0)!)
                    : 0;
            return width + (advance + kern) * em + characterSpacing;
        }, 0);
    };
    return {
        measureWidth: (text, font) => {
            const face = faceOf(font);
            if (!face) {
                return fallback.measureWidth(text, font);
            }
            // A tab typed in the text, rather than written as a tab, moves to the next half inch from the start of the text, as
            // the width tables measure it
            return text
                .split("\t")
                .reduce(
                    (position, part, index) =>
                        (index === 0 ? 0 : (Math.floor(position / TAB_STOP) + 1) * TAB_STOP) + widthIn(face, part, font),
                    0,
                );
        },
        measureLineHeight: (font) => {
            const face = faceOf(font);
            return face ? face.lineHeight * (font.size ?? DEFAULT_FONT_SIZE) : fallback.measureLineHeight(font);
        },
        unknownCharacter: (text, font) => {
            const face = faceOf(font);
            return face
                ? [...text].find(
                      (character) =>
                          character !== "\t" && !takesNoRoom(character) && face.advanceOf(character.codePointAt(0)!) === undefined,
                  )
                : fallback.unknownCharacter?.(text, font);
        },
    };
};
