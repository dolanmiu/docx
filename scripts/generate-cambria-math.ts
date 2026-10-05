/**
 * Generates src/layout/cambria-math.ts: what of Cambria Math, the font Word lays out equations in, Word's maths layout
 * needs. From the font's own file, which Word installs: each glyph's width and the bottom and top of its ink, the glyphs
 * of each character, and of its OpenType MATH table, the constants Word builds equations up by, each glyph's italic
 * correction, its kerning beside scripts, the smaller glyphs of scripts (`ssty`), and the
 * taller and wider glyphs of brackets, roots, sums and braces. Word's PDFs of scripts/layout-probes/word-stops-equations.ts
 * show it uses them: each glyph Word drew is one of the font's, and where it drew them is where these put them.
 *
 * Only the characters of the blocks equations are written in are kept: Latin, Greek, the accents, punctuation, letterlike
 * symbols, arrows, the mathematical operators and symbols, and the mathematical alphanumerics, with the glyphs they lead
 * to. Lengths are in the font's units, 2048 to the em.
 *
 * Usage:
 *   npm run run-ts -- scripts/generate-cambria-math.ts ["/Applications/Microsoft Word.app/Contents/Resources/DFonts/Cambria.ttc"]
 */
// cspell:ignore ssty ttcf hmtx hhea maxp loca glyf cmap DFonts GSUB gsub
import { readFileSync, writeFileSync } from "node:fs";

const OUTPUT = "src/layout/cambria-math.ts";
const DEFAULT_PATH = "/Applications/Microsoft Word.app/Contents/Resources/DFonts/Cambria.ttc";

// The blocks of characters kept
const BLOCKS: readonly (readonly [number, number])[] = [
    [0x20, 0x7e],
    [0xa0, 0xff],
    [0x300, 0x36f],
    [0x391, 0x3f6],
    [0x2000, 0x206f],
    [0x20d0, 0x20ff],
    [0x2100, 0x214f],
    [0x2190, 0x21ff],
    [0x2200, 0x22ff],
    [0x2300, 0x23ff],
    [0x25a0, 0x25ff],
    [0x27c0, 0x27ff],
    [0x2980, 0x29ff],
    [0x2a00, 0x2aff],
    // The mathematical alphanumerics Word draws in: bold, italic and bold italic, script, fraktur and double-struck letters,
    // bold, italic and bold italic Greek, and bold and double-struck digits
    [0x1d400, 0x1d4cf],
    [0x1d504, 0x1d56b],
    [0x1d6a8, 0x1d74f],
    [0x1d7ce, 0x1d7e1],
];

// The MATH table's constants, in the order the table has them: the first two are percentages, the next two whole numbers,
// and the rest values with device tables, of which only the value is read
const CONSTANTS = [
    "scriptPercentScaleDown",
    "scriptScriptPercentScaleDown",
    "delimitedSubFormulaMinHeight",
    "displayOperatorMinHeight",
    "mathLeading",
    "axisHeight",
    "accentBaseHeight",
    "flattenedAccentBaseHeight",
    "subscriptShiftDown",
    "subscriptTopMax",
    "subscriptBaselineDropMin",
    "superscriptShiftUp",
    "superscriptShiftUpCramped",
    "superscriptBottomMin",
    "superscriptBaselineDropMax",
    "subSuperscriptGapMin",
    "superscriptBottomMaxWithSubscript",
    "spaceAfterScript",
    "upperLimitGapMin",
    "upperLimitBaselineRiseMin",
    "lowerLimitGapMin",
    "lowerLimitBaselineDropMin",
    "stackTopShiftUp",
    "stackTopDisplayStyleShiftUp",
    "stackBottomShiftDown",
    "stackBottomDisplayStyleShiftDown",
    "stackGapMin",
    "stackDisplayStyleGapMin",
    "stretchStackTopShiftUp",
    "stretchStackBottomShiftDown",
    "stretchStackGapAboveMin",
    "stretchStackGapBelowMin",
    "fractionNumeratorShiftUp",
    "fractionNumeratorDisplayStyleShiftUp",
    "fractionDenominatorShiftDown",
    "fractionDenominatorDisplayStyleShiftDown",
    "fractionNumeratorGapMin",
    "fractionNumDisplayStyleGapMin",
    "fractionRuleThickness",
    "fractionDenominatorGapMin",
    "fractionDenomDisplayStyleGapMin",
    "skewedFractionHorizontalGap",
    "skewedFractionVerticalGap",
    "overbarVerticalGap",
    "overbarRuleThickness",
    "overbarExtraAscender",
    "underbarVerticalGap",
    "underbarRuleThickness",
    "underbarExtraDescender",
    "radicalVerticalGap",
    "radicalDisplayStyleVerticalGap",
    "radicalRuleThickness",
    "radicalExtraAscender",
    "radicalKernBeforeDegree",
    "radicalKernAfterDegree",
    "radicalDegreeBottomRaisePercent",
] as const;

const path = process.argv[2] ?? DEFAULT_PATH;
const bytes = readFileSync(path);
const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const u16 = (offset: number): number => view.getUint16(offset);
const i16 = (offset: number): number => view.getInt16(offset);
const u32 = (offset: number): number => view.getUint32(offset);
const tag = (offset: number): string => String.fromCharCode(...[0, 1, 2, 3].map((index) => view.getUint8(offset + index)));

/** Where each table of the font at an offset starts */
const tablesOf = (offset: number): ReadonlyMap<string, number> =>
    new Map(Array.from({ length: u16(offset + 4) }, (_, index) => [tag(offset + 12 + index * 16), u32(offset + 12 + index * 16 + 8)]));

/** The font's full name (name 4), in English */
const fullName = (tables: ReadonlyMap<string, number>): string => {
    const table = tables.get("name")!;
    const strings = table + u16(table + 4);
    for (let index = 0; index < u16(table + 2); index++) {
        const record = table + 6 + index * 12;
        if (u16(record) === 3 && u16(record + 6) === 4) {
            const start = strings + u16(record + 10);
            return Array.from({ length: u16(record + 8) / 2 }, (_, at) => String.fromCharCode(u16(start + at * 2))).join("");
        }
    }
    return "";
};

const faces = tag(0) === "ttcf" ? Array.from({ length: u32(8) }, (_, index) => u32(12 + index * 4)) : [0];
const tables = faces.map(tablesOf).find((found) => fullName(found) === "Cambria Math");
if (tables === undefined) {
    console.error(`No Cambria Math in ${path}`);
    process.exit(2);
}
const table = (name: string): number => tables.get(name)!;

// Each glyph's advance
const glyphCount = u16(table("maxp") + 4);
const metricCount = u16(table("hhea") + 34);
const advanceOf = (glyph: number): number => u16(table("hmtx") + Math.min(glyph, metricCount - 1) * 4);

// Each glyph's ink, from the glyph's own bounds, which a composite glyph has too
const longOffsets = i16(table("head") + 50) === 1;
const inkOf = (glyph: number): readonly [number, number] => {
    const loca = table("loca");
    const start = longOffsets ? u32(loca + glyph * 4) : u16(loca + glyph * 2) * 2;
    const end = longOffsets ? u32(loca + glyph * 4 + 4) : u16(loca + glyph * 2 + 2) * 2;
    if (end === start) {
        return [0, 0];
    }
    const glyf = table("glyf") + start;
    return [i16(glyf + 4), i16(glyf + 8)];
};

// The characters' glyphs, from the cmap's table of all of Unicode (format 12)
const characters = new Map<number, number>();
{
    const cmap = table("cmap");
    const subtables = Array.from({ length: u16(cmap + 2) }, (_, index) => cmap + u32(cmap + 4 + index * 8 + 4));
    const full = subtables.find((subtable) => u16(subtable) === 12)!;
    for (let index = 0; index < u32(full + 12); index++) {
        const group = full + 16 + index * 12;
        for (let code = u32(group); code <= u32(group + 4); code++) {
            characters.set(code, u32(group + 8) + code - u32(group));
        }
    }
}

/** The glyphs of a Coverage table */
const coverage = (offset: number): readonly number[] => {
    if (u16(offset) === 1) {
        return Array.from({ length: u16(offset + 2) }, (_, index) => u16(offset + 4 + index * 2));
    }
    return Array.from({ length: u16(offset + 2) }, (_, index) => offset + 4 + index * 6).flatMap((range) =>
        Array.from({ length: u16(range + 2) - u16(range) + 1 }, (_, at) => u16(range) + at),
    );
};

// The MATH table
const math = table("MATH");
const constantsAt = math + u16(math + 4);
const constants = Object.fromEntries(
    CONSTANTS.map((name, index) => [
        name,
        // Four numbers of two bytes, then values with device tables of four, then the last percentage
        index < 2 ? i16(constantsAt + index * 2) : index < 4 ? u16(constantsAt + index * 2) : i16(constantsAt + 8 + (index - 4) * 4),
    ]),
);
const glyphInfo = math + u16(math + 6);
/** A table of a value, with its device table, for each glyph of a coverage */
const valuesOf = (offset: number): ReadonlyMap<number, number> => {
    const glyphs = coverage(offset + u16(offset));
    return new Map(glyphs.map((glyph, index) => [glyph, i16(offset + 4 + index * 4)]));
};
const italics = valuesOf(glyphInfo + u16(glyphInfo));
const extended = new Set(u16(glyphInfo + 4) === 0 ? [] : coverage(glyphInfo + u16(glyphInfo + 4)));
type Kern = readonly [readonly number[], readonly number[]];
const kerns = new Map<number, readonly (Kern | undefined)[]>();
{
    const info = glyphInfo + u16(glyphInfo + 6);
    const glyphs = coverage(info + u16(info));
    const kernAt = (offset: number): Kern => {
        const count = u16(offset);
        return [
            Array.from({ length: count }, (_, index) => i16(offset + 2 + index * 4)),
            Array.from({ length: count + 1 }, (_, index) => i16(offset + 2 + count * 4 + index * 4)),
        ];
    };
    glyphs.forEach((glyph, index) => {
        const record = info + 4 + index * 8;
        // Top right, top left, bottom right, bottom left
        kerns.set(
            glyph,
            [0, 1, 2, 3].map((corner) => (u16(record + corner * 2) === 0 ? undefined : kernAt(info + u16(record + corner * 2)))),
        );
    });
}
const variantsAt = math + u16(math + 8);
const minConnectorOverlap = u16(variantsAt);
type Part = readonly [number, number, number, number, boolean];
/** Each glyph's variants, [glyph, advance measurement], and its assembly's parts, for the vertical or horizontal ones */
const constructions = (
    vertical: boolean,
): ReadonlyMap<number, { variants: readonly (readonly [number, number])[]; parts?: readonly Part[] }> => {
    const coverageAt = u16(variantsAt + (vertical ? 2 : 4));
    const count = u16(variantsAt + (vertical ? 6 : 8));
    const glyphs = coverageAt === 0 ? [] : coverage(variantsAt + coverageAt);
    const before = vertical ? 0 : u16(variantsAt + 6);
    return new Map(
        glyphs.slice(0, count).map((glyph, index) => {
            const construction = variantsAt + u16(variantsAt + 10 + (before + index) * 2);
            const assemblyAt = u16(construction);
            const variants = Array.from(
                { length: u16(construction + 2) },
                (_, at) => [u16(construction + 4 + at * 4), u16(construction + 6 + at * 4)] as const,
            );
            if (assemblyAt === 0) {
                return [glyph, { variants }] as const;
            }
            const assembly = construction + assemblyAt;
            const parts = Array.from({ length: u16(assembly + 4) }, (_, at): Part => {
                const part = assembly + 6 + at * 10;
                return [u16(part), u16(part + 2), u16(part + 4), u16(part + 6), (u16(part + 8) & 1) === 1];
            });
            return [glyph, { variants, parts }] as const;
        }),
    );
};
const vertical = constructions(true);
const horizontal = constructions(false);

// The smaller glyphs of scripts: the alternates of the GSUB table's ssty feature
const scripts = new Map<number, readonly number[]>();
{
    const gsub = table("GSUB");
    const features = gsub + u16(gsub + 6);
    const lookups = gsub + u16(gsub + 8);
    for (let index = 0; index < u16(features); index++) {
        const record = features + 2 + index * 6;
        if (tag(record) !== "ssty") {
            continue;
        }
        const feature = features + u16(record + 4);
        for (let at = 0; at < u16(feature + 2); at++) {
            const lookup = lookups + u16(lookups + 2 + u16(feature + 4 + at * 2) * 2);
            for (let sub = 0; sub < u16(lookup + 4); sub++) {
                let subtable = lookup + u16(lookup + 6 + sub * 2);
                if (u16(lookup) === 7) {
                    subtable += u32(subtable + 4);
                }
                const glyphs = coverage(subtable + u16(subtable + 2));
                glyphs.forEach((glyph, which) => {
                    const set = subtable + u16(subtable + 6 + which * 2);
                    scripts.set(
                        glyph,
                        Array.from({ length: u16(set) }, (_, alternate) => u16(set + 2 + alternate * 2)),
                    );
                });
            }
        }
    }
}

// The characters kept, and the glyphs they lead to
const kept = [...characters]
    .filter(([code]) => BLOCKS.some(([first, last]) => code >= first && code <= last))
    .sort(([one], [other]) => one - other);
const glyphs = new Set(kept.map(([, glyph]) => glyph));
for (const glyph of [...glyphs]) {
    for (const alternate of scripts.get(glyph) ?? []) {
        glyphs.add(alternate);
    }
}
for (const glyph of [...glyphs]) {
    for (const found of [vertical.get(glyph), horizontal.get(glyph)]) {
        for (const [variant] of found?.variants ?? []) {
            glyphs.add(variant);
        }
        for (const [part] of found?.parts ?? []) {
            glyphs.add(part);
        }
    }
}
const ordered = [...glyphs].sort((one, other) => one - other);
if (ordered.some((glyph) => glyph >= glyphCount)) {
    throw new Error("A glyph past the font's end");
}

// The characters as runs of code points whose glyphs follow on from each other: [first code point, its glyph, how many]
const runs: [number, number, number][] = [];
for (const [code, glyph] of kept) {
    const last = runs.at(-1);
    if (last !== undefined && code === last[0] + last[2] && glyph === last[1] + last[2]) {
        last[2] += 1;
    } else {
        runs.push([code, glyph, 1]);
    }
}

const list = (values: readonly unknown[]): string =>
    `[${values.map((value) => (Array.isArray(value) ? list(value) : String(value))).join(", ")}]`;
const lines = (entries: readonly string[]): string => entries.map((entry) => `    ${entry},`).join("\n");
const keptOnly = <T>(map: ReadonlyMap<number, T>): readonly (readonly [number, T])[] =>
    [...map].filter(([glyph]) => glyphs.has(glyph)).sort(([one], [other]) => one - other);

const output = `/**
 * What of Cambria Math, the font Word lays out equations in, Word's maths layout needs, in the font's units, 2048 to the
 * em: each glyph's width and the bottom and top of its ink, the glyph of each character, and of the font's OpenType MATH
 * table, the constants Word builds equations up by, each glyph's italic correction, its kerning beside scripts, the
 * smaller glyphs of scripts, and the taller and wider glyphs of brackets, roots, sums and braces. Glyphs are by their
 * number in the font.
 *
 * Generated by scripts/generate-cambria-math.ts from Word's own copy of the font. Do not edit by hand.
 *
 * @module
 */
// cspell:disable

/** The MATH table's constants, in the font's units, but for the percentages */
export const MATH_CONSTANTS = {
${Object.entries(constants)
    .map(([name, value]) => `    ${name}: ${value},`)
    .join("\n")}
} as const;

/** The least the parts of a glyph made of parts overlap where they join */
export const MIN_CONNECTOR_OVERLAP = ${minConnectorOverlap};

/** The glyph of each character, as runs of characters whose glyphs follow on from each other: [first character, its glyph, how many] */
export const CHARACTER_RUNS: readonly (readonly [number, number, number])[] = [
${lines(runs.map((run) => list(run)))}
];

/** Each glyph's width, and the bottom and top of its ink: [width, bottom, top] */
export const GLYPH_METRICS: ReadonlyMap<number, readonly [number, number, number]> = new Map([
${lines(ordered.map((glyph) => list([glyph, [advanceOf(glyph), ...inkOf(glyph)]])))}
]);

/** The italic correction of each glyph that has one */
export const ITALIC_CORRECTIONS: ReadonlyMap<number, number> = new Map([
${lines(keptOnly(italics).map((entry) => list(entry)))}
]);

/** The glyphs that are shapes grown to a size, such as a tall integral, which scripts are put beside as beside a box */
export const EXTENDED_SHAPES: ReadonlySet<number> = new Set(${list(ordered.filter((glyph) => extended.has(glyph)))});

/**
 * How a glyph is kerned at its corners beside a script, at heights: [heights, kerning below the first height, between each
 * two, and above the last], for its top right, top left, bottom right and bottom left
 */
export const MATH_KERNS: ReadonlyMap<number, readonly (readonly [readonly number[], readonly number[]] | null)[]> = new Map([
${lines(
    keptOnly(kerns)
        .filter(([, corners]) => corners.some((corner) => corner !== undefined))
        .map(([glyph, corners]) => list([glyph, corners.map((corner) => (corner === undefined ? "null" : list(corner)))])),
)}
]);

/** The smaller glyphs a glyph is drawn as in a script, and in a script's script */
export const SCRIPT_GLYPHS: ReadonlyMap<number, readonly number[]> = new Map([
${lines(keptOnly(scripts).map(([glyph, alternates]) => list([glyph, alternates])))}
]);

/** The taller glyphs of a glyph, smallest first: [glyph, how tall] */
export const VERTICAL_VARIANTS: ReadonlyMap<number, readonly (readonly [number, number])[]> = new Map([
${lines(keptOnly(vertical).map(([glyph, { variants }]) => list([glyph, variants])))}
]);

/** The wider glyphs of a glyph, narrowest first: [glyph, how wide] */
export const HORIZONTAL_VARIANTS: ReadonlyMap<number, readonly (readonly [number, number])[]> = new Map([
${lines(keptOnly(horizontal).map(([glyph, { variants }]) => list([glyph, variants])))}
]);

/**
 * The parts a glyph wider than its widest variant is made of, left to right: [glyph, how far it joins the part before, how
 * far it joins the part after, its width, whether it is repeated to make it wider]
 */
export const HORIZONTAL_ASSEMBLIES: ReadonlyMap<number, readonly (readonly [number, number, number, number, boolean])[]> = new Map([
${lines(
    keptOnly(horizontal)
        .filter(([, { parts }]) => parts !== undefined)
        .map(([glyph, { parts }]) => list([glyph, parts!])),
)}
]);
`;
writeFileSync(OUTPUT, output);
console.log(`Wrote ${kept.length} characters and ${ordered.length} glyphs to ${OUTPUT}`);
