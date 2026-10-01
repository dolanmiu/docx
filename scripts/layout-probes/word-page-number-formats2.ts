// More probes of how Word writes page numbers, after word-page-number-formats.ts, whose PDF from Word showed that page
// numbers aren't always written as list numbers are: some formats write "Error!" or nothing for 1234 where lists repeat
// their letters. Each line's text names its probe, so the lines can be found in a PDF saved from Word with pdftotext. Open
// the document in Word, say yes to updating its fields, and save it as a PDF beside it. Read the PDF with
// word-page-number-formats.py, which reads these probes too.
//
// P: a page in each format at the numbers around where its letters repeat, where lists start over, and at 0
// C: chapter numbers: after a heading that isn't numbered, after one numbered on its own as well as by its style
//    (C13), from a level whose text has no number in it (C14), and from a style based on heading 1 (C15)
//
// Usage: npm run run-ts -- scripts/layout-probes/word-page-number-formats2.ts, which writes build/word-probes/word-page-number-formats2.docx
import * as fs from "fs";
import {
    AlignmentType,
    Bookmark,
    Document,
    Header,
    HeadingLevel,
    ISectionOptions,
    LevelFormat,
    Packer,
    PageNumber,
    PageReference,
    Paragraph,
    TextRun,
} from "docx";

/** The numbers of the pages to probe in each format */
const PROBES: Readonly<Record<string, readonly number[]>> = {
    lowerLetter: [26, 27, 52, 53, 779, 780, 781],
    upperLetter: [780, 781],
    chicago: [5, 8, 9, 40, 41, 99, 100, 101, 120, 121],
    russianLower: [29, 30, 58, 59, 869, 870, 871],
    russianUpper: [870, 871],
    arabicAlpha: [28, 29, 56, 57, 839, 840, 841, 1175, 1176, 1177],
    arabicAbjad: [840, 841, 1176, 1177],
    hebrew1: [15, 16, 99, 100, 399, 400, 401, 499, 500, 783, 784, 785, 999, 1000],
    hebrew2: [22, 23, 44, 45, 100, 400, 401, 783, 784, 785, 1000],
    hindiVowels: [37, 38, 74, 75, 1109, 1110, 1111],
    hindiConsonants: [18, 19, 36, 37, 539, 540, 541],
    thaiLetters: [41, 42, 82, 83, 1229, 1230, 1231],
    taiwaneseCountingThousand: [10, 11, 20, 99, 100, 101, 110, 999, 1000, 1001],
    vietnameseCounting: [99, 100, 101, 999, 1000, 1001],
    japaneseDigitalTenThousand: [9999, 10000],
    hex: [65535, 65536],
    upperRoman: [32767, 32768],
    decimalFullWidth: [32767, 32768],
    aiueo: [32767, 32768],
    ...Object.fromEntries(
        [
            "ideographDigital",
            "japaneseCounting",
            "aiueo",
            "iroha",
            "decimalFullWidth",
            "decimalHalfWidth",
            "japaneseLegal",
            "japaneseDigitalTenThousand",
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
            "upperRoman",
            "lowerLetter",
            "ordinalText",
            "numberInDash",
            "hebrew1",
            "hebrew2",
            "arabicAlpha",
            "arabicAbjad",
            "hindiVowels",
            "hindiConsonants",
            "hindiNumbers",
            "thaiLetters",
            "thaiNumbers",
            "dollarText",
        ].map((format) => [`${format} `, [0]]),
    ),
};

const line = (...children: (string | TextRun | Bookmark | PageReference)[]): Paragraph =>
    new Paragraph({ children: children.map((child) => (typeof child === "string" ? new TextRun(child) : child)) });
const page = (): TextRun => new TextRun({ children: [PageNumber.CURRENT] });

// P: a section for each format and start, with a bookmark on its page. Formats probed at 0 alone are named with a space
const pageProbes = Object.entries(PROBES).flatMap(([name, starts]) =>
    starts.map((start) => ({ format: name.trim(), start, bookmark: `P_${name.trim()}_${start}` })),
);
const pageSections: ISectionOptions[] = pageProbes.map(({ format, start, bookmark }) => ({
    properties: { page: { pageNumbers: { start, formatType: format as never } } },
    children: [line(new Bookmark({ id: bookmark, children: [new TextRun(`P ${format} ${start}:`)] }), " ", page(), " end")],
}));

// C: chapter numbers from headings 1 and 2, numbered "Chapter %1" and "Appendix" through their styles, and a style based
// on heading 1
const header = new Header({ children: [line("header ", page(), " hend")] });
const chapterBookmarks: string[] = [];
const bookmarked = (name: string, text: string): Paragraph => {
    const id = `C_${name}_${text.replace(/ /g, "_")}`;
    chapterBookmarks.push(id);
    return line(new Bookmark({ id, children: [new TextRun(`${name} ${text}`)] }), " ", page(), " end");
};
const heading = (name: string, options: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}): Paragraph =>
    new Paragraph({ heading: HeadingLevel.HEADING_1, ...options, children: [new TextRun(`${name} heading`)] });
const chapterCases: { readonly level: number; readonly children: Paragraph[] }[] = [
    {
        level: 1,
        children: [heading("C12"), bookmarked("C12", "body"), heading("C12 unnumbered", { numbering: false }), bookmarked("C12", "after")],
    },
    {
        level: 1,
        children: [heading("C13", { numbering: { reference: "own", level: 0, custom: true } }), bookmarked("C13", "after")],
    },
    {
        level: 2,
        children: [new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("C14 heading")] }), bookmarked("C14", "after")],
    },
    { level: 1, children: [new Paragraph({ style: "MyChapter", children: [new TextRun("C15 heading")] }), bookmarked("C15", "after")] },
];
const chapterSections: ISectionOptions[] = chapterCases.map(({ level, children }) => ({
    properties: { page: { pageNumbers: { start: 1, chapterHeadingLevel: level } } },
    headers: { default: header },
    children,
}));

// R: the page references, which Word writes when it updates the document's fields
const reference = (bookmark: string): Paragraph => line(`R ${bookmark}: `, new PageReference(bookmark), " end");
const referenceSection: ISectionOptions = {
    properties: { page: { pageNumbers: { start: 1 } } },
    headers: { default: new Header({ children: [] }) },
    children: [...pageProbes.map(({ bookmark }) => bookmark), ...chapterBookmarks].map(reference),
};

const doc = new Document({
    features: { updateFields: true },
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            { id: "Heading1", name: "heading 1", run: { size: 28 }, paragraph: { numbering: { reference: "chapter", level: 0 } } },
            { id: "Heading2", name: "heading 2", run: { size: 26 }, paragraph: { numbering: { reference: "appendix", level: 0 } } },
            { id: "MyChapter", name: "My Chapter", basedOn: "Heading1", next: "Normal" },
        ],
    },
    numbering: {
        config: [
            {
                reference: "chapter",
                levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "Chapter %1", start: 1, alignment: AlignmentType.LEFT }],
            },
            {
                reference: "appendix",
                levels: [{ level: 0, format: LevelFormat.UPPER_LETTER, text: "Appendix", start: 1, alignment: AlignmentType.LEFT }],
            },
            { reference: "own", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1)", start: 5, alignment: AlignmentType.LEFT }] },
        ],
    },
    sections: [...pageSections, ...chapterSections, referenceSection],
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-page-number-formats2.docx", buffer));
