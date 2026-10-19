// Tables of contents of numbered headings, for Word to fill in: how Word starts each heading's entry with its number,
// and where it puts the tab stop after the number. Open each document in Word, update the table (update entire table)
// and save it: the committed .docx files are the ones Word saved. Word 16.114 for Mac, with its own Normal template.
//
// TN1: level 1 headings numbered with 1 to 22 figures ("1" to "1111111111111111111111"), each a list of its own
// TN2: numbers of other characters and formats, such as "Chapter 1:", "1.1", "(1)", "a)", "I." and a bullet, at levels 1
//      and 2
// TN3: a heading at each of the levels 1 to 9, numbered "1"
// TN4 (word-toc-numbers-font.docx): TN1's first ten in a document of Courier New 14 pt, without TOC styles of its own
// TN5: numbers followed by a space or by nothing (`w:suff`)
// TN6: TN2's after TN3 and TN5
//
// Word writes the number, then a tab and the heading, and gives the entry a left tab stop. It places the stop as its
// Normal template has it, not as the document does: past the number as wide as it is in Aptos 12 pt (128.2 twips for
// a figure), by 240 twips, and 240 more for each level of the table below the first, at the next multiple of 240 up to
// 1920, and where that falls past it (TN1 to TN3). So TN4's stops are TN1's. A number followed by a space or nothing is
// followed by a space, with no tab stop (TN5). After the entries at levels 7 to 9, Word places the stops on multiples of
// 200 up to 1600 instead (TN6), which docx doesn't follow: why it changes isn't known. It did so after an entry of TN5
// too, in documents made while probing.
// cspell:ignore Aptos
import * as fs from "fs";
import { AlignmentType, Document, HeadingLevel, LevelFormat, LevelSuffix, Packer, Paragraph, TableOfContents } from "docx";

type Format = (typeof LevelFormat)[keyof typeof LevelFormat];
type Probe = { readonly name: string; readonly level: number; readonly format: Format; readonly text: string; readonly suffix?: string };

const HEADINGS = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
] as const;

const figures = (count: number): readonly Probe[] =>
    Array.from({ length: count }, (_, index) => ({
        name: `TN1 ${index + 1}`,
        level: 0,
        format: LevelFormat.DECIMAL,
        // The last figure is the list's number, 1
        text: `${"1".repeat(index)}%1`,
    }));

/** Numbers of other characters and formats than figures */
const others = (probe: string): readonly Probe[] =>
    (
        [
            ["chapter", 0, LevelFormat.DECIMAL, "Chapter %1:"],
            ["section", 1, LevelFormat.DECIMAL, "Section %1.%2"],
            ["dotted", 1, LevelFormat.DECIMAL, "%1.%2"],
            ["brackets", 0, LevelFormat.DECIMAL, "(%1)"],
            ["letter", 0, LevelFormat.LOWER_LETTER, "%1)"],
            ["capital", 0, LevelFormat.UPPER_LETTER, "%1."],
            ["roman", 0, LevelFormat.UPPER_ROMAN, "%1."],
            ["bullet", 0, LevelFormat.BULLET, "•"],
            ["dash", 0, LevelFormat.BULLET, "-"],
            ["a and figure", 0, LevelFormat.DECIMAL, "a%1"],
        ] as const
    ).map(([name, level, format, text]) => ({ name: `${probe} ${name}`, level, format, text }));

const PROBES: readonly Probe[] = [
    ...figures(22),
    ...others("TN2"),
    ...Array.from({ length: 9 }, (_, level) => ({ name: `TN3 level ${level + 1}`, level, format: LevelFormat.DECIMAL, text: "1" })),
    { name: "TN5 space", level: 0, format: LevelFormat.DECIMAL, text: "%1", suffix: LevelSuffix.SPACE },
    { name: "TN5 nothing", level: 0, format: LevelFormat.DECIMAL, text: "%1", suffix: LevelSuffix.NOTHING },
    ...others("TN6"),
];

/** A document of the probes, each a heading numbered by a list of its own */
const documentOf = (probes: readonly Probe[], font?: { readonly font: string; readonly size: number }): Document =>
    new Document({
        styles: {
            ...(font ? { default: { document: { run: font } } } : {}),
            // docx has no Heading 7 to 9 of its own
            paragraphStyles: [7, 8, 9].map((level) => ({
                id: `Heading${level}`,
                name: `heading ${level}`,
                basedOn: "Normal",
                next: "Normal",
                paragraph: { outlineLevel: level - 1 },
            })),
        },
        numbering: {
            config: probes.map(({ name, level, format, text, suffix }) => ({
                reference: name,
                // The levels above a probe's are numbered too, for "%1.%2"
                levels: Array.from({ length: level + 1 }, (_, at) => ({
                    level: at,
                    format: at === level ? format : LevelFormat.DECIMAL,
                    text: at === level ? text : `%${at + 1}`,
                    alignment: AlignmentType.START,
                    ...(suffix && at === level ? { suffix } : {}),
                })),
            })),
        },
        sections: [
            {
                children: [
                    new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-9" }),
                    ...probes.map(
                        ({ name, level }) =>
                            new Paragraph({
                                text: name,
                                ...(level < HEADINGS.length ? { heading: HEADINGS[level] } : { style: `Heading${level + 1}` }),
                                numbering: { reference: name, level },
                            }),
                    ),
                ],
            },
        ],
    });

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(documentOf(PROBES)).then((buffer) => fs.writeFileSync("build/word-probes/word-toc-numbers.docx", buffer));
Packer.toBuffer(documentOf(figures(10), { font: "Courier New", size: 28 })).then((buffer) =>
    fs.writeFileSync("build/word-probes/word-toc-numbers-font.docx", buffer),
);
