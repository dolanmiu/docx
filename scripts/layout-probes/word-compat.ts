/**
 * Probes of the compatibility settings Word writes in every document it makes, after `compatibilityMode` 15:
 * `overrideTableStyleFontSizeAndJustification`, `enableOpenTypeFeatures`, `doNotFlipMirrorIndents`,
 * `differentiateMultirowTableHeaders` and `useWord2013TrackBottomHyphenation`, all on. docx writes none of them, so the same
 * probes are written twice: `word-compat-on.docx` with them, as Word writes them, and `word-compat-off.docx` without,
 * as docx writes a document. Whether Word lays the two out alike says whether the settings change its lines in
 * compatibility mode 15. Each line's text names its probe. Calibri on A4 with 1440 margins. Normal has 12 points and left
 * alignment of its own, over the document's 11 points, single spaced with no space before or after. word-compat.py reads
 * both.
 *
 * CS1: a table style of 9 points and justified paragraphs (`CompatTable`), and paragraphs in Normal in it (CS1a), in a
 *      style based on Normal with nothing of its own (CS1b), and in Normal in a table without that style (CS1c). By
 *      [MS-DOCX], without `overrideTableStyleFontSizeAndJustification`, Normal's 12 points and left alignment don't
 *      override the table style's; with it, they do, as ISO/IEC 29500 has it. `word-watertight-settings.docx` ST2 had
 *      Normal at the document's own 11 points, which won either way
 * CS2: a table style whose first row is 16 points, and whose bands of rows are 14 and 10 points (`CompatHeaders`), with
 *      its first row and bands turned on, in tables of 2 header rows (CS2a), 3 (CS2b), 1 (CS2c) and none (CS2d), and of 2
 *      that breaks across pages (CS2e), and of 2 with the first row turned off (CS2f): which rows take which part, by
 *      their heights. Their paragraphs are in a style of no size of its own, at the document's 11 points, as Normal's
 *      own size is over the table style's (`word-watertight-tables.docx` TB8). By [MS-DOCX],
 *      `differentiateMultirowTableHeaders` changes how the parts for rows apply to a header of several rows
 * CS3: Calibri text kerned (`w:kern`, CS3a) and not (CS3b), with ligatures (`w14:ligatures`, CS3c) and without (CS3d),
 *      and figures spaced proportionally (`w14:numSpacing`, CS3e), as tables (CS3f) and as the font has them (CS3g): how
 *      wide each is. By [MS-DOCX], `enableOpenTypeFeatures` turns these on. `word-watertight-text.docx` TX14 and
 *      `word-fonts.docx` showed Word joining ligatures and kerning without it
 * CS4: a line that ends at a hyphen in a word ("well-known"), the last on its page (CS4a), and the first on the next
 *      (CS4b). By [MS-DOCX], `useWord2013TrackBottomHyphenation` moves the line, or the word, of a hyphenated word that
 *      ends a page to the next page: whether a hyphen in the text counts
 *
 * docx can't write some of these, so it writes a marker that this script replaces in the XML: see `INJECTIONS`.
 */
// cspell:ignore bbox Calibri kerned
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    AlignmentType,
    Document,
    type ISectionOptions,
    LineRuleType,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

import { measureTextWidth } from "../../src/text-layout/text-width";

const WIDTH = 9026;
const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });

/** A table the width of the page, of one column, without borders or cell margins, of these cells' paragraphs */
const table = (
    cells: readonly (readonly Paragraph[])[],
    options: Partial<ConstructorParameters<typeof Table>[0]> = {},
    headers = 0,
): Table =>
    new Table({
        width: { size: WIDTH, type: WidthType.DXA },
        columnWidths: [WIDTH],
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: cells.map(
            (children, index) =>
                new TableRow({
                    ...(index < headers ? { tableHeader: true } : {}),
                    children: [new TableCell({ width: { size: WIDTH, type: WidthType.DXA }, children: [...children] })],
                }),
        ),
        ...options,
    });

/** A probe on a page of its own: a line above it, what it is, and a line below it */
const around = (probe: string, ...children: (Table | Paragraph)[]): ISectionOptions => ({
    children: [line(`${probe} above`), ...children, line(`${probe} below`)],
});

/** CS1: 10 one-line paragraphs and a 5-line one in a table, made by `make`, the table in `style` when it is given */
const cs1 = (probe: string, make: (text: string) => Paragraph, style?: string): ISectionOptions =>
    around(
        probe,
        table([[...Array.from({ length: 10 }, (_, i) => make(`${probe} para ${i + 1}`)), make(`${probe} prose ${prose(80)}`)]], {
            ...(style === undefined ? {} : { style }),
        }),
    );

/**
 * CS2: a table of `rows` one-line rows, the first `headers` of them header rows, in `CompatHeaders`, with its first row
 * turned on unless `firstRow` is false
 */
const cs2 = (probe: string, rows: number, headers: number, firstRow = true): ISectionOptions =>
    around(
        probe,
        table(
            Array.from({ length: rows }, (_, i) => [
                new Paragraph({ style: "CompatPlain", children: [new TextRun(`${probe} row ${i + 1}`)] }),
            ]),
            {
                style: "CompatHeaders",
                tableLook: { firstRow, lastRow: false, firstColumn: false, lastColumn: false, noHBand: false, noVBand: true },
            },
            headers,
        ),
    );

// The text of CS3's lines: pairs Calibri kerns, words it joins letters of, and figures
const KERNED = "AVATAR WAVE Tokyo Yale LTA PAY AWAY TAVERN VOYAGE Te Yo";
const LIGATURES = "official affluent fifty fjord office suffix";
const FIGURES = "1111111111 2020202020 1717171717";

/** CS4: a paragraph whose first line ends at the hyphen of "well-known", as docx/layout's widths of Calibri 12 measure it */
const hyphenated = (probe: string): Paragraph => {
    const font = { font: "Calibri", size: 12 };
    const width = WIDTH / 20;
    const head = `${probe} ${prose(12)}`;
    // A word of m's and i's that ends the line with "well-" 3 to 8 points short of the margin, so that "known" (27 points)
    // doesn't fit after it, and the line can only break at the hyphen
    const tuned = Array.from({ length: 40 }, (_, ms) => Array.from({ length: 12 }, (__, is) => "m".repeat(ms) + "i".repeat(is)))
        .flat()
        .find((word) => {
            const end = measureTextWidth(`${head} ${word} well-`, font);
            return end >= width - 8 && end <= width - 3;
        });
    return new Paragraph({ widowControl: false, children: [new TextRun(`${head} ${tuned} well-known ${prose(40)}`)] });
};

const sections: ISectionOptions[] = [
    cs1("CS1a", (text) => new Paragraph({ children: [new TextRun(text)] }), "CompatTable"),
    cs1("CS1b", (text) => new Paragraph({ style: "CompatBody", children: [new TextRun(text)] }), "CompatTable"),
    cs1("CS1c", (text) => new Paragraph({ children: [new TextRun(text)] })),
    cs2("CS2a", 6, 2),
    cs2("CS2b", 6, 3),
    cs2("CS2c", 6, 1),
    cs2("CS2d", 6, 0),
    cs2("CS2e", 60, 2),
    cs2("CS2f", 6, 2, false),
    {
        children: [
            line("CS3 above"),
            new Paragraph({ children: [new TextRun("CS3a kerned "), new TextRun({ text: KERNED, kern: 2 })] }),
            new Paragraph({ children: [new TextRun("CS3b plain "), new TextRun(KERNED)] }),
            // Ligatures, and figures spaced, are written as noProof, imprint and emboss, then replaced: see INJECTIONS
            new Paragraph({ children: [new TextRun("CS3c joined "), new TextRun({ text: LIGATURES, noProof: true })] }),
            new Paragraph({ children: [new TextRun("CS3d plain "), new TextRun(LIGATURES)] }),
            new Paragraph({ children: [new TextRun("CS3e proportional "), new TextRun({ text: FIGURES, imprint: true })] }),
            new Paragraph({ children: [new TextRun("CS3f tabular "), new TextRun({ text: FIGURES, emboss: true })] }),
            new Paragraph({ children: [new TextRun("CS3g plain "), new TextRun(FIGURES)] }),
            line("CS3 below"),
        ],
    },
    // CS4: 46 lines, then the paragraph whose first line ends at the hyphen, the 47th and last line on the page, then
    // the same paragraph again
    {
        children: [
            ...Array.from({ length: 46 }, (_, i) => line(i === 0 ? "CS4 top" : `CS4 fill ${i}`)),
            hyphenated("CS4a"),
            hyphenated("CS4b"),
            line("CS4 below"),
        ],
    },
];

/** Table styles docx can't write, added to styles.xml */
const ZERO_MARGINS =
    '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar>';
const TABLE_STYLES = [
    '<w:style w:type="table" w:styleId="CompatTable"><w:name w:val="Compat Table"/><w:basedOn w:val="TableNormal"/>',
    '<w:pPr><w:jc w:val="both"/></w:pPr><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>',
    `<w:tblPr>${ZERO_MARGINS}</w:tblPr></w:style>`,
    '<w:style w:type="table" w:styleId="CompatHeaders"><w:name w:val="Compat Headers"/><w:basedOn w:val="TableNormal"/>',
    `<w:tblPr><w:tblStyleRowBandSize w:val="1"/>${ZERO_MARGINS}</w:tblPr>`,
    '<w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:tblStylePr>',
    '<w:tblStylePr w:type="band1Horz"><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:tblStylePr>',
    '<w:tblStylePr w:type="band2Horz"><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:tblStylePr></w:style>',
].join("");

/** [what docx writes, what replaces it], in document.xml: OpenType features at the end of the run's properties */
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    [/<w:noProof\/>((?:(?!<\/w:rPr>).)*)<\/w:rPr>/g, '$1<w14:ligatures w14:val="standardContextual"/></w:rPr>'],
    [/<w:imprint\/>((?:(?!<\/w:rPr>).)*)<\/w:rPr>/g, '$1<w14:numSpacing w14:val="proportional"/></w:rPr>'],
    [/<w:emboss\/>((?:(?!<\/w:rPr>).)*)<\/w:rPr>/g, '$1<w14:numSpacing w14:val="tabular"/></w:rPr>'],
];

// Word's own compatibility settings for the documents it makes, after compatibilityMode, as Word 16 writes them
const WORD_COMPATIBILITY = [
    "overrideTableStyleFontSizeAndJustification",
    "enableOpenTypeFeatures",
    "doNotFlipMirrorIndents",
    "differentiateMultirowTableHeaders",
    "useWord2013TrackBottomHyphenation",
]
    .map((name) => `<w:compatSetting w:name="${name}" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>`)
    .join("");

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 } } },
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO } },
                run: { size: 24 },
            },
            { id: "CompatBody", name: "Compat Body", basedOn: "Normal" },
            // CS2's paragraphs, in a style of no size, as a paragraph style's own size is over a table style's
            {
                id: "CompatPlain",
                name: "Compat Plain",
                paragraph: { spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO } },
            },
        ],
    },
    sections,
});

const main = async (): Promise<void> => {
    mkdirSync("build/word-probes", { recursive: true });
    for (const [name, compatibility] of [
        ["word-compat-on", WORD_COMPATIBILITY],
        ["word-compat-off", ""],
    ] as const) {
        const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
        const styles = await zip.file("word/styles.xml")!.async("string");
        zip.file("word/styles.xml", styles.replace("</w:styles>", `${TABLE_STYLES}</w:styles>`));
        const body = await zip.file("word/document.xml")!.async("string");
        zip.file(
            "word/document.xml",
            INJECTIONS.reduce((xml, [marker, replacement]) => xml.replace(marker, replacement), body),
        );
        const settings = await zip.file("word/settings.xml")!.async("string");
        zip.file("word/settings.xml", settings.replace(/(<w:compatSetting [^>]*w:name="compatibilityMode"[^>]*\/>)/, `$1${compatibility}`));
        writeFileSync(`build/word-probes/${name}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
    }
};

void main();
