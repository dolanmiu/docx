/**
 * Builds small TrueType fonts for tests of the measuring of font files: just the tables that are read, with the
 * characters, widths and kerning a test gives.
 *
 * @module
 * @internal
 */
// cspell:ignore hhea hmtx cmap fsSelection ttcf GPOS DFLT cyrl

export type TestNameRecord = {
    readonly platform: number;
    readonly encoding: number;
    readonly language: number;
    readonly text: string;
};

/** How a pair adjustment's value records are written: which values they have, as in OpenType's ValueFormat */
export type TestValueFormats = { readonly first: number; readonly second: number };

/**
 * A subtable of a GPOS table's pair adjustments: of pairs of characters (format 1), or of classes of them (format 2),
 * with its coverage in format 1 or 2, and its classes too
 */
export type TestPairSubtable =
    | {
          readonly format: 1;
          readonly pairs: Readonly<Record<string, number>>;
          readonly coverage?: 1 | 2;
          readonly valueFormats?: TestValueFormats;
      }
    | {
          readonly format: 2;
          /** The characters it covers as first characters */
          readonly covered: string;
          readonly firstClasses: Readonly<Record<string, number>>;
          readonly secondClasses: Readonly<Record<string, number>>;
          /** The kerning of each class of first characters with each class of second characters */
          readonly values: readonly (readonly number[])[];
          readonly coverage?: 1 | 2;
          readonly classes?: 1 | 2;
          readonly valueFormats?: TestValueFormats;
      };

/** A lookup of a GPOS table: of pair adjustments, through an extension or not, or of another type, which isn't read */
export type TestLookup = {
    readonly subtables: readonly TestPairSubtable[];
    readonly extension?: boolean;
    /** Another type of lookup, which has one empty subtable */
    readonly type?: number;
};

export type TestGlyphPositioning = {
    /** The script its kern feature is for, or none */
    readonly script?: string | null;
    /** Whether the script's features are its default ones, or a language's */
    readonly defaultLanguage?: boolean;
    /** The lookups of its kern feature */
    readonly lookups: readonly TestLookup[];
};

export type TestFontOptions = {
    /** The font's family name, in English for Windows, or the name records to write */
    readonly name?: string | readonly TestNameRecord[];
    readonly unitsPerEm?: number;
    /** The width of each character, in font units. Each gets a glyph, in this order */
    readonly advances: Readonly<Record<string, number>>;
    /** The width of the glyph drawn for characters the font has no glyph for */
    readonly missingAdvance?: number;
    /** How many glyphs have widths of their own. The rest are as wide as the last of them, as a monospaced font's are */
    readonly metricCount?: number;
    readonly hhea?: { readonly ascender: number; readonly descender: number; readonly lineGap: number };
    /** The OS/2 table's ascent and descent for Windows, or false for a font without an OS/2 table */
    readonly windows?: { readonly ascent: number; readonly descent: number } | false;
    readonly bold?: boolean;
    readonly italic?: boolean;
    /** The OS/2 table's typographic ascent, descent and line gap, which it says to use for lines (USE_TYPO_METRICS) */
    readonly typographic?: { readonly ascent: number; readonly descent: number; readonly lineGap: number };
    /** The character map: of the whole of Unicode (format 12), of the characters to U+FFFF (format 4), both, or Mac's */
    readonly characterMap?: "full" | "basic" | "both" | "mac";
    /** Kerning of pairs of characters, in font units, in a kern table */
    readonly kerning?: Readonly<Record<string, number>>;
    /**
     * The kern table: Windows', with subtables of the pairs and others to skip, the same with the pairs in it twice, which
     * add up, or Apple's, which isn't read
     */
    readonly kernTable?: "windows" | "twice" | "apple";
    /** A GPOS table, with a kern feature of these lookups */
    readonly glyphPositioning?: TestGlyphPositioning;
    /** Tables to leave out */
    readonly without?: readonly string[];
};

type Table = { readonly tag: string; readonly bytes: Uint8Array };

/** Bytes written with a DataView */
const bytesOf = (length: number, write: (view: DataView) => void): Uint8Array => {
    const bytes = new Uint8Array(length);
    write(new DataView(bytes.buffer));
    return bytes;
};

const concat = (parts: readonly Uint8Array[]): Uint8Array => {
    const bytes = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
    parts.reduce((offset, part) => {
        bytes.set(part, offset);
        return offset + part.length;
    }, 0);
    return bytes;
};

const nameTable = (records: readonly TestNameRecord[]): Uint8Array => {
    const strings = records.map(({ platform, text }) =>
        platform === 1
            ? Uint8Array.from([...text].map((character) => character.charCodeAt(0)))
            : bytesOf(text.length * 2, (view) =>
                  [...text].forEach((character, index) => view.setUint16(index * 2, character.charCodeAt(0))),
              ),
    );
    const header = 6 + records.length * 12;
    const offsets = strings.map((_, index) => strings.slice(0, index).reduce((total, { length }) => total + length, 0));
    return concat([
        bytesOf(header, (view) => {
            view.setUint16(2, records.length);
            view.setUint16(4, header);
            records.forEach(({ platform, encoding, language }, index) => {
                const record = 6 + index * 12;
                view.setUint16(record, platform);
                view.setUint16(record + 2, encoding);
                view.setUint16(record + 4, language);
                view.setUint16(record + 6, 1);
                view.setUint16(record + 8, strings[index].length);
                view.setUint16(record + 10, offsets[index]);
            });
        }),
        ...strings,
    ]);
};

/**
 * A character map in format 4. Each character has a segment of its own, mapped by a delta or, every other one, through
 * the array of glyphs, and U+FFFE is in a segment that maps it to no glyph.
 */
const basicMap = (glyphs: readonly (readonly [number, number])[]): Uint8Array => {
    const segments = [...glyphs.map(([code, glyph]) => ({ code, glyph })), { code: 0xfffe, glyph: 0 }];
    const count = segments.length + 1;
    const throughArray = segments.map((_, index) => index % 2 === 1 || index === segments.length - 1);
    const arrayIndexes = throughArray.map((_, index) => throughArray.slice(0, index).filter(Boolean).length);
    const arrayLength = throughArray.filter(Boolean).length;
    return bytesOf(16 + count * 8 + arrayLength * 2, (view) => {
        view.setUint16(0, 4);
        view.setUint16(2, 16 + count * 8 + arrayLength * 2);
        view.setUint16(6, count * 2);
        const ends = 14;
        const starts = ends + count * 2 + 2;
        const deltas = starts + count * 2;
        const rangeOffsets = deltas + count * 2;
        const array = rangeOffsets + count * 2;
        segments.forEach(({ code, glyph }, index) => {
            view.setUint16(ends + index * 2, code);
            view.setUint16(starts + index * 2, code);
            if (throughArray[index]) {
                view.setUint16(rangeOffsets + index * 2, (count - index) * 2 + arrayIndexes[index] * 2);
                view.setUint16(array + arrayIndexes[index] * 2, glyph);
                view.setUint16(deltas + index * 2, 0);
            } else {
                view.setUint16(deltas + index * 2, (glyph - code + 0x10000) % 0x10000);
            }
        });
        // The last segment, which every map in format 4 ends with, maps U+FFFF to no glyph
        view.setUint16(ends + (count - 1) * 2, 0xffff);
        view.setUint16(starts + (count - 1) * 2, 0xffff);
        view.setUint16(deltas + (count - 1) * 2, 1);
    });
};

/** A character map in format 12 */
const fullMap = (glyphs: readonly (readonly [number, number])[]): Uint8Array =>
    bytesOf(16 + glyphs.length * 12, (view) => {
        view.setUint16(0, 12);
        view.setUint32(4, 16 + glyphs.length * 12);
        view.setUint32(12, glyphs.length);
        glyphs.forEach(([code, glyph], index) => {
            view.setUint32(16 + index * 12, code);
            view.setUint32(20 + index * 12, code);
            view.setUint32(24 + index * 12, glyph);
        });
    });

const characterMapTable = (
    glyphs: readonly (readonly [number, number])[],
    kind: NonNullable<TestFontOptions["characterMap"]>,
): Uint8Array => {
    const subtables: readonly (readonly [number, number, Uint8Array])[] =
        kind === "full"
            ? [[3, 10, fullMap(glyphs)]]
            : kind === "basic"
              ? [[3, 1, basicMap(glyphs)]]
              : kind === "both"
                ? [
                      [0, 3, basicMap(glyphs.map(([code]) => [code, 0]))],
                      [3, 10, fullMap(glyphs)],
                  ]
                : [
                      [1, 0, basicMap(glyphs)],
                      [3, 0, basicMap(glyphs)],
                  ];
    const header = 4 + subtables.length * 8;
    const offsets = subtables.map((_, index) => header + subtables.slice(0, index).reduce((total, [, , bytes]) => total + bytes.length, 0));
    return concat([
        bytesOf(header, (view) => {
            view.setUint16(2, subtables.length);
            subtables.forEach(([platform, encoding], index) => {
                view.setUint16(4 + index * 8, platform);
                view.setUint16(6 + index * 8, encoding);
                view.setUint32(8 + index * 8, offsets[index]);
            });
        }),
        ...subtables.map(([, , bytes]) => bytes),
    ]);
};

/**
 * Windows' kern table: a subtable of the pairs with a length too short for it, as long subtables have, subtables of
 * cross-stream kerning and in format 2 to skip, and a subtable of the pairs again, or of none.
 */
const kernTable = (pairs: readonly (readonly [number, number, number])[], twice: boolean): Uint8Array => {
    const subtable = (coverage: number, entries: readonly (readonly [number, number, number])[], length: number): Uint8Array =>
        bytesOf(14 + entries.length * 6, (view) => {
            view.setUint16(2, length);
            view.setUint16(4, coverage);
            view.setUint16(6, entries.length);
            entries.forEach(([left, right, value], index) => {
                view.setUint16(14 + index * 6, left);
                view.setUint16(16 + index * 6, right);
                view.setInt16(18 + index * 6, value);
            });
        });
    return concat([
        bytesOf(4, (view) => view.setUint16(2, 4)),
        subtable(0x0001, pairs, 6),
        subtable(0x0005, pairs, 14 + pairs.length * 6),
        subtable(0x0201, pairs, 14 + pairs.length * 6),
        subtable(0x0001, twice ? pairs : [], 14 + (twice ? pairs.length : 0) * 6),
    ]);
};

/**
 * Bytes of a header followed by its parts, with the offset of each part from the header's start written where
 * `offsetAt` says.
 */
const withParts = (header: Uint8Array, parts: readonly Uint8Array[], offsetAt: (index: number) => number): Uint8Array => {
    const view = new DataView(header.buffer);
    parts.reduce((offset, part, index) => {
        view.setUint16(offsetAt(index), offset);
        return offset + part.length;
    }, header.length);
    return concat([header, ...parts]);
};

const uint16s = (values: readonly number[]): Uint8Array =>
    bytesOf(values.length * 2, (view) => values.forEach((value, index) => view.setUint16(index * 2, value)));

/** Glyphs in runs of glyphs that follow each other, and the value each run has */
const runsOf = (glyphs: readonly (readonly [number, number])[]): readonly (readonly [number, number, number])[] =>
    [...glyphs]
        .sort(([one], [other]) => one - other)
        .reduce<readonly (readonly [number, number, number])[]>((runs, [glyph, value]) => {
            const last = runs[runs.length - 1];
            return last && last[1] === glyph - 1 && last[2] === value
                ? [...runs.slice(0, -1), [last[0], glyph, value]]
                : [...runs, [glyph, glyph, value]];
        }, []);

const coverageTable = (glyphs: readonly number[], format: 1 | 2): Uint8Array => {
    const sorted = [...glyphs].sort((one, other) => one - other);
    if (format === 1) {
        return uint16s([1, sorted.length, ...sorted]);
    }
    // Ranges of glyphs that follow each other, with the index of each range's first glyph
    const ranges = runsOf(sorted.map((glyph) => [glyph, 0]));
    return uint16s([2, ranges.length, ...ranges.flatMap(([start, end]) => [start, end, sorted.indexOf(start)])]);
};

const classTable = (classes: readonly (readonly [number, number])[], format: 1 | 2): Uint8Array => {
    if (format === 1) {
        const first = Math.min(...classes.map(([glyph]) => glyph));
        const last = Math.max(...classes.map(([glyph]) => glyph));
        const byGlyph = new Map(classes);
        return uint16s([
            1,
            first,
            last - first + 1,
            ...Array.from({ length: last - first + 1 }, (_, index) => byGlyph.get(first + index) ?? 0),
        ]);
    }
    const ranges = runsOf(classes);
    return uint16s([2, ranges.length, ...ranges.flat()]);
};

/** A value record with the kerning as its XAdvance, and 999 for its other values, which aren't read */
const valueRecord = (format: number, kerning: number): readonly number[] =>
    [1, 2, 4, 8, 16, 32, 64, 128]
        .filter((flag) => Math.floor(format / flag) % 2 === 1)
        .map((flag) => (flag === 4 ? (kerning + 0x10000) % 0x10000 : 999));

const pairSubtable = (subtable: TestPairSubtable, glyphOf: (character: string) => number): Uint8Array => {
    const { first, second } = subtable.valueFormats ?? { first: 4, second: 0 };
    // The kerning goes in the first value record when it has an XAdvance, and in the second otherwise
    const values = (kerning: number): readonly number[] =>
        Math.floor(first / 4) % 2 === 1
            ? [...valueRecord(first, kerning), ...valueRecord(second, 0)]
            : [...valueRecord(first, 0), ...valueRecord(second, kerning)];
    if (subtable.format === 1) {
        const entries = Object.entries(subtable.pairs).map(([pair, kerning]) => [...[...pair].map(glyphOf), kerning] as const);
        const byFirst = new Map(
            entries.map(([left]) => [
                left,
                entries.filter(([other]) => other === left).map(([, right, kerning]) => [right, kerning] as const),
            ]),
        );
        const firsts = [...byFirst.keys()].sort((one, other) => one - other);
        const sets = firsts.map((left) => {
            const pairs = [...byFirst.get(left)!].sort(([one], [other]) => one - other);
            return uint16s([pairs.length, ...pairs.flatMap(([right, kerning]) => [right, ...values(kerning)])]);
        });
        return withParts(
            uint16s([1, 0, first, second, sets.length, ...sets.map(() => 0)]),
            [...sets, coverageTable(firsts, subtable.coverage ?? 1)],
            (index) => (index < sets.length ? 10 + index * 2 : 2),
        );
    }
    const classes = (record: Readonly<Record<string, number>>): readonly (readonly [number, number])[] =>
        Object.entries(record).map(([character, value]) => [glyphOf(character), value]);
    const header = uint16s([
        2,
        0,
        first,
        second,
        0,
        0,
        subtable.values.length,
        subtable.values[0].length,
        ...subtable.values.flatMap((row) => row.flatMap(values)),
    ]);
    return withParts(
        header,
        [
            coverageTable([...subtable.covered].map(glyphOf), subtable.coverage ?? 1),
            classTable(classes(subtable.firstClasses), subtable.classes ?? 1),
            classTable(classes(subtable.secondClasses), subtable.classes ?? 1),
        ],
        (index) => [2, 8, 10][index],
    );
};

const lookupTable = (lookup: TestLookup, glyphOf: (character: string) => number): Uint8Array => {
    const type = lookup.type ?? 2;
    const subtables = type === 2 ? lookup.subtables.map((subtable) => pairSubtable(subtable, glyphOf)) : [uint16s([1, 0])];
    const header = uint16s([lookup.extension ? 9 : type, 0, subtables.length, ...subtables.map(() => 0)]);
    const parts = lookup.extension
        ? // An extension subtable points to its subtable with an offset in 32 bits, from its own start
          subtables.map((subtable) =>
              concat([
                  bytesOf(8, (view) => {
                      view.setUint16(0, 1);
                      view.setUint16(2, type);
                      view.setUint32(4, 8);
                  }),
                  subtable,
              ]),
          )
        : subtables;
    return withParts(header, parts, (index) => 6 + index * 2);
};

/** A GPOS table whose script has a kern feature of the lookups given, and a mark feature, which isn't read */
const glyphPositioningTable = (
    { script = "latn", defaultLanguage = true, lookups }: TestGlyphPositioning,
    glyphOf: (character: string) => number,
): Uint8Array => {
    const tag = (value: string): readonly number[] => [
        value.charCodeAt(0) * 256 + value.charCodeAt(1),
        value.charCodeAt(2) * 256 + value.charCodeAt(3),
    ];
    const language = uint16s([0, 0xffff, 2, 1, 0]);
    const scriptTable = defaultLanguage
        ? withParts(uint16s([0, 0]), [language], () => 0)
        : withParts(uint16s([0, 1, ...tag("ENG "), 0]), [language], () => 8);
    const scriptList = script === null ? uint16s([0]) : withParts(uint16s([1, ...tag(script), 0]), [scriptTable], () => 6);
    const features = [uint16s([0, 1, 0]), uint16s([0, lookups.length, ...lookups.map((_, index) => index)])];
    const featureList = withParts(uint16s([2, ...tag("mark"), 0, ...tag("kern"), 0]), features, (index) => 6 + index * 6);
    const lookupTables = lookups.map((lookup) => lookupTable(lookup, glyphOf));
    const lookupList = withParts(uint16s([lookupTables.length, ...lookupTables.map(() => 0)]), lookupTables, (index) => 2 + index * 2);
    return withParts(uint16s([1, 0, 0, 0, 0]), [scriptList, featureList, lookupList], (index) => 4 + index * 2);
};

const tablesOf = (options: TestFontOptions): readonly Table[] => {
    const {
        name = "Probe Sans",
        unitsPerEm = 1000,
        advances,
        missingAdvance = 500,
        hhea = { ascender: 800, descender: -200, lineGap: 0 },
        windows = { ascent: 800, descent: 200 },
        typographic,
        bold = false,
        italic = false,
        characterMap = "basic",
        kerning = {},
        kernTable: kernKind = "windows",
    } = options;
    const characters = Object.keys(advances);
    // Character maps are in the order of the characters
    const glyphs = characters
        .map((character, index) => [character.codePointAt(0)!, index + 1] as const)
        .sort(([one], [other]) => one - other);
    const glyphOf = new Map(glyphs);
    const widths = [missingAdvance, ...Object.values(advances)];
    const metricCount = options.metricCount ?? widths.length;
    const names: readonly TestNameRecord[] = typeof name === "string" ? [{ platform: 3, encoding: 1, language: 0x409, text: name }] : name;
    const pairs = Object.entries(kerning).map(([pair, value]) => {
        const [left, right] = [...pair].map((character) => glyphOf.get(character.codePointAt(0)!)!);
        return [left, right, value] as const;
    });
    const tables: readonly Table[] = [
        {
            tag: "head",
            bytes: bytesOf(54, (view) => {
                view.setUint16(18, unitsPerEm);
                view.setUint16(44, (bold ? 1 : 0) + (italic ? 2 : 0));
            }),
        },
        {
            tag: "hhea",
            bytes: bytesOf(36, (view) => {
                view.setInt16(4, hhea.ascender);
                view.setInt16(6, hhea.descender);
                view.setInt16(8, hhea.lineGap);
                view.setUint16(34, metricCount);
            }),
        },
        {
            tag: "hmtx",
            bytes: bytesOf(metricCount * 4, (view) =>
                widths.slice(0, metricCount).forEach((width, index) => view.setUint16(index * 4, width)),
            ),
        },
        { tag: "cmap", bytes: characterMapTable(glyphs, characterMap) },
        { tag: "name", bytes: nameTable(names) },
        {
            tag: "kern",
            bytes: kernKind === "apple" ? bytesOf(8, (view) => view.setUint32(0, 0x00010000)) : kernTable(pairs, kernKind === "twice"),
        },
        ...(windows === false
            ? []
            : [
                  {
                      tag: "OS/2",
                      bytes: bytesOf(78, (view) => {
                          view.setUint16(62, (bold ? 0x20 : 0) + (italic ? 1 : 0) + (typographic ? 0x80 : 0));
                          view.setInt16(68, typographic?.ascent ?? 0);
                          view.setInt16(70, -(typographic?.descent ?? 0));
                          view.setInt16(72, typographic?.lineGap ?? 0);
                          view.setUint16(74, windows.ascent);
                          view.setUint16(76, windows.descent);
                      }),
                  },
              ]),
        ...(options.glyphPositioning
            ? [
                  {
                      tag: "GPOS",
                      bytes: glyphPositioningTable(options.glyphPositioning, (character) => glyphOf.get(character.codePointAt(0)!)!),
                  },
              ]
            : []),
    ];
    return tables.filter(({ tag }) => !(options.without ?? []).includes(tag));
};

/** A font's bytes, with its tables' offsets counted from `base`, where it starts in its file */
const fontBytes = (options: TestFontOptions, base: number): Uint8Array => {
    const tables = tablesOf(options);
    const header = 12 + tables.length * 16;
    const offsets = tables.map((_, index) => header + tables.slice(0, index).reduce((total, { bytes }) => total + bytes.length, 0));
    return concat([
        bytesOf(header, (view) => {
            view.setUint32(0, 0x00010000);
            view.setUint16(4, tables.length);
            tables.forEach(({ tag }, index) => {
                const record = 12 + index * 16;
                [...tag].forEach((character, position) => view.setUint8(record + position, character.charCodeAt(0)));
                view.setUint32(record + 8, base + offsets[index]);
                view.setUint32(record + 12, tables[index].bytes.length);
            });
        }),
        ...tables.map(({ bytes }) => bytes),
    ]);
};

/**
 * A TrueType font with the characters, widths and kerning given.
 */
export const buildTestFont = (options: TestFontOptions): Uint8Array => fontBytes(options, 0);

/**
 * A collection of TrueType fonts (`.ttc`).
 */
export const buildTestFontCollection = (fonts: readonly TestFontOptions[]): Uint8Array => {
    const header = 12 + fonts.length * 4;
    const sizes = fonts.map((options) => fontBytes(options, 0).length);
    const starts = sizes.map((_, index) => header + sizes.slice(0, index).reduce((total, size) => total + size, 0));
    return concat([
        bytesOf(header, (view) => {
            view.setUint32(0, 0x74746366);
            view.setUint32(4, 0x00010000);
            view.setUint32(8, fonts.length);
            starts.forEach((start, index) => view.setUint32(12 + index * 4, start));
        }),
        ...fonts.map((options, index) => fontBytes(options, starts[index])),
    ]);
};
