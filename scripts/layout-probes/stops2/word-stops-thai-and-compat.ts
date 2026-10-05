// cspell:ignore สวัสดี ภาษาไทย กกกกกกกกกก
/**
 * Probes of Thai and Arabic justification, and of the two compatibility settings that change Word's lines, where
 * docx/layout stops. Three documents.
 *
 * word-stops-thai.docx: "Thai or Arabic text justified for it" (docx's demos text/thai-distributed and
 * text/thai-distributed-with-indent stop here) and "a paragraph justified for Arabic with a medium or high kashida".
 * `word-justify.docx` J14 and `word-justify2.docx` K08, K09 had Latin text only. It also has the widths of Thai, Arabic
 * and Hebrew letters, which docx/layout measures as an average letter of the font without stopping.
 *   TH1a to TH1e: a paragraph of 60 Thai words (สวัสดี, ภาษาไทย and the like, with spaces between some, as Thai is written)
 *     in the document's Calibri 11, as docx's Thai demos write it, each alignment: left (a), justified (b), distributed (c), thaiDistribute (d), and
 *     thaiDistribute with a right indent of 2000 (e)
 *   TH2a to TH2e: the same in Arabic (w:rtl, w:bidi): right (a), justified (b), lowKashida (c),
 *     mediumKashida (d), highKashida (e)
 *   TH3a to TH3c: ten of each Thai consonant and vowel (a), each Arabic letter in its isolated form (b), and each Hebrew
 *     letter (c), one equation-free line per character, "TH3a u0e01 กกกกกกกกกก after", for each letter's width
 *
 * word-stops-top-spacing.docx: `suppressTopSpacing` on (w:compat). `word-compat-settings2-suppressTopSpacing.docx`
 * (CP14, CP15, CP20) showed the lines after the first line of a page move up 288 twips when it is at exactly 30 points,
 * 125 to 130 at exactly 20, and 408 at least 30, which no rule explains. "a compatibility setting not yet followed".
 * docx's demo document-settings/compatibility-options sets it.
 *   ST1a to ST1l: a page whose first line is a paragraph of two lines at exactly 10, 12, 14, 16, 18, 20, 24, 30, 36,
 *     40, 50 and 60 points, in Calibri 11, then lines of single spacing
 *   ST2a to ST2f: the same at least 10, 14, 20, 30, 40 and 60 points
 *   ST3a to ST3c: the first line at exactly 30 points in Times New Roman 12 (a), Courier New 11 (b), Calibri 24 (c)
 *   ST4a to ST4d: the first line exactly 30 after a page break (a), at the top of a column (b), of a table row (c), and
 *     after a section break to a new page (d)
 *   ST5: a paragraph at exactly 30 points with 12 points before it, at a page's top
 *
 * word-stops-fe-layout.docx: `useFELayout` on. CP19b showed it spaces Latin letters apart from Japanese, and with its
 * group of East Asian settings (CP9) Latin lines changed too.
 *   FE1a to FE1f: Japanese prose in MS Mincho 10.5 with Latin words, numbers, and a word in Calibri between ideographs;
 *     with autoSpaceDE and autoSpaceDN off (b), and in a paragraph of Latin text only (c, Calibri 11 prose; d, Times New
 *     Roman 12; e, justified Calibri prose; f, Calibri prose with a tab)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-thai-and-compat.ts [folder]
 */
import { AlignmentType, LineRuleType, Paragraph, SectionType, Table, TableRow, TextRun, WidthType } from "docx";

import { ALL_BORDERS, type Child, PAGE, cell, fill, group, line, newPage, para, probe, prose, write } from "./kit";

/* cspell:disable */
const THAI_WORDS = ["สวัสดี", "ภาษาไทย", "การสำรวจ", "ชายฝั่ง", "ทำใน", "ฤดูร้อน", "โดยเรือ", "และเดินเท้า", "จากประภาคาร", "ถึงปากแม่น้ำ"];
const thai = (count: number): string =>
    Array.from({ length: count }, (_, index) => THAI_WORDS[index % THAI_WORDS.length] + (index % 3 === 2 ? " " : "")).join("");
const ARABIC_WORDS = ["المسح", "الساحل", "صنع", "في", "الصيف", "بالقارب", "وعلى", "الأقدام", "من", "المنارة", "إلى", "مصب", "النهر"];
/* cspell:enable */
const arabic = (count: number): string => Array.from({ length: count }, (_, index) => ARABIC_WORDS[index % ARABIC_WORDS.length]).join(" ");

const ALIGN = {
    left: AlignmentType.LEFT,
    right: AlignmentType.RIGHT,
    both: AlignmentType.JUSTIFIED,
    distribute: AlignmentType.DISTRIBUTE,
    thaiDistribute: AlignmentType.THAI_DISTRIBUTE,
    lowKashida: AlignmentType.LOW_KASHIDA,
    mediumKashida: AlignmentType.MEDIUM_KASHIDA,
    highKashida: AlignmentType.HIGH_KASHIDA,
} as const;

const thaiPara = (name: string, alignment: keyof typeof ALIGN, indent = 0): Paragraph =>
    new Paragraph({
        alignment: ALIGN[alignment],
        ...(indent ? { indent: { right: indent } } : {}),
        children: [new TextRun({ text: `${name} ` }), new TextRun({ text: thai(60) })],
    });
const arabicPara = (name: string, alignment: keyof typeof ALIGN): Paragraph =>
    new Paragraph({
        alignment: ALIGN[alignment],
        bidirectional: true,
        children: [new TextRun({ text: `${name} ` }), new TextRun({ text: arabic(60), rightToLeft: true })],
    });

const range = (first: number, last: number): string[] =>
    Array.from({ length: last - first + 1 }, (_, index) => String.fromCodePoint(first + index));
const THAI_LETTERS = range(0x0e01, 0x0e2e).concat(
    range(0x0e30, 0x0e3a).filter((c) => !/\p{M}/u.test(c)),
    range(0x0e40, 0x0e46),
    range(0x0e50, 0x0e59),
);
const ARABIC_LETTERS = range(0x0621, 0x063a).concat(range(0x0641, 0x064a), range(0x0660, 0x0669));
const HEBREW_LETTERS = range(0x05d0, 0x05ea);
const widths = (name: string, letters: readonly string[], run: object): Paragraph[] =>
    letters.map(
        (letter) =>
            new Paragraph({
                children: [
                    new TextRun(`${name} u${letter.codePointAt(0)!.toString(16).padStart(4, "0")} `),
                    new TextRun({ text: letter.repeat(10), ...run }),
                    new TextRun(" after"),
                ],
            }),
    );

await write({
    name: "word-stops-thai",
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("TH1a", [thaiPara("TH1a", "left")]),
                ...group("TH1b", [thaiPara("TH1b", "both")]),
                ...group("TH1c", [thaiPara("TH1c", "distribute")]),
                ...group("TH1d", [thaiPara("TH1d", "thaiDistribute")]),
                ...group("TH1e", [thaiPara("TH1e", "thaiDistribute", 2000)]),
                ...probe("TH2a", [arabicPara("TH2a", "right")]),
                ...group("TH2b", [arabicPara("TH2b", "both")]),
                ...group("TH2c", [arabicPara("TH2c", "lowKashida")]),
                ...group("TH2d", [arabicPara("TH2d", "mediumKashida")]),
                ...group("TH2e", [arabicPara("TH2e", "highKashida")]),
                ...probe("TH3a", widths("TH3a", THAI_LETTERS, {})),
                ...probe("TH3b", widths("TH3b", ARABIC_LETTERS, { rightToLeft: true })),
                ...probe("TH3c", widths("TH3c", HEBREW_LETTERS, { rightToLeft: true })),
            ],
        },
    ],
});

const EXACT = [10, 12, 14, 16, 18, 20, 24, 30, 36, 40, 50, 60];
const AT_LEAST = [10, 14, 20, 30, 40, 60];
const topLine = (
    name: string,
    points: number,
    rule: (typeof LineRuleType)[keyof typeof LineRuleType],
    run: object = {},
    extra: object = {},
): Paragraph =>
    new Paragraph({
        pageBreakBefore: true,
        spacing: { line: points * 20, lineRule: rule },
        ...extra,
        children: [new TextRun({ text: `${name} first ${prose(24)}`, ...run })],
    });
const after = (name: string): Paragraph[] => [line(`${name} next 1`), line(`${name} next 2`), line(`${name} below`)];
const named = (prefix: string, index: number): string => `${prefix}${"abcdefghijklmnop"[index]}`;

const topSpacing: Child[] = [
    ...EXACT.flatMap((points, index) => [
        line(`${named("ST1", index)} above`),
        topLine(named("ST1", index), points, LineRuleType.EXACT),
        ...after(named("ST1", index)),
    ]),
    ...AT_LEAST.flatMap((points, index) => [
        line(`${named("ST2", index)} above`),
        topLine(named("ST2", index), points, LineRuleType.AT_LEAST),
        ...after(named("ST2", index)),
    ]),
    ...[
        { font: "Times New Roman", size: 24 },
        { font: "Courier New", size: 22 },
        { font: "Calibri", size: 48 },
    ].flatMap((run, index) => [
        line(`${named("ST3", index)} above`),
        topLine(named("ST3", index), 30, LineRuleType.EXACT, run),
        ...after(named("ST3", index)),
    ]),
    // ST4a: after a page break run, rather than pageBreakBefore
    line("ST4a above"),
    new Paragraph({ children: [new TextRun({ text: "", break: 0 }), new TextRun({ text: "ST4a break" }), new TextRun({ break: 1 })] }),
    new Paragraph({ spacing: { line: 600, lineRule: LineRuleType.EXACT }, children: [new TextRun(`ST4a first ${prose(24)}`)] }),
    ...after("ST4a"),
    ...probe("ST4c", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            borders: ALL_BORDERS,
            rows: [
                new TableRow({
                    children: [
                        cell([
                            new Paragraph({
                                spacing: { line: 600, lineRule: LineRuleType.EXACT },
                                children: [new TextRun(`ST4c first ${prose(24)}`)],
                            }),
                        ]),
                    ],
                }),
            ],
        }),
    ]),
    line("ST5 above"),
    topLine("ST5", 30, LineRuleType.EXACT, {}, { spacing: { line: 600, lineRule: LineRuleType.EXACT, before: 240 } }),
    ...after("ST5"),
];

await write({
    name: "word-stops-top-spacing",
    sections: [
        { properties: PAGE, children: topSpacing },
        // ST4b: the first line of the second column
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } },
            children: [
                line("ST4b above"),
                ...fill("ST4b", 50),
                new Paragraph({ spacing: { line: 600, lineRule: LineRuleType.EXACT }, children: [new TextRun(`ST4b first ${prose(10)}`)] }),
                ...after("ST4b"),
            ],
        },
        // ST4d: the first line of a section on a new page
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE },
            children: [
                new Paragraph({ spacing: { line: 600, lineRule: LineRuleType.EXACT }, children: [new TextRun(`ST4d first ${prose(24)}`)] }),
                ...after("ST4d"),
            ],
        },
    ],
    options: { compatibility: { suppressTopSpacing: true } },
});

const japanese = "日本語の文章にLatin wordsと数字123を含む。測量は夏に行われた。";
const fe: Child[] = [
    ...probe("FE1a", [line(`FE1a ${japanese.repeat(6)}`, {}, { font: { eastAsia: "MS Mincho", ascii: "Calibri" }, size: 21 })]),
    ...group("FE1b", [
        line(`FE1b ${japanese.repeat(6)}`, { autoSpaceEastAsianText: false } as object, {
            font: { eastAsia: "MS Mincho", ascii: "Calibri" },
            size: 21,
        }),
    ]),
    ...group("FE1c", [para("FE1c", 120)]),
    ...group("FE1d", [para("FE1d", 120, {}, { font: "Times New Roman", size: 24 })]),
    ...group("FE1e", [para("FE1e", 120, { alignment: AlignmentType.JUSTIFIED })]),
    ...group("FE1f", [line(`FE1f\t${prose(60)}`)]),
    newPage(),
];
await write({
    name: "word-stops-fe-layout",
    sections: [{ properties: PAGE, children: fe }],
    options: { compatibility: { useFELayout: true } },
});
