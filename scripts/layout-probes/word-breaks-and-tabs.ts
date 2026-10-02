/**
 * Probes of where Word breaks lines at a hidden paragraph mark, a soft hyphen and a tab, where word-watertight-text.ts's
 * TX10 to TX12 left it open. Each line's text names its probe, so the lines can be found in a PDF saved from Word with
 * pdftotext -bbox-layout, which word-breaks-and-tabs.py reads. Calibri 11, single spaced, no space before or after, on A4
 * with 1440 margins, so lines are 9026 twips long. Most probes are between a line above and a line below.
 *
 * TX11a showed two paragraphs of the same formatting on one line when the first's mark is hidden; TX10a lines broken at
 * `w:softHyphen` with a hyphen drawn there; TX12a a decimal tab lining up the full stop of plain numbers; and TX12c and TX12d
 * a right tab past the margin lined up with the margin, and the text after a left tab past it on the next line. What
 * isn't known:
 *
 * HM1: the formatting of two paragraphs joined by a hidden mark, where they differ: a left indent on the first or the
 *      second (HM1a, HM1b), centred and left-aligned (HM1c, HM1d), space before and after (HM1e, HM1f), a style of larger
 *      text with space before (HM1g), and double and single line spacing (HM1h, HM1i)
 * HM2: a hidden mark before a table (HM2a), and at the end of a table cell (HM2b)
 * HM3: a paragraph whose text and mark are hidden (HM3a), an empty one whose mark is hidden (HM3b), a paragraph of a hidden
 *      style (HM3c), a paragraph whose text is hidden but not its mark (HM3d), and an empty one whose mark is hidden, with
 *      space before and after (HM3e)
 * HM4: numbered paragraphs, the first's mark hidden
 * HM5: a mark with `w:specVanish` and no `w:vanish` (HM5a), and with both, as Word's style separator writes it (HM5b)
 * HM6: three paragraphs, the first two with hidden marks
 * HM7: a hidden mark between two paragraphs of a cell of a table sized to its text
 * SH1: a justified line whose last word, with soft hyphens in it, fits only with the line's spaces 3%, 6%, 10%, 15% and 20%
 *      narrower, and its first part with a hyphen fits as it is: whether Word squeezes the word in or breaks it; SH1f is
 *      SH1c left-aligned
 * SH2: a left-aligned line whose last word's first part ends 10, 30, 50, 70 and 90 twips short of the end of the line,
 *      where Calibri 11's hyphen is 67.3: whether the hyphen has to fit
 * SH3: a word with soft hyphens in a column of a table sized to its text, and without them
 * SH4: a word with soft hyphens longer than a line
 * DT: text at a decimal tab at 4000 twips that isn't a plain number: with a currency sign and a thousands separator, a
 *     percent sign, letters, two full stops, words before and after a number, brackets, a comma, a leading and a trailing
 *     full stop, a space in the number, and a hyphen alone
 * TP: tabs past the margin: a centred tab and a decimal tab (TP1, TP2), a left tab at the start of a paragraph (TP3), a left
 *     tab with a left indent (TP4), a right tab with a right indent (TP5), a left and a right tab between the right indent
 *     and the margin (TP6, TP9), and a right tab whose text doesn't fit before the margin (TP7)
 *
 * It imports docx/layout's widths of Calibri, which match Word's to 0.1% (word-watertight-text.ts TX17), to end SH1's and
 * SH2's lines where it means to, so run it from a checkout.
 */
// cspell:ignore bbox Donau dampf schiff fahrts gesell schaft
import { mkdirSync, writeFileSync } from "node:fs";

import {
    AlignmentType,
    Document,
    LevelFormat,
    LineRuleType,
    Packer,
    Paragraph,
    type ParagraphChild,
    type ISectionOptions,
    SoftHyphen,
    Table,
    TableCell,
    TableRow,
    TabStopType,
    TextRun,
    WidthType,
} from "docx";

import { measureTextWidth } from "../../src/text-layout/text-width";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
/** A paragraph whose mark is hidden */
const hiddenMark = (text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, run: { vanish: true }, children: text === "" ? [] : [new TextRun(text)] });
/** A probe between a line above and a line below */
const probe = (name: string, ...children: (Paragraph | Table)[]): (Paragraph | Table)[] => [
    line(`${name} above`),
    ...children,
    line(`${name} below`),
];
const section = (...children: (Paragraph | Table | readonly (Paragraph | Table)[])[]): ISectionOptions => ({ children: children.flat() });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

const DOUBLE = { spacing: { line: 480, lineRule: LineRuleType.AUTO } };

/** The parts of a word, with a soft hyphen between each two, in a run */
const softly = (...parts: string[]): TextRun =>
    new TextRun({ children: parts.flatMap((part, index) => (index === 0 ? [part] : [new SoftHyphen(), part])) });

const CALIBRI = { font: "Calibri", size: 11 };
const WIDTH = 9026 / 20;

/**
 * A paragraph of a label, words of filler, a word tuned with character spacing, and then `last`, so that `last` ends
 * `over` points past the end of the first line, as the width tables measure Calibri
 */
const tuned = (head: string, last: readonly string[], over: (spaces: number) => number, options: Options = {}): Paragraph => {
    const filler = Array.from({ length: 40 }, (_, i) => WORDS[(i * 3) % WORDS.length]);
    const whole = last.join("");
    const text = (n: number): string => [head, ...filler.slice(0, n)].join(" ");
    // How far past the end of the line `last` ends with this many words of filler, against how far it should, in points
    const short = (n: number): number => over(n + 2) - (measureTextWidth(`${text(n)} survey ${whole}`, CALIBRI) - WIDTH);
    // As many words of filler as leave the least to make up with character spacing, which makes up the rest
    const count = filler.reduce((best, _, n) => (Math.abs(short(n)) < Math.abs(short(best)) ? n : best), 0);
    // Character spacing on the 6 letters of "survey", in twips, to make the overflow `over`
    const spacing = Math.round((short(count) * 20) / 6);
    const children: ParagraphChild[] = [
        new TextRun(`${text(count)} `),
        new TextRun({ text: "survey", characterSpacing: spacing }),
        new TextRun(" "),
        softly(...last),
        new TextRun(` ${prose(12)}`),
    ];
    return new Paragraph({ ...options, children });
};

const SPACE = measureTextWidth(" ", CALIBRI);
const HYPHEN = measureTextWidth("-", CALIBRI);

/** A table of one row of cells of this text, or these paragraphs, given no widths, so Word sizes it to its text */
const autofit = (...cells: readonly (string | readonly Paragraph[])[]): Table =>
    new Table({
        rows: [
            new TableRow({
                children: cells.map((content) => new TableCell({ children: typeof content === "string" ? [line(content)] : [...content] })),
            }),
        ],
    });

const fixed = (...rows: readonly (readonly Paragraph[])[]): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: rows.map((children) => new TableRow({ children: [new TableCell({ width: { size: 9026, type: WidthType.DXA }, children: [...children] })] })),
    });

const tab = (label: string, type: (typeof TabStopType)[keyof typeof TabStopType], position: number, text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, tabStops: [{ type, position }], children: [new TextRun(text.replace("@", label))] });

const sections: ISectionOptions[] = [
    // HM1: two paragraphs joined by a hidden mark, of different formatting, long enough for three lines between them, or
    // short enough for one
    section(
        probe("HM1a", hiddenMark(`HM1a first ${prose(26)}`, { indent: { left: 1440 } }), line(`HM1a second ${prose(26)}`)),
        probe("HM1b", hiddenMark(`HM1b first ${prose(26)}`), line(`HM1b second ${prose(26)}`, { indent: { left: 1440 } })),
        probe("HM1c", hiddenMark("HM1c first", { alignment: AlignmentType.CENTER }), line(" HM1c second")),
        probe("HM1d", hiddenMark("HM1d first"), line(" HM1d second", { alignment: AlignmentType.CENTER })),
        probe("HM1e", hiddenMark("HM1e first", { spacing: { before: 480, after: 480 } }), line(" HM1e second")),
        probe("HM1f", hiddenMark("HM1f first"), line(" HM1f second", { spacing: { before: 480, after: 480 } })),
        probe("HM1g", hiddenMark("HM1g first", { style: "Big" }), line(" HM1g second")),
    ),
    section(
        probe("HM1h", hiddenMark(`HM1h first ${prose(26)}`, DOUBLE), line(`HM1h second ${prose(26)}`)),
        probe("HM1i", hiddenMark(`HM1i first ${prose(26)}`), line(`HM1i second ${prose(26)}`, DOUBLE)),
    ),

    // HM2: a hidden mark before a table, and at the end of a table cell, alone and after another paragraph
    section(
        probe("HM2a", hiddenMark("HM2a first"), fixed([line("HM2a cell")])),
        probe("HM2b", fixed([hiddenMark("HM2b alone")], [line("HM2b next row")], [line("HM2b first"), hiddenMark(" HM2b last")], [line("HM2b last row")])),
    ),

    // HM3: hidden paragraphs between a line above and below
    section(
        probe("HM3a", new Paragraph({ run: { vanish: true }, children: [new TextRun({ text: "HM3a hidden", vanish: true })] })),
        probe("HM3b", hiddenMark("")),
        probe("HM3c", line("HM3c hidden", { style: "Hidden" })),
        probe("HM3d", new Paragraph({ children: [new TextRun({ text: "HM3d hidden", vanish: true })] })),
        probe("HM3e", hiddenMark("", { spacing: { before: 480, after: 480 } })),
    ),

    // HM4: numbered paragraphs, the first's mark hidden; HM5: a mark with specVanish alone, and with vanish; HM6: three
    // paragraphs joined; HM7: a hidden mark in a cell of a table sized to its text
    section(
        probe(
            "HM4",
            hiddenMark("HM4 one", { numbering: { reference: "hm4", level: 0 } }),
            line(" HM4 two", { numbering: { reference: "hm4", level: 0 } }),
            line("HM4 three", { numbering: { reference: "hm4", level: 0 } }),
        ),
        probe("HM5a", new Paragraph({ run: { specVanish: true }, children: [new TextRun("HM5a first")] }), line(" HM5a second")),
        probe("HM5b", new Paragraph({ run: { vanish: true, specVanish: true }, children: [new TextRun("HM5b first")] }), line(" HM5b second")),
        probe("HM6", hiddenMark("HM6 one"), hiddenMark(" HM6 two"), line(" HM6 three")),
        probe("HM7", autofit([hiddenMark("HM7 aaaaaaaa"), line("HM7 bbbbbbbbbbbb")], `HM7 other ${prose(60)}`)),
    ),

    // SH1: justified lines whose last word fits only squeezed, or broken at a soft hyphen; SH1f left-aligned
    section(
        ...[0.03, 0.06, 0.1, 0.15, 0.2].map((share, index) =>
            tuned(
                `SH1${"abcde"[index]} ${Math.round(share * 100)}`,
                ["Donau", "dampf", "schiff"],
                (spaces) => share * spaces * SPACE,
                { alignment: AlignmentType.JUSTIFIED },
            ),
        ),
        tuned("SH1f 10", ["Donau", "dampf", "schiff"], (spaces) => 0.1 * spaces * SPACE),
    ),

    // SH2: lines whose last word's first part ends this many twips short of the end of the line
    section(
        ...[10, 30, 50, 70, 90].map((twips) =>
            tuned(
                `SH2 ${twips}`,
                ["Donau", "dampfschifffahrt"],
                // "Donau" ends `twips` short of the end, so "Donaudampfschifffahrt" ends this far past it
                () => measureTextWidth("Donaudampfschifffahrt", CALIBRI) - measureTextWidth("Donau", CALIBRI) - twips / 20,
            ),
        ),
        line(`SH2 hyphen ${Math.round(HYPHEN * 20 * 10) / 10}`),
    ),

    // SH3: a long word in a column of a table sized to its text, with soft hyphens and without; SH4: a word with soft
    // hyphens longer than a line
    section(
        line("SH3a above"),
        autofit([new Paragraph({ children: [new TextRun("SH3a "), softly("Donau", "dampf", "schiff", "fahrts", "gesell", "schaft")] })], `SH3a other ${prose(60)}`),
        line("SH3b above"),
        autofit("SH3b Donaudampfschifffahrtsgesellschaft", `SH3b other ${prose(60)}`),
        line("SH3b below"),
        new Paragraph({
            children: [
                new TextRun("SH4 "),
                softly(...Array.from({ length: 6 }, () => ["Donau", "dampf", "schiff", "fahrts", "gesellschaft"]).flat()),
                new TextRun(" end"),
            ],
        }),
    ),

    // DT: text at a decimal tab at 4000 that isn't a plain number
    section(
        ...["$1,234.50", "12.5%", "abc", "a.b", "1.2.3", "x 1.5", "1.5 x", "(3.25)", "1,5", ".75", "12.", "Total 12.50", "1 234.5", "-", "e.g. 7"].map(
            (text, index) => tab(`DT${index + 1}`, TabStopType.DECIMAL, 4000, `@\t${text}`),
        ),
    ),

    // TP: tabs past the margin
    section(
        tab("TP1", TabStopType.CENTER, 9800, "@ text\tcentred"),
        tab("TP2", TabStopType.DECIMAL, 9800, "@ text\t12.5"),
        tab("TP3", TabStopType.LEFT, 9500, "\t@ left"),
        tab("TP4", TabStopType.LEFT, 9500, "@ text\tleft", { indent: { left: 1000 } }),
        tab("TP5", TabStopType.RIGHT, 10000, "@ text\tright", { indent: { right: 1000 } }),
        tab("TP6", TabStopType.LEFT, 8500, "@ text\tleft", { indent: { right: 1000 } }),
        tab("TP7", TabStopType.RIGHT, 10000, `@ ${"m".repeat(49)}\tright`),
        tab("TP9", TabStopType.RIGHT, 8500, "@ text\tright", { indent: { right: 1000 } }),
        line("TP below"),
    ),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            { id: "Big", name: "Big", basedOn: "Normal", run: { size: 32 }, paragraph: { spacing: { before: 240 } } },
            { id: "Hidden", name: "Hidden", basedOn: "Normal", run: { vanish: true } },
        ],
    },
    numbering: {
        config: [
            {
                reference: "hm4",
                levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
            },
        ],
    },
    sections,
});

const main = async (): Promise<void> => {
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-breaks-and-tabs.docx", await Packer.toBuffer(doc));
};

void main();
