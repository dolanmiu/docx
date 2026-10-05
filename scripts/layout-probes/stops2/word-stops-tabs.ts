/**
 * Probes of tabs, soft hyphens and squeezed justified lines where docx/layout stops after `word-breaks-and-tabs.docx`
 * (SH1 to SH4, DT, TP1 to TP7), `word-justify.docx` (J00 to J18) and `word-justify2.docx` (K00 to K12); and of two places
 * where docx/layout's line breaks differ from Word's PDFs without stopping:
 * - `word-watertight-text.docx` TX12d: a left tab at 9500, past the margin at 9026, after "TX12d": Word puts the text
 *   after the tab two lines below "TX12d", docx/layout one
 * - `word-justify2.docx` K07_06 (distributed), K08_11 (thaiDistribute) and K09_11 (lowKashida): Word squeezes the word
 *   onto the line, docx/layout doesn't, so each paragraph has a line more
 *
 * Calibri 11, single spaced, on A4 with inch margins: lines of 9026 twips. Soft hyphens are `w:softHyphen`. Each probe is a paragraph or a few, between a
 * line above and a line below; the widths it sets up come from docx/layout's width tables, which `word-character-widths`
 * showed are Word's for Calibri.
 *
 * TA1a to TA1c: a left tab stop at 9500, past the end of the line, after "TA1a text", in a paragraph with a first line
 *   indent of 720 (a), a hanging indent of 720 (b), and a right indent of -720, past the margin (c)
 * TA2a, TA2b: a left stop past the end of the line in a paragraph indented 1000 on the right: at 8500 (a) and 9500 (b)
 * TA3a to TA3d: a tab at the start of a line to a stop past its end: right at 9500 (a), centred (b), decimal (c), and right
 *   at 9500 in a paragraph indented 1000 on the left (d)
 * TA4a to TA4c: a paragraph indented 2000 on the right, with a centred (a) and a decimal (b) stop at 8000; a right stop at
 *   8000 in a justified paragraph (c)
 * TA5: a right stop at 8500 in a paragraph indented 2000 on the right, the text after it 3000 long
 * TA6a to TA6j: text at a decimal stop at 4000: 12.5%, $1,234.50, (12.5), 1,234, -1.5, 12%, 1.5x, abc, 1.2.3, "12, 34"
 * TA7a to TA7d: a tab in text with a border (a); text with a border at a right (b), centred (c) and decimal (d) stop
 * TA8a to TA8h: TX12d again and around it: a left stop at 9100 (a), 9500 (b), 10000 (c), 12000 (d), each after
 *   "TA8x" and before "left"; at 9500 after a word that ends 200 before the margin (e); at 9500 with a long text after
 *   it (f); at 9500 in a paragraph indented 1000 on the right (g); and a right stop at 9500 (h, TX12c again)
 * SH10a to SH10d: a justified line ending with a word with soft hyphens, whose whole doesn't fit squeezed, past the margin
 *   by 30%, 50%, 70% and 90% of it
 * SH11: a soft hyphen in a word with a border, at the end of a line
 * SH12: a word with soft hyphens whose first part, 12000 twips, is longer than its line
 * SH13a to SH13h: a line whose word has a soft hyphen where the hyphen ends 0, 3, 6, 10, 15, 20, 23 and 30 twips before the
 *   margin (SH2 left 2.7 to 22.6 open)
 * SH14a to SH14c: soft hyphens in words in cells of tables given no widths: a word of 3000 with one in its middle (a), two
 *   words of 2000 with them (b), and in a table narrowed to the page by prose beside it (c)
 * SH15a, SH15b: kerned text (kern 1 point) with a soft hyphen between "e" and "f", and ligatures (standard) across one
 * JU1a to JU1c: a justified line that only fits squeezed, its spaces en spaces (a), em spaces (b), ideographic spaces (c)
 * JU2: a justified line that only fits squeezed, with a word in a border on it
 * JU3: the squeeze limits K07, K08 and K09 crossed in finer steps: lines of 19 spaces ending with "lighthouse", past the
 *   margin by 0% to 16% of the word in steps of 1%, distributed (JU3a00 to JU3a16), thaiDistribute (JU3b..) and
 *   lowKashida (JU3c..), each with two lines after its first, as K07 had
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-tabs.ts [folder]
 */
import { AlignmentType, BorderStyle, Paragraph, Table, TableRow, TabStopType, TextRun } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

import { ALL_BORDERS, type Child, PAGE, cell, group, line, newPage, probe, prose, softHyphens, write } from "./kit";

const CALIBRI = { font: "Calibri", size: 11 };
const twips = (text: string): number => measureTextWidth(text, CALIBRI) * 20;
const LINE = 9026;
const SOFT = "­";
const border = { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 1 };

const tabPara = (
    name: string,
    text: string,
    stops: readonly { type: (typeof TabStopType)[keyof typeof TabStopType]; position: number }[],
    options: object = {},
    run: object = {},
): Paragraph => new Paragraph({ ...options, tabStops: [...stops], children: [new TextRun({ text, ...run })] });

const DECIMALS = ["12.5%", "$1,234.50", "(12.5)", "1,234", "-1.5", "12%", "1.5x", "abc", "1.2.3", "12, 34"];

/** A line of prose that ends `end` twips along the line, as near as words of it go, and the twips it ends at */
const proseTo = (name: string, end: number): { readonly text: string; readonly width: number } => {
    let text = name;
    let from = 0;
    while (twips(`${text} ${prose(1, from)}`) < end) {
        text = `${text} ${prose(1, from)}`;
        from++;
    }
    return { text, width: twips(text) };
};

/** SH13: a line whose word's soft hyphen ends `before` twips before the margin: filler, then "x" letters to place it */
const hyphenAt = (name: string, before: number): Paragraph => {
    const hyphen = twips("-");
    const target = LINE - before - hyphen;
    const { text } = proseTo(name, target - 1500);
    let word = "";
    while (twips(`${text} ${word}e`) <= target) {
        word += "e";
    }
    // The word's part before the soft hyphen ends at the target, and its part after is long enough not to fit
    return new Paragraph({ children: [new TextRun(`${text} ${word}${SOFT}continuation and the rest of the line`)] });
};

/** JU3: a paragraph whose first line of 19 spaces ends with "lighthouse", past the margin by a share of it */
const WORDS19 = "of the by in to and on of the by in to and on of the by in".split(" ");
const squeezed = (name: string, share: number, alignment: (typeof AlignmentType)[keyof typeof AlignmentType]): Paragraph => {
    const first = `${name} ${WORDS19.join(" ")} lighthouse`;
    const width = twips(first);
    const word = twips("lighthouse");
    const lineWidth = width - word * share;
    return new Paragraph({
        alignment,
        indent: { right: Math.round(LINE - lineWidth) },
        children: [
            new TextRun(
                `${first} the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth the survey of the coast was made in`,
            ),
        ],
    });
};

const twoDigits = (n: number): string => String(n).padStart(2, "0");

const children: Child[] = [
    ...probe("TA1a", [tabPara("TA1a", "TA1a text\tafter", [{ type: TabStopType.LEFT, position: 9500 }], { indent: { firstLine: 720 } })]),
    ...group("TA1b", [
        tabPara("TA1b", "TA1b text\tafter", [{ type: TabStopType.LEFT, position: 9500 }], { indent: { left: 720, hanging: 720 } }),
    ]),
    ...group("TA1c", [tabPara("TA1c", "TA1c text\tafter", [{ type: TabStopType.LEFT, position: 9500 }], { indent: { right: -720 } })]),
    ...group("TA2a", [tabPara("TA2a", "TA2a text\tafter", [{ type: TabStopType.LEFT, position: 8500 }], { indent: { right: 1000 } })]),
    ...group("TA2b", [tabPara("TA2b", "TA2b text\tafter", [{ type: TabStopType.LEFT, position: 9500 }], { indent: { right: 1000 } })]),
    ...group("TA3a", [tabPara("TA3a", "\tTA3a after", [{ type: TabStopType.RIGHT, position: 9500 }])]),
    ...group("TA3b", [tabPara("TA3b", "\tTA3b after", [{ type: TabStopType.CENTER, position: 9500 }])]),
    ...group("TA3c", [tabPara("TA3c", "\tTA3c 12.5", [{ type: TabStopType.DECIMAL, position: 9500 }])]),
    ...group("TA3d", [tabPara("TA3d", "\tTA3d after", [{ type: TabStopType.RIGHT, position: 9500 }], { indent: { left: 1000 } })]),
    ...group("TA4a", [tabPara("TA4a", "TA4a text\tcentred", [{ type: TabStopType.CENTER, position: 8000 }], { indent: { right: 2000 } })]),
    ...group("TA4b", [tabPara("TA4b", "TA4b text\t12.5", [{ type: TabStopType.DECIMAL, position: 8000 }], { indent: { right: 2000 } })]),
    ...group("TA4c", [
        tabPara("TA4c", `TA4c ${prose(10)}\tright ${prose(30)}`, [{ type: TabStopType.RIGHT, position: 8000 }], {
            alignment: AlignmentType.JUSTIFIED,
        }),
    ]),
    ...group("TA5", [tabPara("TA5", `TA5 text\t${prose(25)}`, [{ type: TabStopType.RIGHT, position: 8500 }], { indent: { right: 2000 } })]),
    newPage(),
    ...DECIMALS.flatMap((text, index) =>
        group(`TA6${"abcdefghij"[index]}`, [
            tabPara("x", `TA6${"abcdefghij"[index]}\t${text}`, [{ type: TabStopType.DECIMAL, position: 4000 }]),
        ]),
    ),
    ...group("TA7a", [new Paragraph({ children: [new TextRun("TA7a "), new TextRun({ text: "boxed\ttab", border })] })]),
    ...(["b", "c", "d"] as const).flatMap((letter, index) =>
        group(`TA7${letter}`, [
            new Paragraph({
                tabStops: [{ type: [TabStopType.RIGHT, TabStopType.CENTER, TabStopType.DECIMAL][index], position: 6000 }],
                children: [new TextRun(`TA7${letter}\t`), new TextRun({ text: "12.5 boxed", border })],
            }),
        ]),
    ),
    newPage(),
    ...[9100, 9500, 10000, 12000].flatMap((position, index) =>
        group(`TA8${"abcd"[index]}`, [
            tabPara("x", `TA8${"abcd"[index]}\tleft`, [{ type: TabStopType.LEFT, position }]),
            line(`TA8${"abcd"[index]} next`),
        ]),
    ),
    ...group("TA8e", [
        tabPara("x", `${proseTo("TA8e", LINE - 200).text}\tleft`, [{ type: TabStopType.LEFT, position: 9500 }]),
        line("TA8e next"),
    ]),
    ...group("TA8f", [tabPara("x", `TA8f\t${prose(30)}`, [{ type: TabStopType.LEFT, position: 9500 }]), line("TA8f next")]),
    ...group("TA8g", [
        tabPara("x", "TA8g\tleft", [{ type: TabStopType.LEFT, position: 9500 }], { indent: { right: 1000 } }),
        line("TA8g next"),
    ]),
    ...group("TA8h", [tabPara("x", "TA8h\tright", [{ type: TabStopType.RIGHT, position: 9500 }]), line("TA8h next")]),
    newPage(),
    ...[0.3, 0.5, 0.7, 0.9].flatMap((share, index) => {
        const name = `SH10${"abcd"[index]}`;
        const hyphenated = `Donau${SOFT}dampf${SOFT}schiff${SOFT}fahrts${SOFT}gesell${SOFT}schaft`;
        const whole = twips(hyphenated.replace(new RegExp(SOFT, "g"), ""));
        const { text } = proseTo(name, LINE - whole * (1 - share) - 120);
        return group(name, [
            new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun(`${text} ${hyphenated} ${prose(30)}`)] }),
        ]);
    }),
    ...group("SH11", [
        new Paragraph({
            children: [
                new TextRun(`${proseTo("SH11", LINE - 1200).text} `),
                new TextRun({ text: `Donau${SOFT}dampf${SOFT}schiff${SOFT}fahrts`, border }),
                new TextRun(` ${prose(20)}`),
            ],
        }),
    ]),
    ...group("SH12", [line(`SH12 ${"lighthousekeeper".repeat(9)}${SOFT}${"surveyor".repeat(4)} ${prose(10)}`)]),
    newPage(),
    ...[0, 3, 6, 10, 15, 20, 23, 30].flatMap((before, index) =>
        group(`SH13${"abcdefgh"[index]}`, [hyphenAt(`SH13${"abcdefgh"[index]}`, before)]),
    ),
    newPage(),
    ...group("SH14a", [
        new Table({
            borders: ALL_BORDERS,
            rows: [new TableRow({ children: [cell(`SH14a lighthouse${SOFT}keeperships`), cell("SH14a other")] })],
        }),
    ]),
    ...group("SH14b", [
        new Table({
            borders: ALL_BORDERS,
            rows: [new TableRow({ children: [cell(`SH14b light${SOFT}house sur${SOFT}veyors`), cell("SH14b other")] })],
        }),
    ]),
    ...group("SH14c", [
        new Table({
            borders: ALL_BORDERS,
            rows: [new TableRow({ children: [cell(`SH14c lighthouse${SOFT}keeperships`), cell(`SH14c ${prose(60)}`)] })],
        }),
    ]),
    ...group("SH15a", [
        new Paragraph({ children: [new TextRun({ text: `SH15a ${prose(10)} AVATAR${SOFT}AVATAR Tef${SOFT}fy ${prose(30)}`, kern: 2 })] }),
    ]),
    ...group("SH15b", [line(`SH15b ${prose(10)} of${SOFT}fice ef${SOFT}fi${SOFT}cient ${prose(30)}`)]),
    newPage(),
    ...[
        ["JU1a", " "],
        ["JU1b", " "],
        ["JU1c", "　"],
    ].flatMap(([name, space]) => {
        const words = WORDS19.slice(0, 10);
        const first = `${name}${space}${words.join(space)}${space}lighthouse`;
        return group(name, [
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                indent: { right: Math.round(LINE - (twips(first) - twips("lighthouse") * 0.1)) },
                children: [new TextRun(`${first} ${prose(30)}`)],
            }),
        ]);
    }),
    ...group("JU2", [
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { right: Math.round(LINE - (twips(`JU2 ${WORDS19.join(" ")} lighthouse`) - twips("lighthouse") * 0.1)) },
            children: [
                new TextRun("JU2 of the "),
                new TextRun({ text: "by in", border }),
                new TextRun(` ${WORDS19.slice(4).join(" ")} lighthouse ${prose(30)}`),
            ],
        }),
    ]),
    newPage(),
    ...(
        [
            ["a", AlignmentType.DISTRIBUTE],
            ["b", AlignmentType.THAI_DISTRIBUTE],
            ["c", AlignmentType.LOW_KASHIDA],
        ] as const
    ).flatMap(([letter, alignment]) => [
        ...Array.from({ length: 17 }, (_, step) =>
            group(`JU3${letter}${twoDigits(step)}`, [squeezed(`JU3${letter}${twoDigits(step)}`, step / 100, alignment)]),
        ).flat(),
        newPage(),
    ]),
];

await write({ name: "word-stops-tabs", sections: [{ properties: PAGE, children }], injections: [softHyphens()] });
