/**
 * Probes of how Word lays out pages, sections and fields where docx/layout reads nothing or guesses, for the watertight
 * inventory. Each probe starts a page, and each line's text names its probe, so the lines can be found in a PDF saved
 * from Word with pdftotext -bbox-layout, which word-watertight.py reads. Calibri 11, single spaced, no space before or
 * after, on A4 with 1440 margins, so Word's lines are 268.55 twips and 51 fit on a page.
 *
 * PG1: a continuous section of 120 lines with other margins, from line 21 of a page: a bigger bottom margin, a smaller
 *      one, a bigger top one. Which margins the page the section starts on has, and the pages after
 * PG2: a continuous section that numbers its pages from 7, and from I: the numbers of the page it starts on and the next,
 *      shown by PAGE fields in the lines and the footer
 * PG3: a continuous section with its pages turned to landscape: whether it starts a new page
 * PG4: a picture floating in the header with text wrapping around it, reaching down beside the body: whether the body's
 *      lines go round it
 * PG5: line numbers (`w:lnNumType`): whether lines break where they do without them
 * PG6: page borders 31 points from the text (`w:pgBorders`): whether fewer lines fit
 * PG7: fields whose results Word may write itself: DATE written as 1 January 2000, the date blocks (`w:dayLong`), a page
 *      number block (`w:pgNum`), PAGE and SECTION written empty
 * PG8: endnotes that go on to the next page: whether the continuation separator takes a line above them there
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

import {
    BorderStyle,
    DayLong,
    Document,
    EndnoteReferenceRun,
    Footer,
    Header,
    HorizontalPositionRelativeFrom,
    type ISectionOptions,
    ImageRun,
    MonthLong,
    NumberFormat,
    Packer,
    PageBorderDisplay,
    PageBorderOffsetFrom,
    PageNumber,
    PageNumberElement,
    PageOrientation,
    Paragraph,
    SectionType,
    SimpleField,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionRelativeFrom,
    YearLong,
} from "docx";

const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });
const numbered = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} ${i + 1}`));

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

/** A grey PNG of one pixel, drawn at any size */
const pixel = (): Buffer => {
    const crc = (bytes: Buffer): number => {
        let value = ~0;
        for (const byte of bytes) {
            value ^= byte;
            for (let bit = 0; bit < 8; bit++) {
                value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
            }
        }
        return ~value >>> 0;
    };
    const chunk = (type: string, data: Buffer): Buffer => {
        const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length);
        const check = Buffer.alloc(4);
        check.writeUInt32BE(crc(body));
        return Buffer.concat([length, body, check]);
    };
    const header = Buffer.alloc(13);
    header.writeUInt32BE(1, 0);
    header.writeUInt32BE(1, 4);
    header.set([8, 0, 0, 0, 0], 8);
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", header),
        chunk("IDAT", deflateSync(Buffer.from([0, 0x80]))),
        chunk("IEND", Buffer.alloc(0)),
    ]);
};

const EMUS_PER_INCH = 914400;
const A4 = { width: 11906, height: 16838 };

const footer = (probe: string): Footer =>
    new Footer({ children: [new Paragraph({ children: [new TextRun({ children: [`${probe} footer page `, PageNumber.CURRENT] })] })] });

/** A line with the number of the page it is on, from a PAGE field */
const paged = (text: string): Paragraph => new Paragraph({ children: [new TextRun({ children: [`${text} page `, PageNumber.CURRENT] })] });

const sections: ISectionOptions[] = [
    // PG1a: 20 lines, then a continuous section with a bottom margin of 5000 and 80 lines
    { children: numbered("PG1a A", 20) },
    { properties: { type: SectionType.CONTINUOUS, page: { margin: { bottom: 5000 } } }, children: numbered("PG1a B", 120) },
    // PG1b: the same with a bottom margin of 720
    { children: numbered("PG1b A", 20) },
    { properties: { type: SectionType.CONTINUOUS, page: { margin: { bottom: 720 } } }, children: numbered("PG1b B", 120) },
    // PG1c: the same with a top margin of 4000
    { children: numbered("PG1c A", 20) },
    { properties: { type: SectionType.CONTINUOUS, page: { margin: { top: 4000 } } }, children: numbered("PG1c B", 120) },

    // PG2a: 30 lines, then a continuous section numbered from 7, with its page in each line and the footer
    { footers: { default: footer("PG2a") }, children: Array.from({ length: 30 }, (_, i) => paged(`PG2a A ${i + 1}`)) },
    {
        properties: { type: SectionType.CONTINUOUS, page: { pageNumbers: { start: 7 } } },
        footers: { default: footer("PG2a") },
        children: Array.from({ length: 60 }, (_, i) => paged(`PG2a B ${i + 1}`)),
    },
    // PG2b: the same numbered from I in capital roman numerals
    {
        footers: { default: footer("PG2b") },
        properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
        children: Array.from({ length: 30 }, (_, i) => paged(`PG2b A ${i + 1}`)),
    },
    {
        properties: { type: SectionType.CONTINUOUS, page: { pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } } },
        footers: { default: footer("PG2b") },
        children: Array.from({ length: 60 }, (_, i) => paged(`PG2b B ${i + 1}`)),
    },

    // PG3: 10 lines, then a continuous section on landscape pages
    {
        properties: { page: { pageNumbers: { formatType: NumberFormat.DECIMAL } } },
        footers: { default: new Footer({ children: [] }) },
        children: numbered("PG3 A", 10),
    },
    {
        // docx turns the page given for a landscape section, so it is given upright
        properties: {
            type: SectionType.CONTINUOUS,
            page: { size: { width: A4.width, height: A4.height, orientation: PageOrientation.LANDSCAPE } },
        },
        children: numbered("PG3 B", 10),
    },

    // PG4: a 2-inch picture in the header, floating 3 inches down the page and 4.5 inches across, text wrapping around it
    // on both sides, then prose
    {
        properties: { page: { size: { width: A4.width, height: A4.height, orientation: PageOrientation.PORTRAIT } } },
        headers: {
            default: new Header({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun("PG4 header "),
                            new ImageRun({
                                type: "png",
                                data: pixel(),
                                transformation: { width: 192, height: 192 },
                                floating: {
                                    horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 4.5 * EMUS_PER_INCH },
                                    verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 3 * EMUS_PER_INCH },
                                    wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES },
                                    margins: { left: 0, right: 0, top: 0, bottom: 0 },
                                },
                            }),
                        ],
                    }),
                ],
            }),
        },
        children: [line(`PG4 ${prose(500)}`)],
    },

    // PG5a: prose with line numbers; PG5b: the same without
    {
        headers: { default: new Header({ children: [] }) },
        properties: { lineNumbers: { countBy: 1 } },
        children: [line(`PG5a ${prose(160)}`)],
    },
    { children: [line(`PG5b ${prose(160)}`)] },

    // PG6: page borders 31 points from the text, around 80 lines
    {
        properties: {
            page: {
                borders: {
                    pageBorders: { display: PageBorderDisplay.ALL_PAGES, offsetFrom: PageBorderOffsetFrom.TEXT },
                    pageBorderTop: { style: BorderStyle.SINGLE, size: 24, color: "000000", space: 31 },
                    pageBorderBottom: { style: BorderStyle.SINGLE, size: 24, color: "000000", space: 31 },
                    pageBorderLeft: { style: BorderStyle.SINGLE, size: 24, color: "000000", space: 31 },
                    pageBorderRight: { style: BorderStyle.SINGLE, size: 24, color: "000000", space: 31 },
                },
            },
        },
        children: numbered("PG6", 80),
    },

    // PG7: fields Word may write itself
    {
        children: [
            new Paragraph({
                children: [new TextRun("PG7a date "), new SimpleField('DATE \\@ "d MMMM yyyy"', "1 January 2000"), new TextRun(" end")],
            }),
            new Paragraph({
                children: [new TextRun({ children: ["PG7b blocks ", new DayLong(), " ", new MonthLong(), " ", new YearLong(), " end"] })],
            }),
            new Paragraph({ children: [new TextRun({ children: ["PG7c pgnum ", new PageNumberElement(), " end"] })] }),
            new Paragraph({ children: [new TextRun({ children: ["PG7d page ", PageNumber.CURRENT, " end"] })] }),
            new Paragraph({ children: [new TextRun({ children: ["PG7e section ", PageNumber.CURRENT_SECTION, " end"] })] }),
        ],
    },

    // PG8: a line referring to 3 endnotes of 30 lines each, which go on over the next pages
    {
        children: [
            new Paragraph({
                children: [new TextRun("PG8 refs"), new EndnoteReferenceRun(1), new EndnoteReferenceRun(2), new EndnoteReferenceRun(3)],
            }),
        ],
    },
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            { id: "EndnoteText", name: "endnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
        ],
    },
    endnotes: Object.fromEntries(
        [1, 2, 3].map((note) => [
            note,
            {
                children: Array.from(
                    { length: 30 },
                    (_, i) => new Paragraph({ style: "EndnoteText", children: [new TextRun(`PG8 note ${note} line ${i + 1}`)] }),
                ),
            },
        ]),
    ),
    sections,
});

Packer.toBuffer(doc).then((buffer) => {
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-watertight-pages.docx", buffer);
});
