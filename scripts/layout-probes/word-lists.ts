/**
 * Probes of how Word numbers and places list numbers where `word-watertight-text.docx` TX21 didn't show it: where the
 * text after a right-aligned or centred number goes when the number is wider than the room before the tab stop, which
 * TX21's short numbers never were; how Word counts lists that share a definition (`w:abstractNum`), and starts them again
 * with `w:lvlOverride`; when a level starts again (`w:lvlRestart`), legal numbering (`w:isLgl`), and the number of a level
 * not used yet; and which formatting the number takes, its paragraph mark's or its text's. Each line's text names its
 * probe. Calibri 11 on A4 with 1440 margins, single spaced, no space before or after, so the text is 9026 twips wide.
 * word-lists.py reads it.
 *
 * LJ: a number 1085 twips wide ("Paragraph1." in Calibri 11), followed by 40 words, so the first line's last word says
 *     where the text after the number starts. Unless given, the first line starts at 1440 and the others at 1800, so the
 *     hanging indent's stop is at 1800. Left-aligned, the number would end at 2525, past that stop
 *   LJ1: right-aligned, then a tab. LJ2: centred, then a tab. LJ3: left-aligned, then a tab, as before
 *   LJ4: right-aligned, then a space. LJ5: centred, then nothing, and text that starts with a space
 *   LJ6: right-aligned, then a tab, with no hanging indent: the first line starts at 1440 too
 *   LJ7: right-aligned, then a tab, its first line at 0, so the number would start 1085 into the left margin. LJ8: the same
 *        centred. LJ9: as LJ7, in a table cell
 *   LJ10: left-aligned, as docx writes a list's numbers by default, in a right-to-left paragraph (`w:bidi`). LJ11: the same
 *         right-aligned
 * LO: lists that share a definition, each numbered "%1." (and "%1.%2." at level 1) from 1, in the order the letters give
 *   LO1: two lists, neither starting again (`w:num` with no `w:lvlOverride`): A A B B A
 *   LO2: A, and B starting again at 1 (`w:startOverride` at level 0): A A B B A A B
 *   LO3: two lists each starting again at 1, as docx writes each `instance` of a list: A A B B B A A
 *   LO4: a list starting again at 5, in a definition that starts at 1: A A
 *   LO5: as LO3, at two levels: A at levels 0, 1, 1, then B at levels 1, 1, 0, 1
 *   LO6: A, and B starting again at 4 at level 1 only: A at levels 0, 1, 1, then B at 1, 1, then A at 1
 *   LO7: A, and B with level 0 written again in roman numerals from 3 ("%1)", a `w:lvl` in its `w:lvlOverride`): A A B B A
 *   LO8: two lists of two definitions, one after the other: P Q P Q
 *   LO9: A, and B with a `w:lvlOverride` at level 0 that gives nothing: A A B B A
 * LR: levels of one list, "%1.", "%1.%2." and "%1.%2.%3."
 *   LR1: level 1 never starts again (`w:lvlRestart` 0): levels 0, 1, 1, 0, 1
 *   LR2: level 2 starts again only after level 0 (`w:lvlRestart` 1): levels 0, 1, 2, 2, 1, 2, 0, 2
 *   LR3: legal numbering (`w:isLgl`) at level 1, after a level 0 in roman numerals: levels 0, 1, 1
 *   LR4: a list's first paragraph at level 1, where level 0 starts at 1 (LR4a) and at 3 (LR4b)
 * LF: numbers from 10, "%1.", then a tab, and on each line a word and "next" below it, for the height of the line
 *   LF1: a paragraph whose mark is 20 points and its text 11. LF2: whose mark is in Courier New
 *   LF3: whose mark is 20 points, in a list whose level gives 8 points
 *   LF4: whose text is bold and its mark not. LF5: whose mark is bold and its text not
 *   LF6: in a paragraph style of 16 points
 *
 * docx can't write some of these, so this script changes its numbering's XML: see `NUM_OVERRIDES` and `LEVEL_EXTRAS`.
 *
 * What Word showed, in word-lists.pdf, saved from Word 16 for Mac on 2026-10-02 and read with word-lists.py (twips from
 * the left margin, or back from the right one in a right-to-left paragraph):
 *
 * - LJ1, LJ2, LJ3: a right-aligned number ends at the start of the line, 355 to 1440, and the text after it starts at the
 *   hanging indent's stop, 1800; a centred one is centred there, 897.5 to 1983, and the text goes on to the next default
 *   stop, 2160; a left-aligned one, 1440 to 2525.5, to 2880. LibreOffice puts them all there too
 * - LJ4: a right-aligned number followed by a space ends 60.6 before the start of the line, 1379.4, and the text starts at
 *   1440. Word draws the space after a number, and the tab, in Arial, and the space is as wide as Arial's, 61.1, not
 *   Calibri's 49.7. LJ5: a centred number followed by nothing is centred at 1440, and the text's own space follows it
 * - LJ6: a right-aligned number with no hanging indent ends at the left indent, 1440, and the text starts right there, as
 *   though the tab after it took no room. 1440 is a default tab stop too, so whether Word takes the left indent or a stop
 *   at the number's end as the tab's stop isn't shown
 * - LJ7, LJ8, LJ9: a number goes into the margin, from -1085, and in a table cell into the cell's margin and past it, and
 *   the text starts at the hanging indent, 360 from the line's start, or the next default stop
 * - LJ10, LJ11: a right-to-left paragraph is laid out as LJ3 and LJ1 the other way round: left is the start of the line
 * - LO1, LO9: lists made from one definition count on from one another, 1 to 5, without a w:lvlOverride or with one that
 *   gives nothing. LO8: those of two definitions count on their own
 * - LO2 to LO6: a list's own first number for a level (w:startOverride) starts the level there at the list's first
 *   paragraph of that level, once, and the others go on from it: A A B B A A B is 1 2 1 2 3 4 5 (LO2, LO3). B's first
 *   paragraph at level 1 goes on from A's, 1.3, and B's level 0 starts again only at its first paragraph of level 0
 *   (LO5). Starting level 1 at 4 goes 1.4, 1.5, and A goes on with 1.6 (LO6). LO4: 5, 6
 * - LO7: a level a list gives (a w:lvl in its w:lvlOverride) starts there at its own first number too, III) and IV), and
 *   the other list goes on in its own format, 5.
 * - LR1, LR2: a level starts again only after the level it gives (w:lvlRestart), or never: 1.1, 1.2, 2, 2.3, and 1.2.3
 *   after 1.1.2 and 1.2. LibreOffice ignores w:lvlRestart. LR3: legal numbering writes I. then 1.1 and 1.2. LR4: a level
 *   not counted yet shows its first number, 1.1 and 3.1
 * - LF1 to LF6: the number is in its paragraph mark's formatting, its size, font and bold, not its text's, but for what
 *   its level gives it: 8 points beside a mark of 20. A 20-point number beside Calibri 11 makes the line 443.6 tall, its
 *   ascent and Calibri's descent, and a number in Courier New leaves it 268.55: only its ascent counts. LibreOffice
 *   counts its descent too, so the next line's baseline is 317 below LF1's, where Word's is 268.8
 *
 * Usage: npm run run-ts -- scripts/layout-probes/word-lists.ts
 */
// cspell:ignore bidi
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    AlignmentType,
    Document,
    type ILevelsOptions,
    type ISectionOptions,
    LevelFormat,
    LevelSuffix,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

/** A numbered paragraph of a list, at a level, with its text */
const item = (
    reference: string,
    text: string,
    { level = 0, instance = 0, ...options }: Options & { level?: number; instance?: number } = {},
) => new Paragraph({ ...options, numbering: { reference, level, instance }, children: [new TextRun(text)] });

// LJ: the number is "Paragraph1.", 1085 twips wide in Calibri 11
const WIDE = "Paragraph%1.";
const HANGING = { left: 1800, hanging: 360 };

const wide = (
    alignment: (typeof AlignmentType)[keyof typeof AlignmentType],
    indent: { readonly left: number; readonly hanging?: number },
    suffix?: (typeof LevelSuffix)[keyof typeof LevelSuffix],
): readonly ILevelsOptions[] => [
    { level: 0, format: LevelFormat.DECIMAL, text: WIDE, alignment, ...(suffix ? { suffix } : {}), style: { paragraph: { indent } } },
];

/** Levels numbered "%1.", "%1.%2." and so on, each 720 further in than the one before, with a hanging indent of 360 */
const levels = (count: number, overrides: Partial<ILevelsOptions>[] = []): readonly ILevelsOptions[] =>
    Array.from({ length: count }, (_, level) => ({
        level,
        format: LevelFormat.DECIMAL,
        text: Array.from({ length: level + 1 }, (__, i) => `%${i + 1}.`).join(""),
        alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
        ...overrides[level],
    }));

const NUMBERING: readonly { readonly reference: string; readonly levels: readonly ILevelsOptions[] }[] = [
    { reference: "lj1", levels: wide(AlignmentType.RIGHT, HANGING) },
    { reference: "lj2", levels: wide(AlignmentType.CENTER, HANGING) },
    { reference: "lj3", levels: wide(AlignmentType.LEFT, HANGING) },
    { reference: "lj4", levels: wide(AlignmentType.RIGHT, HANGING, LevelSuffix.SPACE) },
    { reference: "lj5", levels: wide(AlignmentType.CENTER, HANGING, LevelSuffix.NOTHING) },
    { reference: "lj6", levels: wide(AlignmentType.RIGHT, { left: 1440 }) },
    { reference: "lj7", levels: wide(AlignmentType.RIGHT, { left: 360, hanging: 360 }) },
    { reference: "lj8", levels: wide(AlignmentType.CENTER, { left: 360, hanging: 360 }) },
    { reference: "lj9", levels: wide(AlignmentType.RIGHT, { left: 360, hanging: 360 }) },
    { reference: "lj10", levels: wide(AlignmentType.LEFT, HANGING) },
    { reference: "lj11", levels: wide(AlignmentType.RIGHT, HANGING) },
    ...["lo1", "lo2", "lo3", "lo4", "lo5", "lo6", "lo7", "lo8p", "lo8q", "lo9"].map((reference) => ({ reference, levels: levels(2) })),
    { reference: "lr1", levels: levels(2) },
    { reference: "lr2", levels: levels(3) },
    { reference: "lr3", levels: levels(2, [{ format: LevelFormat.UPPER_ROMAN }, { isLegalNumberingStyle: true }]) },
    { reference: "lr4a", levels: levels(2) },
    { reference: "lr4b", levels: levels(2, [{ start: 3 }]) },
    { reference: "lf", levels: levels(1, [{ start: 10 }]) },
    {
        reference: "lf3",
        levels: levels(1, [{ start: 10, style: { run: { size: 16 }, paragraph: { indent: { left: 720, hanging: 360 } } } }]),
    },
];

/**
 * The `w:lvlOverride`s of each list, by its reference and instance, in place of the one docx writes, which starts level
 * 0 again at the level's first number. An empty string leaves the list with none
 */
const NUM_OVERRIDES: Readonly<Record<string, string>> = {
    "lo1-0": "",
    "lo1-1": "",
    "lo2-0": "",
    "lo4-0": '<w:lvlOverride w:ilvl="0"><w:startOverride w:val="5"/></w:lvlOverride>',
    "lo6-0": "",
    "lo6-1": '<w:lvlOverride w:ilvl="1"><w:startOverride w:val="4"/></w:lvlOverride>',
    "lo7-0": "",
    "lo7-1":
        '<w:lvlOverride w:ilvl="0"><w:lvl w:ilvl="0"><w:start w:val="3"/><w:numFmt w:val="upperRoman"/><w:lvlText w:val="%1)"/>' +
        '<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:lvlOverride>',
    "lo9-0": "",
    "lo9-1": '<w:lvlOverride w:ilvl="0"/>',
};

/** What each list's levels have that docx doesn't write, put after their `w:numFmt`, by its reference and level */
const LEVEL_EXTRAS: Readonly<Record<string, string>> = {
    "lr1-1": '<w:lvlRestart w:val="0"/>',
    "lr2-2": '<w:lvlRestart w:val="1"/>',
};

const CELL = 4513;

const sections: ISectionOptions[] = [
    {
        children: [
            line("LJ above"),
            ...[1, 2, 3, 4, 6, 7, 8].map((probe) => item(`lj${probe}`, `LJ${probe} ${prose(40)}`)),
            item("lj5", ` LJ5 ${prose(40)}`),
            new Table({
                width: { size: CELL * 2, type: WidthType.DXA },
                columnWidths: [CELL, CELL],
                borders: TableBorders.NONE,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: CELL, type: WidthType.DXA }, children: [item("lj9", `LJ9 ${prose(30)}`)] }),
                            new TableCell({ width: { size: CELL, type: WidthType.DXA }, children: [line("LJ9 beside")] }),
                        ],
                    }),
                ],
            }),
            item("lj10", `LJ10 ${prose(40)}`, { bidirectional: true }),
            item("lj11", `LJ11 ${prose(40)}`, { bidirectional: true }),
            line("LJ below"),
        ],
    },
    {
        children: [
            item("lo1", "LO1a A"),
            item("lo1", "LO1b A"),
            item("lo1", "LO1c B", { instance: 1 }),
            item("lo1", "LO1d B", { instance: 1 }),
            item("lo1", "LO1e A"),
            line("LO1 end"),
            ...["A", "A", "B", "B", "A", "A", "B"].map((list, i) =>
                item("lo2", `LO2${"abcdefg"[i]} ${list}`, { instance: list === "B" ? 1 : 0 }),
            ),
            line("LO2 end"),
            ...["A", "A", "B", "B", "B", "A", "A"].map((list, i) =>
                item("lo3", `LO3${"abcdefg"[i]} ${list}`, { instance: list === "B" ? 1 : 0 }),
            ),
            line("LO3 end"),
            item("lo4", "LO4a A"),
            item("lo4", "LO4b A"),
            line("LO4 end"),
            ...(
                [
                    ["A", 0],
                    ["A", 1],
                    ["A", 1],
                    ["B", 1],
                    ["B", 1],
                    ["B", 0],
                    ["B", 1],
                ] as const
            ).map(([list, level], i) => item("lo5", `LO5${"abcdefg"[i]} ${list}`, { level, instance: list === "B" ? 1 : 0 })),
            line("LO5 end"),
            ...(
                [
                    ["A", 0],
                    ["A", 1],
                    ["A", 1],
                    ["B", 1],
                    ["B", 1],
                    ["A", 1],
                ] as const
            ).map(([list, level], i) => item("lo6", `LO6${"abcdef"[i]} ${list}`, { level, instance: list === "B" ? 1 : 0 })),
            line("LO6 end"),
            ...["A", "A", "B", "B", "A"].map((list, i) => item("lo7", `LO7${"abcde"[i]} ${list}`, { instance: list === "B" ? 1 : 0 })),
            line("LO7 end"),
            ...["P", "Q", "P", "Q"].map((list, i) => item(list === "P" ? "lo8p" : "lo8q", `LO8${"abcd"[i]} ${list}`)),
            line("LO8 end"),
            ...["A", "A", "B", "B", "A"].map((list, i) => item("lo9", `LO9${"abcde"[i]} ${list}`, { instance: list === "B" ? 1 : 0 })),
            line("LO9 end"),
        ],
    },
    {
        children: [
            ...[0, 1, 1, 0, 1].map((level, i) => item("lr1", `LR1${"abcde"[i]} level ${level}`, { level })),
            line("LR1 end"),
            ...[0, 1, 2, 2, 1, 2, 0, 2].map((level, i) => item("lr2", `LR2${"abcdefgh"[i]} level ${level}`, { level })),
            line("LR2 end"),
            ...[0, 1, 1].map((level, i) => item("lr3", `LR3${"abc"[i]} level ${level}`, { level })),
            line("LR3 end"),
            item("lr4a", "LR4a level 1", { level: 1 }),
            line("LR4a end"),
            item("lr4b", "LR4b level 1", { level: 1 }),
            line("LR4b end"),
        ],
    },
    {
        children: [
            item("lf", "LF1 mark 20", { run: { size: 40 } }),
            line("LF1 next"),
            item("lf", "LF2 mark Courier New", { run: { font: "Courier New" } }),
            line("LF2 next"),
            item("lf3", "LF3 mark 20 level 8", { run: { size: 40 } }),
            line("LF3 next"),
            new Paragraph({ numbering: { reference: "lf", level: 0 }, children: [new TextRun({ text: "LF4 text bold", bold: true })] }),
            line("LF4 next"),
            item("lf", "LF5 mark bold", { run: { bold: true } }),
            line("LF5 next"),
            item("lf", "LF6 style 16", { style: "Big" }),
            line("LF6 next"),
        ],
    },
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [{ id: "Big", name: "Big", basedOn: "Normal", run: { size: 32 } }],
    },
    numbering: { config: NUMBERING.map(({ reference, levels: given }) => ({ reference, levels: [...given] })) },
    sections,
});

/** Replaces the first match of a pattern, which must be there, with what a function makes of it and its groups */
const replace = (text: string, pattern: RegExp, replacement: (...groups: string[]) => string): string => {
    if (!pattern.test(text)) {
        throw new Error(`No ${pattern} to replace`);
    }
    return text.replace(pattern, (...groups: string[]) => replacement(...groups));
};

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    let xml = await zip.file("word/numbering.xml")!.async("string");
    // Each list's w:num, and the definition it numbers by, from the lists docx made while it wrote the document
    const nums = new Map(doc.Numbering.ConcreteNumbering.map(({ reference, instance, numId }) => [`${reference}-${instance}`, numId]));
    const numOf = (list: string): RegExp => new RegExp(`(<w:num w:numId="${nums.get(list)}"><w:abstractNumId w:val="(\\d+)"/>).*?</w:num>`);
    for (const [list, overrides] of Object.entries(NUM_OVERRIDES)) {
        xml = replace(xml, numOf(list), (_, start: string) => `${start}${overrides}</w:num>`);
    }
    for (const [key, extra] of Object.entries(LEVEL_EXTRAS)) {
        const [reference, level] = key.split("-");
        const abstractId = numOf(`${reference}-0`).exec(xml)![2];
        xml = replace(
            xml,
            new RegExp(
                `(<w:abstractNum w:abstractNumId="${abstractId}"[^>]*>(?:(?!</w:abstractNum>).)*?<w:lvl w:ilvl="${level}"[^>]*>(?:(?!</w:lvl>).)*?<w:numFmt [^>]*/>)`,
            ),
            (_, before: string) => `${before}${extra}`,
        );
    }
    zip.file("word/numbering.xml", xml);
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-lists.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
