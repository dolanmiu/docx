/**
 * Reads the widths, kerning and line height of a font's characters from a TrueType or OpenType font file, so text can
 * be measured in fonts that aren't in the width tables. Works on the file's bytes, in Node and in browsers.
 *
 * @module
 */
// cspell:ignore hhea hmtx cmap fsSelection ttcf OTTO GPOS DFLT Aptos clig dlig GSUB hlig liga
import { hasLigatures } from "./kerning";
import { DEFAULT_MEASURER, type TextMeasurer } from "./line-breaking";
import { OFFICE_CLOUD_FONTS } from "./office-cloud-fonts";
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, type Ligatures, type TextFont, isKerned, takesNoRoom, unknownFont } from "./text-width";

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
    /**
     * How far a line of single-spaced text goes below its baseline, in ems: the descent the line is worked out from. The
     * rest is above it, with the line gap at the top
     */
    readonly descent: number;
} & {
    /** How wide a character is, in ems, or undefined when the font has no glyph for it */
    readonly advanceOf: (code: number) => number | undefined;
    /** How much closer, or further apart, kerning puts two characters, in ems. Negative when it brings them together */
    readonly kerningOf: (left: number, right: number) => number;
    /** The glyph of a character, or 0 when the font has none */
    readonly glyphOf: (code: number) => number;
    /** How wide a glyph is, in ems */
    readonly advanceOfGlyph: (glyph: number) => number;
    /** How much closer, or further apart, kerning puts two glyphs, in ems */
    readonly kerningOfGlyphs: (left: number, right: number) => number;
    /**
     * Whether Word kerns the face's text with ligatures: when its GPOS table kerns Latin text, as Word kerns text with
     * ligatures with that alone, and leaves the text of a font whose kerning is only in its kern table, such as Trebuchet
     * MS, not kerned (scripts/layout-probes/stops2/word-stops-font-kerning.ts P, word-stops-office-fonts.ts KL1)
     */
    readonly kernsWithLigatures: boolean;
    /**
     * The glyphs the font's ligatures of a setting put in place of glyphs, and whether a substitution the setting has that
     * isn't a ligature, such as a contextual one, could change them
     */
    readonly join: (glyphs: readonly number[], ligatures: Ligatures) => JoinedGlyphs;
};

/** Glyphs, after a font's ligatures have joined them */
export type JoinedGlyphs = {
    readonly glyphs: readonly number[];
    /** Whether a substitution not yet followed could change them */
    readonly unknown: boolean;
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

/**
 * Throws as a read past the end of the file does, for what is read only when text is laid out in the font, so that a
 * damaged font throws when it is read, rather than when it is laid out
 */
const checkInFile = (view: DataView, end: number): void => {
    if (end > view.byteLength) {
        throw new RangeError(`The font file points past its end, to ${end}`);
    }
};

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
        // A number of ranges the file has no room for is found before an array of that many is made, as a collection's is
        const count = view.getUint32(offset + 12);
        if (offset + 16 + count * 12 > view.byteLength) {
            throw new Error("The font file is damaged: its character map says it has more ranges of characters than it has room for");
        }
        const groups = Array.from({ length: count }, (_, index) => {
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
    // The segments, and the glyphs in the array of those mapped through it, are read when text is laid out in the font
    checkInFile(view, rangeOffsets + segments * 2);
    for (let segment = 0; segment < segments; segment++) {
        const rangeOffset = view.getUint16(rangeOffsets + segment * 2);
        const characters = view.getUint16(ends + segment * 2) - view.getUint16(starts + segment * 2) + 1;
        if (rangeOffset !== 0) {
            checkInFile(view, rangeOffsets + segment * 2 + rangeOffset + characters * 2);
        }
    }
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
 * The lookups of a GPOS or GSUB table's features with these tags, for Latin text: those of the script for Latin text, or
 * the default one, or, with `anyScript`, the first, and of its features for any language, or for the first language it
 * has. In the order of the table's lookups, as they are applied.
 */
const lookupsOfFeatures = (view: DataView, table: number, tags: readonly string[], anyScript: boolean): readonly number[] => {
    const tagAt = (offset: number): string => tagOf(view, offset);
    const scriptList = table + view.getUint16(table + 4);
    const scripts = Array.from({ length: view.getUint16(scriptList) }, (_, index) => scriptList + 2 + index * 6);
    const script =
        ["latn", "DFLT"].map((tag) => scripts.find((record) => tagAt(record) === tag)).find(Boolean) ??
        (anyScript ? scripts[0] : undefined);
    if (script === undefined) {
        return [];
    }
    const scriptTable = scriptList + view.getUint16(script + 4);
    const languages = scriptTable + (view.getUint16(scriptTable) || view.getUint16(scriptTable + 8));
    const featureList = table + view.getUint16(table + 6);
    return [
        ...new Set(
            Array.from({ length: view.getUint16(languages + 4) }, (_, index) => view.getUint16(languages + 6 + index * 2))
                .map((feature) => featureList + 2 + feature * 6)
                .filter((record) => tags.includes(tagAt(record)))
                .flatMap((record) => {
                    const feature = featureList + view.getUint16(record + 4);
                    return Array.from({ length: view.getUint16(feature + 2) }, (_, index) => view.getUint16(feature + 4 + index * 2));
                }),
        ),
    ].sort((one, other) => one - other);
};

/**
 * Each subtable of a lookup of a GPOS or GSUB table, with its kind, through the extensions (kind 9 in GPOS, 7 in GSUB)
 * that point to subtables further on.
 */
const subtablesOf = (
    view: DataView,
    table: number,
    index: number,
    extension: number,
): readonly { readonly type: number; readonly offset: number }[] => {
    const lookupList = table + view.getUint16(table + 8);
    const lookup = lookupList + view.getUint16(lookupList + 2 + index * 2);
    return Array.from({ length: view.getUint16(lookup + 4) }, (_, subtable) => lookup + view.getUint16(lookup + 6 + subtable * 2)).map(
        (subtable) =>
            view.getUint16(lookup) === extension
                ? { type: view.getUint16(subtable + 2), offset: subtable + view.getUint32(subtable + 4) }
                : { type: view.getUint16(lookup), offset: subtable },
    );
};

/**
 * The kerning of pairs of glyphs in the font's GPOS table, in font units: the pair adjustments of its `kern` feature for
 * Latin text, or for the default script, as Word kerns with them (word-fonts.docx F2). Undefined when the font has none,
 * as Tahoma's, whose GPOS table kerns Arabic alone, and which Word kerns with its kern table
 * (scripts/layout-probes/stops2/word-stops-office-fonts.ts KL1l).
 */
const readGlyphPositioning = (view: DataView, tables: Tables): Kerning | undefined => {
    const table = tables.get("GPOS");
    if (table === undefined) {
        return undefined;
    }
    const lookups = lookupsOfFeatures(view, table, ["kern"], false);
    if (lookups.length === 0) {
        return undefined;
    }
    // Each lookup's subtables of pair adjustments
    const pairSubtables = lookups.map((index) =>
        subtablesOf(view, table, index, 9)
            .filter(({ type }) => type === 2)
            .map(({ offset }) => readPairSubtable(view, offset)),
    );
    // Each lookup kerns a pair with the first of its subtables that covers it, and the lookups' kerning adds up
    return (left, right) =>
        pairSubtables.reduce((total, subtables) => {
            for (const subtable of subtables) {
                const kerning = subtable(left, right);
                if (kerning !== undefined) {
                    return total + kerning;
                }
            }
            return total;
        }, 0);
};

/** A ligature: the glyphs after its first that it joins, and the glyph it puts in place of them all */
type Ligature = { readonly components: readonly number[]; readonly glyph: number };

/**
 * A lookup of the GSUB table: the ligatures of a ligature substitution (kind 4), by their first glyph, in the order they
 * are tried, or the glyphs a substitution of another kind starts at, which isn't followed
 */
type SubstitutionLookup = { readonly ligatures: ReadonlyMap<number, readonly Ligature[]> } | { readonly starts: ReadonlySet<number> };

// The OpenType features of each kind of ligature Word's ligature settings name
const LIGATURE_FEATURES: Readonly<Record<string, string>> = {
    standard: "liga",
    contextual: "clig",
    historical: "hlig",
    discretional: "dlig",
};

/** The features of a ligature setting, such as "liga" and "clig" for "standardContextual" */
const featuresOf = (ligatures: Ligatures): readonly string[] =>
    Object.entries(LIGATURE_FEATURES)
        .filter(([kind]) => ligatures === "all" || ligatures.toLowerCase().includes(kind))
        .map(([, feature]) => feature);

/** Reads a ligature substitution subtable (kind 4): the ligatures of each glyph it covers, in the order they are tried */
const readLigatureSubtable = (view: DataView, offset: number): ReadonlyMap<number, readonly Ligature[]> =>
    new Map(
        [...readCoverage(view, offset + view.getUint16(offset + 2))].map(([glyph, index]) => {
            const set = offset + view.getUint16(offset + 6 + index * 2);
            const ligatures = Array.from({ length: view.getUint16(set) }, (_, ligature): Ligature => {
                const at = set + view.getUint16(set + 2 + ligature * 2);
                return {
                    glyph: view.getUint16(at),
                    components: Array.from({ length: view.getUint16(at + 2) - 1 }, (__, component) =>
                        view.getUint16(at + 4 + component * 2),
                    ),
                };
            });
            return [glyph, ligatures] as const;
        }),
    );

/**
 * The glyphs a substitution of a kind that isn't followed starts at: those of its coverage, or, for a contextual one of
 * format 3, of its first input glyph's coverage.
 */
const startsOf = (view: DataView, type: number, offset: number): readonly number[] => {
    const format = view.getUint16(offset);
    const backtrack = type === 6 && format === 3 ? view.getUint16(offset + 2) : 0;
    const coverage = format === 3 && (type === 5 || type === 6) ? view.getUint16(offset + 6 + backtrack * 2) : view.getUint16(offset + 2);
    return [...readCoverage(view, offset + coverage).keys()];
};

/**
 * Reads a lookup of the GSUB table: its ligatures, the first subtable's first, as each glyph's are tried in the order of
 * the subtables, or, when it has substitutions of other kinds, the glyphs they start at.
 */
const readSubstitutionLookup = (view: DataView, table: number, index: number): SubstitutionLookup => {
    const subtables = subtablesOf(view, table, index, 7);
    const starts = subtables.filter(({ type }) => type !== 4).flatMap(({ type, offset }) => startsOf(view, type, offset));
    if (starts.length > 0) {
        return { starts: new Set(starts) };
    }
    const maps = subtables.map(({ offset }) => readLigatureSubtable(view, offset));
    const glyphs = [...new Set(maps.flatMap((map) => [...map.keys()]))];
    return { ligatures: new Map(glyphs.map((glyph) => [glyph, maps.flatMap((map) => map.get(glyph) ?? [])])) };
};

/**
 * The lookups of the font's GSUB table for each ligature setting, which put ligatures in place of glyphs: the lookups of
 * its features for each kind of ligature, for Latin text, in the order of the table's lookups. They are read with the
 * rest of the font, as there are few, so a damaged table throws then rather than when text is laid out. Undefined when
 * the font has no GSUB table.
 */
const readGlyphSubstitution = (view: DataView, tables: Tables): ((ligatures: Ligatures) => readonly SubstitutionLookup[]) | undefined => {
    const table = tables.get("GSUB");
    if (table === undefined) {
        return undefined;
    }
    const byFeature = new Map(
        Object.values(LIGATURE_FEATURES).map((feature) => [feature, lookupsOfFeatures(view, table, [feature], true)]),
    );
    const lookups = new Map(
        [...new Set([...byFeature.values()].flat())].map((index) => [index, readSubstitutionLookup(view, table, index)]),
    );
    const bySetting = new Map<Ligatures, readonly SubstitutionLookup[]>();
    return (ligatures) => {
        if (!bySetting.has(ligatures)) {
            const indexes = [...new Set(featuresOf(ligatures).flatMap((feature) => byFeature.get(feature)!))].sort(
                (one, other) => one - other,
            );
            // eslint-disable-next-line functional/immutable-data
            bySetting.set(
                ligatures,
                indexes.map((index) => lookups.get(index)!),
            );
        }
        return bySetting.get(ligatures)!;
    };
};

/** The ligature of a lookup at a glyph: the first of the glyph's ligatures whose other glyphs follow it */
const ligatureAt = (glyphs: readonly number[], at: number, ligatures: ReadonlyMap<number, readonly Ligature[]>): Ligature | undefined =>
    ligatures.get(glyphs[at])?.find(({ components }) => components.every((glyph, index) => glyphs[at + 1 + index] === glyph));

/** Joins glyphs with the ligatures of a lookup: at each glyph, its ligature, and the next glyph after the ligature's */
const joinWith = (glyphs: readonly number[], ligatures: ReadonlyMap<number, readonly Ligature[]>): readonly number[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const joined: number[] = [];
    let at = 0;
    while (at < glyphs.length) {
        const ligature = ligatureAt(glyphs, at, ligatures);
        // eslint-disable-next-line functional/immutable-data
        joined.push(ligature?.glyph ?? glyphs[at]);
        at += ligature === undefined ? 1 : ligature.components.length + 1;
    }
    return joined;
};

/**
 * Joins glyphs with the ligatures of a setting's lookups, in their order, and says whether a substitution of another kind
 * could change them.
 */
const joinGlyphs = (glyphs: readonly number[], lookups: readonly SubstitutionLookup[]): JoinedGlyphs =>
    lookups.reduce<JoinedGlyphs>(
        (joined, lookup) =>
            "starts" in lookup
                ? { ...joined, unknown: joined.unknown || joined.glyphs.some((glyph) => lookup.starts.has(glyph)) }
                : { ...joined, glyphs: joinWith(joined.glyphs, lookup.ligatures) },
        { glyphs, unknown: false },
    );

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
    // The widths are read when text is laid out in the font
    checkInFile(view, hmtx + metricCount * 4);
    const os2 = tables.get("OS/2");

    // Word's single line on the Mac: the font's ascender, descender and line gap in its hhea table, as Word's lines of
    // Office's fonts are, where Corbel's and Book Antiqua's ascent and descent for Windows would make them taller, and its
    // lines go as far below the baseline as the descender, Corbel's beside a picture and beside Courier New too
    // (scripts/layout-probes/stops2/word-stops-font-heights.ts FH1 to FH16, word-stops-office-fonts.ts DS1, DS2). Calibri's
    // are 1.2207 ems and 550 of its 2048 units, as below a picture beside Calibri 11 (word-watertight-text.docx TX8b). A
    // font that asks for its typographic ascent, descent and line gap to be used instead (USE_TYPO_METRICS) has them, as
    // Aptos does: 1.2207 ems, rather than 1.2847 for Windows (word-fonts.docx F6)
    const fsSelection = os2 === undefined ? 0 : view.getUint16(os2 + 62);
    const typographic = hasFlag(fsSelection, 0x80);
    const lineHeight = typographic
        ? view.getInt16(os2! + 68) - view.getInt16(os2! + 70) + view.getInt16(os2! + 72)
        : ascender - descender + lineGap;
    const descent = typographic ? -view.getInt16(os2! + 70) : -descender;

    const glyphOf = readCharacterMap(view, tables);
    // Word kerns with the GPOS table, and with the kern table of fonts without one (word-fonts.docx F1 and F2). It is read
    // with the rest, in a few milliseconds, so a damaged table throws here rather than when text is laid out
    const glyphPositioning = readGlyphPositioning(view, tables);
    const kerning = glyphPositioning ?? readKernTable(view, tables);
    // Word joins letters with the ligatures of the GSUB table, as a ligature setting asks (word-kerning.docx A)
    const substitution = readGlyphSubstitution(view, tables);
    const pairs = new Map<number, number>();
    const advances = new Map<number, number | undefined>();
    const glyphs = new Map<number, number>();
    const advanceOfGlyph = (glyph: number): number => view.getUint16(hmtx + Math.min(glyph, metricCount - 1) * 4) / unitsPerEm;
    const kerningOfGlyphs = (left: number, right: number): number => {
        const key = left * 0x10000 + right;
        const value = pairs.get(key) ?? kerning(left, right) / unitsPerEm;
        // eslint-disable-next-line functional/immutable-data
        pairs.set(key, value);
        return value;
    };
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
        descent: descent / unitsPerEm,
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
        kerningOf: (left, right) => kerningOfGlyphs(cachedGlyph(left), cachedGlyph(right)),
        glyphOf: cachedGlyph,
        advanceOfGlyph,
        kerningOfGlyphs,
        kernsWithLigatures: glyphPositioning !== undefined,
        join: (sequence, ligatures) => joinGlyphs(sequence, substitution?.(ligatures) ?? []),
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
        // A number of fonts the file has no room for is found before an array of that many is made, which a few bytes could
        // otherwise make hundreds of megabytes of
        const count = view.getUint32(8);
        if (12 + count * 4 > bytes.byteLength) {
            throw new Error("The font file is damaged: it says it has more fonts than it has room for");
        }
        return read(() => Array.from({ length: count }, (_, index) => readFace(view, view.getUint32(12 + index * 4))));
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
 * Why a layout stops at text in a font from a file that Office offers as a cloud font: Word for Mac draws it in Office's
 * copy of the font, even where the document embeds a file of its own of it, as it drew Pacifico, which a document
 * embedded, in Office's copy, whose letters are narrower and whose lines are shorter (`word-stops-office-fonts.docx` MB4)
 */
export const OFFICE_COPY = "a font from a file that Office offers a copy of its own of, which Word may draw the text in instead";

// The names of Office's cloud fonts, in lower case, made when a font from a file is first measured
const cloudFonts = new Set<string>();

/**
 * Whether Office offers a font as a cloud font, other than one of the width tables, such as Aptos, which are measured as
 * Word draws them already, or this text in it: the Latin letters of an East Asian font of the tables that isn't
 * monospaced, such as Microsoft YaHei, aren't in them
 */
export const offeredByOffice = (font: string, text?: string): boolean => {
    if (cloudFonts.size === 0) {
        // eslint-disable-next-line functional/immutable-data
        OFFICE_CLOUD_FONTS.forEach((name) => cloudFonts.add(name.toLowerCase()));
    }
    return cloudFonts.has(font.toLowerCase()) && unknownFont({ font }, text);
};

/**
 * Measures text in the fonts of these faces with their own widths, kerning and line height, and text in other fonts with
 * `fallback`. Text that is bold, or not, is measured with a face that is too, and with one that is italic, or not, as the
 * text is, when there is one. A character a face has no glyph for is one whose width isn't known, as Word draws it in
 * another font, unless it takes no room, such as a soft hyphen. Text in a font without a face as bold as it is in a font
 * whose widths aren't known, unless `fallback` knows them: Word makes that face itself, each glyph 20 thousandths of an em
 * wider than the face it makes it from, but which face it makes it from isn't known, as it drew Pacifico, which a document
 * embedded, in Office's own copy of it, whose letters are narrower (scripts/layout-probes/stops2/word-stops-office-fonts.ts
 * MB4). For the same reason, text in a font Office offers as a cloud font, such as Pacifico, is in a font whose widths
 * aren't known, for {@link OFFICE_COPY}, but for those of the width tables: measured from its file, it is a best guess.
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
    /**
     * How wide text with no tabs is in a face, in points: its glyphs, joined by the ligatures it has and kerned when it is
     * kerned, but for text with ligatures in a face Word kerns only without them. A character the face has no glyph for is
     * measured apart, by `fallback`, and parts the glyphs either side
     */
    const widthIn = (face: FontFace, text: string, font: TextFont): number => {
        const { size = DEFAULT_FONT_SIZE, characterSpacing = 0, scale = 100 } = font;
        const em = (size * scale) / 100;
        const kerned = isKerned(font) && (face.kernsWithLigatures || !hasLigatures(font));
        let width = 0;
        // eslint-disable-next-line functional/prefer-readonly-type
        let run: number[] = [];
        const measureRun = (): void => {
            const { glyphs } = hasLigatures(font) ? face.join(run, font.ligatures!) : { glyphs: run };
            for (const [index, glyph] of glyphs.entries()) {
                const next = glyphs[index + 1];
                const kern = kerned && next !== undefined ? face.kerningOfGlyphs(glyph, next) : 0;
                width += (face.advanceOfGlyph(glyph) + kern) * em;
            }
            width += characterSpacing * run.length;
            run = [];
        };
        for (const character of text) {
            const glyph = face.glyphOf(character.codePointAt(0)!);
            if (glyph !== 0) {
                // eslint-disable-next-line functional/immutable-data
                run.push(glyph);
                continue;
            }
            measureRun();
            // The layout stops at a character the font has no glyph for, unless it takes no room
            width += takesNoRoom(character) ? 0 : fallback.measureWidth(character, font);
        }
        measureRun();
        return width;
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
        // Superscript, subscript and small capitals take up the line of their run's size
        measureLineHeight: (font) => {
            const face = faceOf(font);
            return face ? face.lineHeight * (font.lineSize ?? font.size ?? DEFAULT_FONT_SIZE) : fallback.measureLineHeight(font);
        },
        measureDescent: (font) => {
            const face = faceOf(font);
            return face ? face.descent * (font.lineSize ?? font.size ?? DEFAULT_FONT_SIZE) : fallback.measureDescent(font);
        },
        // A font's file has the glyphs it draws text with, and the layout stops at one it doesn't
        measureTextHeight: (text, font) => (faceOf(font) ? undefined : fallback.measureTextHeight?.(text, font)),
        unknownCharacter: (text, font) => {
            const face = faceOf(font);
            return face
                ? [...text].find(
                      (character) =>
                          character !== "\t" && !takesNoRoom(character) && face.advanceOf(character.codePointAt(0)!) === undefined,
                  )
                : fallback.unknownCharacter?.(text, font);
        },
        unknownFont: (font, text) => {
            const face = faceOf(font);
            if (face === undefined) {
                return fallback.unknownFont?.(font, text) ?? false;
            }
            return offeredByOffice(face.name, text) ? OFFICE_COPY : false;
        },
        // Word kerns with the font's own pairs (word-fonts.docx F1 and F2), and joins letters with its ligatures, but for
        // substitutions other than ligatures, such as contextual ones, which aren't followed yet
        unknownShaping: (text, font) => {
            const face = faceOf(font);
            if (face === undefined) {
                return fallback.unknownShaping?.(text, font);
            }
            if (!hasLigatures(font)) {
                return undefined;
            }
            // The glyphs as they are joined when they are measured: apart either side of a tab, or of a character the face
            // has no glyph for
            // eslint-disable-next-line functional/prefer-readonly-type
            const runs: number[][] = [[]];
            for (const character of text) {
                const glyph = character === "\t" ? 0 : face.glyphOf(character.codePointAt(0)!);
                if (glyph === 0) {
                    // eslint-disable-next-line functional/immutable-data
                    runs.push([]);
                } else {
                    // eslint-disable-next-line functional/immutable-data
                    runs[runs.length - 1].push(glyph);
                }
            }
            return runs.some((run) => face.join(run, font.ligatures!).unknown)
                ? "ligatures of a font file of a kind not yet followed"
                : undefined;
        },
    };
};
