// Probes of how Word writes page numbers in each of its number formats (`w:pgNumType` `w:fmt`), and chapter numbers in
// page numbers (`w:chapStyle`, `w:chapSep`). Each line's text names its probe, so the lines can be found in a PDF saved
// from Word with pdftotext. Open the document in Word, say yes to updating its fields, and save it as a PDF beside it.
// Read the PDF with word-page-number-formats.py.
//
// P: a page in each format, started at 4, at 1234, and at 0 for some. Each page has a PAGE field, and a bookmark that a
//    PAGEREF field on the page after them all refers to (R)
// L: lists in each format, numbered 1 to 60, and at the larger numbers of JUMPS, to show the rest of each sequence. The
//    P pages show whether page numbers are written as list numbers are
// C: chapter numbers: each separator (C1), with a page number format (C2, C10), from headings of other levels and
//    numbering (C3 to C7), on a page whose heading isn't at the top (C8), before any heading (C9), and in a section with
//    no heading of its own (C11). Each page has a PAGE field in its text and in its header, and a bookmark that a PAGEREF
//    field on the last page refers to
//
// Usage: npm run run-ts -- scripts/layout-probes/word-page-number-formats.ts, which writes build/word-probes/word-page-number-formats.docx
import * as fs from "fs";
import {
    AlignmentType,
    Bookmark,
    Document,
    Header,
    HeadingLevel,
    ISectionOptions,
    LevelSuffix,
    Packer,
    PageNumber,
    PageNumberSeparator,
    PageReference,
    Paragraph,
    TextRun,
} from "docx";

const FORMATS = [
    "decimal",
    "upperRoman",
    "lowerRoman",
    "upperLetter",
    "lowerLetter",
    "ordinal",
    "cardinalText",
    "ordinalText",
    "hex",
    "chicago",
    "ideographDigital",
    "japaneseCounting",
    "aiueo",
    "iroha",
    "decimalFullWidth",
    "decimalHalfWidth",
    "japaneseLegal",
    "japaneseDigitalTenThousand",
    "decimalEnclosedCircle",
    "decimalFullWidth2",
    "aiueoFullWidth",
    "irohaFullWidth",
    "decimalZero",
    "bullet",
    "ganada",
    "chosung",
    "decimalEnclosedFullstop",
    "decimalEnclosedParen",
    "decimalEnclosedCircleChinese",
    "ideographEnclosedCircle",
    "ideographTraditional",
    "ideographZodiac",
    "ideographZodiacTraditional",
    "taiwaneseCounting",
    "ideographLegalTraditional",
    "taiwaneseCountingThousand",
    "taiwaneseDigital",
    "chineseCounting",
    "chineseLegalSimplified",
    "chineseCountingThousand",
    "koreanDigital",
    "koreanCounting",
    "koreanLegal",
    "koreanDigital2",
    "vietnameseCounting",
    "russianLower",
    "russianUpper",
    "none",
    "numberInDash",
    "hebrew1",
    "hebrew2",
    "arabicAlpha",
    "arabicAbjad",
    "hindiVowels",
    "hindiConsonants",
    "hindiNumbers",
    "hindiCounting",
    "thaiLetters",
    "thaiNumbers",
    "thaiCounting",
    "bahtText",
    "dollarText",
] as const;

type Format = (typeof FORMATS)[number];

/** Pages started at 0 too, for the formats whose 0 isn't obvious */
const ZERO: readonly Format[] = [
    "decimal",
    "lowerRoman",
    "upperLetter",
    "ordinal",
    "cardinalText",
    "decimalEnclosedCircle",
    "chicago",
    "hex",
];

/** Numbers past 60 that show how each sequence goes on */
const JUMPS = [
    0, 99, 100, 101, 110, 111, 120, 200, 999, 1000, 1001, 1100, 1234, 2000, 9999, 10000, 10001, 12345, 20000, 32767, 32768, 100000,
];

const line = (...children: (string | TextRun | Bookmark | PageReference)[]): Paragraph =>
    new Paragraph({ children: children.map((child) => (typeof child === "string" ? new TextRun(child) : child)) });
const page = (): TextRun => new TextRun({ children: [PageNumber.CURRENT] });

// P: a section for each format and start, with a bookmark on its page
const pageProbes = FORMATS.flatMap((format) =>
    [4, 1234, ...(ZERO.includes(format) ? [0] : [])].map((start) => ({ format, start, bookmark: `P_${format}_${start}` })),
);
const pageSections: ISectionOptions[] = pageProbes.map(({ format, start, bookmark }) => ({
    properties: { page: { pageNumbers: { start, formatType: format } } },
    children: [line(new Bookmark({ id: bookmark, children: [new TextRun(`P ${format} ${start}:`)] }), " ", page(), " end")],
}));

// L: one list per format numbered from 1, and a list for each jump, in one column, as pdftotext reads columns of lines that wrap out of order
const listReference = (format: Format, start: number): string => `L-${format}-${start}`;
const listConfigs = FORMATS.flatMap((format) =>
    [1, ...JUMPS].map((start) => ({
        reference: listReference(format, start),
        levels: [
            {
                level: 0,
                format: format as never,
                text: "%1",
                start,
                suffix: LevelSuffix.SPACE,
                style: { paragraph: { indent: { left: 0, hanging: 0 } }, run: { size: 16 } },
            },
        ],
    })),
);
const listItem = (format: Format, start: number, value: number): Paragraph =>
    new Paragraph({
        numbering: { reference: listReference(format, start), level: 0, custom: true },
        spacing: { after: 0 },
        children: [new TextRun({ text: `= ${format} ${value}`, size: 16 })],
    });
const listSection: ISectionOptions = {
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: FORMATS.flatMap((format) => [
        new Paragraph({ spacing: { before: 120, after: 0 }, children: [new TextRun({ text: `L ${format}:`, bold: true })] }),
        ...Array.from({ length: 60 }, (_, index) => listItem(format, 1, index + 1)),
        ...JUMPS.map((value) => listItem(format, value, value)),
    ]),
};

// C: chapter numbers. Headings 1 and 2 are numbered "Chapter %1" and "%1.%2" through their styles, heading 3 in upper
// roman numerals and heading 4 "(%1)" in lower letters, each in a list of its own, heading 5 isn't numbered, heading 6 is
// numbered on each paragraph rather than through its style, and heading 7 is numbered "%1" through its style
const header = new Header({ children: [line("header ", page(), " hend")] });
const chapterCases: { readonly name: string; readonly level: number; readonly pageNumbers?: object; readonly children: Paragraph[] }[] = [];
const chapterBookmarks: string[] = [];
const bookmarked = (name: string, text: string): Paragraph => {
    const id = `C_${name}_${text.replace(/ /g, "_")}`;
    chapterBookmarks.push(id);
    return line(new Bookmark({ id, children: [new TextRun(`${name} ${text}`)] }), " ", page(), " end");
};
const heading = (level: number, name: string, numbered = false): Paragraph =>
    new Paragraph({
        heading: [
            HeadingLevel.HEADING_1,
            HeadingLevel.HEADING_2,
            HeadingLevel.HEADING_3,
            HeadingLevel.HEADING_4,
            HeadingLevel.HEADING_5,
            HeadingLevel.HEADING_6,
            HeadingLevel.HEADING_7,
        ][level - 1],
        ...(numbered ? { numbering: { reference: "chapter-6", level: 0, custom: true } } : {}),
        children: [new TextRun(`${name} heading`)],
    });
const SEPARATORS = [
    ["C1a", PageNumberSeparator.HYPHEN],
    ["C1b", PageNumberSeparator.PERIOD],
    ["C1c", PageNumberSeparator.COLON],
    ["C1d", PageNumberSeparator.EM_DASH],
    ["C1e", PageNumberSeparator.EN_DASH],
] as const;
for (const [name, separator] of SEPARATORS) {
    chapterCases.push({ name, level: 1, pageNumbers: { start: 1, separator }, children: [heading(1, name), bookmarked(name, "body")] });
}
chapterCases.push(
    { name: "C2", level: 1, pageNumbers: { start: 4, formatType: "lowerRoman" }, children: [heading(1, "C2"), bookmarked("C2", "body")] },
    { name: "C3", level: 2, pageNumbers: { start: 1 }, children: [heading(2, "C3"), bookmarked("C3", "body")] },
    { name: "C4", level: 3, pageNumbers: { start: 1 }, children: [heading(3, "C4"), bookmarked("C4", "body")] },
    { name: "C5", level: 4, pageNumbers: { start: 1 }, children: [heading(4, "C5"), bookmarked("C5", "body")] },
    { name: "C6", level: 5, pageNumbers: { start: 1 }, children: [heading(5, "C6"), bookmarked("C6", "body")] },
    { name: "C7", level: 6, pageNumbers: { start: 1 }, children: [heading(6, "C7", true), bookmarked("C7", "body")] },
    {
        name: "C8",
        level: 1,
        pageNumbers: { start: 1 },
        children: [
            bookmarked("C8", "before"),
            heading(1, "C8"),
            bookmarked("C8", "after"),
            new Paragraph({ pageBreakBefore: true, children: [new TextRun("C8 next page "), page(), new TextRun(" end")] }),
        ],
    },
    {
        name: "C9",
        level: 7,
        pageNumbers: { start: 1 },
        children: [
            bookmarked("C9", "before"),
            new Paragraph({ pageBreakBefore: true, children: [new TextRun("C9 page 2 "), page(), new TextRun(" end")] }),
            heading(7, "C9"),
            bookmarked("C9", "after"),
        ],
    },
    {
        name: "C10",
        level: 1,
        pageNumbers: { start: 1, formatType: "upperLetter" },
        children: [heading(1, "C10"), bookmarked("C10", "body")],
    },
    { name: "C11", level: 1, pageNumbers: { start: 1 }, children: [bookmarked("C11", "no heading")] },
);
const chapterSections: ISectionOptions[] = chapterCases.map(({ level, pageNumbers, children }) => ({
    properties: { page: { pageNumbers: { ...pageNumbers, chapterHeadingLevel: level } } },
    headers: { default: header },
    children,
}));

// R: the page references, which Word writes when it updates the document's fields
const reference = (bookmark: string): Paragraph => line(`R ${bookmark}: `, new PageReference(bookmark), " end");
const noHeader = { default: new Header({ children: [] }) };
const referenceSection: ISectionOptions = {
    properties: { page: { pageNumbers: { start: 1 } } },
    headers: noHeader,
    children: [...pageProbes.map(({ bookmark }) => bookmark), ...chapterBookmarks].map(reference),
};

const chapterLevels = (format: string, text: string) => [
    { level: 0, format: format as never, text, start: 1, alignment: AlignmentType.LEFT },
];

const doc = new Document({
    features: { updateFields: true },
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            { id: "Heading1", name: "heading 1", run: { size: 28 }, paragraph: { numbering: { reference: "chapter-1", level: 0 } } },
            { id: "Heading2", name: "heading 2", run: { size: 26 }, paragraph: { numbering: { reference: "chapter-1", level: 1 } } },
            { id: "Heading3", name: "heading 3", run: { size: 24 }, paragraph: { numbering: { reference: "chapter-3", level: 0 } } },
            { id: "Heading4", name: "heading 4", run: { size: 24 }, paragraph: { numbering: { reference: "chapter-4", level: 0 } } },
            { id: "Heading7", name: "heading 7", run: { size: 24 }, paragraph: { numbering: { reference: "chapter-7", level: 0 } } },
        ],
    },
    numbering: {
        config: [
            ...listConfigs,
            {
                reference: "chapter-1",
                levels: [
                    { level: 0, format: "decimal", text: "Chapter %1", start: 1, alignment: AlignmentType.LEFT },
                    { level: 1, format: "decimal", text: "%1.%2", start: 1, alignment: AlignmentType.LEFT },
                ],
            },
            { reference: "chapter-3", levels: chapterLevels("upperRoman", "%1") },
            { reference: "chapter-4", levels: chapterLevels("lowerLetter", "(%1)") },
            { reference: "chapter-6", levels: chapterLevels("decimal", "%1.") },
            { reference: "chapter-7", levels: chapterLevels("decimal", "%1") },
        ],
    },
    sections: [...pageSections, ...chapterSections, referenceSection, listSection],
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-page-number-formats.docx", buffer));
