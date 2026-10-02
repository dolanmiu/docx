/**
 * Probes of the compatibility settings of the schema (`w:compat`) in compatibility mode 15: whether Word lays out lines
 * with them as without. Several change lines by their definitions, such as `noLeading`, `spacingInWholePoints` and
 * `noColumnBalance`, but Word 2013 and later may not follow them all in its own mode. The same probes are written nine
 * times: `word-compat-settings.docx` without any, and one with each group of them on, by what they are about:
 *
 * - `-heights`: the height of lines (`noLeading`, `noExtraLineSpacing`, `truncateFontHeightsLikeWP6`, `usePrinterMetrics`,
 *   `subFontBySize`, `adjustLineHeightInTable`, `noSpaceRaiseLower`, `spaceForUL`, `ulTrailSpace`)
 * - `-pages`: the top and foot of pages (`suppressTopSpacing`, `suppressBottomSpacing`, `suppressTopSpacingWP`,
 *   `suppressSpacingAtTopOfPage`, `suppressSpBfAfterPgBrk`, `splitPgBreakAndParaMark`)
 * - `-latin`: the widths of letters and spaces, and justification (`spacingInWholePoints`, `wpSpaceWidth`, `mwSmallCaps`,
 *   `useAnsiKerningPairs`, `wrapTrailSpaces`, `doNotExpandShiftReturn`, `wpJustification`)
 * - `-east-asian`: East Asian and complex script text (`balanceSingleByteDoubleByteWidth`, `doNotLeaveBackslashAlone`,
 *   `displayHangulFixedWidth`, `autoSpaceLikeWord95`, `lineWrapLikeWord6`, `useWord97LineBreakRules`,
 *   `applyBreakingRules`, `doNotWrapTextWithPunct`, `doNotUseEastAsianBreakRules`, `useAltKinsokuLineBreakRules`,
 *   `useFELayout`)
 * - `-paragraphs`: tabs, lists, indents and borders (`noTabHangInd`, `forgetLastTabAlignment`,
 *   `doNotUseIndentAsNumberingTabStop`, `underlineTabInNumList`, `useNormalStyleForList`, `allowSpaceOfSameStyleInTable`,
 *   `doNotSuppressIndentation`, `doNotSuppressParagraphBorders`, `swapBordersFacingPages`)
 * - `-tables`: tables (`useSingleBorderforContiguousCells`, `alignTablesRowByRow`, `layoutRawTableWidth`,
 *   `layoutTableRowsApart`, `useWord2002TableStyleRules`, `growAutofit`, `doNotAutofitConstrainedTables`,
 *   `autofitToFirstFixedWidthCell`, `doNotBreakConstrainedForcedTable`, `doNotVertAlignCellWithSp`,
 *   `doNotSnapToGridInCell`, `doNotBreakWrappedTables`)
 * - `-columns`: columns and footnotes (`noColumnBalance`, `cachedColBalance`, `footnoteLayoutLikeWW8`)
 * - `-other`: printing, fields, shapes and text boxes (`printBodyTextBeforeHeader`, `printColBlack`,
 *   `showBreaksInFrames`, `convMailMergeEsc`, `shapeLayoutLikeWW8`, `selectFldWithFirstOrLastChar`,
 *   `doNotVertAlignInTxbx`), and Word's own `allowHyphenationAtTrackBottom` and `allowTextAfterFloatingTableBreak` on
 *
 * A group whose document Word lays out as the one without leaves lines as they are, each of its settings. Word laid out
 * `-heights`, `-latin`, `-paragraphs`, `-tables`, `-columns` and `-other` as the one without, but for the text inside lines
 * of exact height (CP2, CP14, CP15) and a justified line that ends with a line break, which wasn't stretched (CP8b), and
 * `-pages` and `-east-asian` not. Those two are split up in a second round: `word-compat-settings2.docx`, the same probes
 * with CP20, and one document for each of their settings, named after it, such as
 * `word-compat-settings2-suppressTopSpacing.docx`. Only `suppressTopSpacing` (CP14, CP15, CP20) and `useFELayout` (CP19b)
 * changed lines. A third, `word-compat-settings2-together.docx`, has every other setting on at once, against
 * `word-compat-settings2.docx`, and Word laid it out as the groups: the settings don't change lines together either.
 *
 * Calibri 11 on A4 with 1440 margins, single spaced with no space between paragraphs, unless a probe says otherwise. Each
 * line's text starts with its probe's name. word-compat-settings.py reads them, against the document without.
 *
 * CP1: lines of Calibri 11 (CP1a), Times New Roman 12 (CP1b) and Arial 10 (CP1c): their pitch
 * CP2: prose at exactly 18 points (CP2a), at least 20 (CP2b), and exactly 9, less than the font (CP2c)
 * CP3: a line with text raised 6 points (CP3b) and lowered 6 (CP3c), between plain lines
 * CP4: a line with a thick underline (CP4a), and underlined Japanese (CP4b)
 * CP5: prose expanded half a point (CP5a), condensed 0.3 points (CP5b), and expanded 1.3 points (CP5c)
 * CP6: prose in small capitals
 * CP7: prose kerned from 1 point (`w:kern`), with pairs Calibri kerns
 * CP8: prose left-aligned (CP8a), and justified with a line break after its second line (CP8b)
 * CP9: words with six spaces between them, so lines end with several
 * CP10: a hanging indent of 1000 twips, which isn't a default stop, with a tab after a short first word (CP10a), a list
 *       number with the same indent and a tab after it (CP10b), a centred paragraph with a right stop (CP10c), and a
 *       right-aligned one with a centred stop (CP10d)
 * CP11: paragraphs with contextual spacing and 12 points before and after, in a table cell
 * CP12: two paragraphs with the same border, one after the other
 * CP13: a paragraph that ends with a page break (CP13a), the paragraph after it on the next page with 24 points before
 *       (CP13b), and a paragraph with a page break before it and 24 points before (CP13c)
 * CP14: the first line of a page at exactly 30 points (CP14a), and at least 30 (CP14b)
 * CP15: 60 lines at exactly 20 points: how many fit on a page
 * CP16: 15 paragraphs in two columns, then a continuous section break
 * CP17: tables: sized to their text, with a word wider than the page (CP17a), with borders of cells next to each other of
 *       other widths (CP17b), in a style whose first row is 16 points with 10 points after its paragraphs (CP17c), sized to
 *       their text with a first cell of a fixed width and a word wider than it (CP17d)
 * CP18: a paragraph with three footnotes of two lines each
 * CP19: Japanese (CP19a), Japanese with Latin letters and figures (CP19b), Korean (CP19c), a path with backslashes in an
 *       East Asian font (CP19d), and Arabic (CP19e)
 * CP20, in the second round's documents: the first line of a page at least 30 points
 */
// cspell:ignore Calibri Mincho incomprehensibilities kerned Punct conv Txbx
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    AlignmentType,
    BorderStyle,
    Document,
    FootnoteReferenceRun,
    type ISectionOptions,
    LevelFormat,
    LineRuleType,
    Packer,
    PageBreak,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableRow,
    TabStopType,
    TextRun,
    UnderlineType,
    WidthType,
} from "docx";

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

const JAPANESE = "日本語の文章は、句読点の前後で改行の規則が変わります。「括弧」の中も同じです。";
const KOREAN = "한국어 문장은 띄어쓰기로 단어를 나눕니다 그리고 줄을 바꿉니다";
const ARABIC = "مرحبا بالعالم هذا نص عربي طويل للتجربة";
const EAST_ASIAN = { eastAsia: "MS Mincho" };

type Run = ConstructorParameters<typeof TextRun>[0] & object;

/** A paragraph of one run */
const line = (
    text: string,
    run: Omit<Run, "text"> = {},
    paragraph: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {},
): Paragraph => new Paragraph({ ...paragraph, children: [new TextRun({ text, ...run })] });

/** The first paragraph of a group, which starts a page */
const heading = (text: string): Paragraph => new Paragraph({ pageBreakBefore: true, children: [new TextRun(text)] });

const cell = (children: readonly Paragraph[], options: Partial<ConstructorParameters<typeof TableCell>[0]> = {}): TableCell =>
    new TableCell({ ...options, children: [...children] });

// The text of each footnote, made into paragraphs for each document, as docx adds its mark to a footnote's paragraph each
// time it writes one
const footnoteTexts: string[] = [];
const footnote = (text: string): FootnoteReferenceRun => {
    const id = footnoteTexts.push(text);
    return new FootnoteReferenceRun(id);
};

const body: (Paragraph | Table)[] = [
    line("CP1 heights"),
    ...Array.from({ length: 10 }, (_, i) => line(`CP1a line ${i + 1}`)),
    ...Array.from({ length: 5 }, (_, i) => line(`CP1b line ${i + 1}`, { font: "Times New Roman", size: 24 })),
    ...Array.from({ length: 5 }, (_, i) => line(`CP1c line ${i + 1}`, { font: "Arial", size: 20 })),
    line(`CP2a ${prose(40)}`, {}, { spacing: { line: 360, lineRule: LineRuleType.EXACT } }),
    line(`CP2b ${prose(40)}`, {}, { spacing: { line: 400, lineRule: LineRuleType.AT_LEAST } }),
    line(`CP2c ${prose(40)}`, {}, { spacing: { line: 180, lineRule: LineRuleType.EXACT } }),
    line("CP3a plain"),
    new Paragraph({ children: [new TextRun("CP3b "), new TextRun({ text: "raised", position: "6pt" }), new TextRun(" plain")] }),
    new Paragraph({ children: [new TextRun("CP3c "), new TextRun({ text: "lowered", position: "-6pt" }), new TextRun(" plain")] }),
    line("CP3d plain"),
    new Paragraph({
        children: [new TextRun("CP4a "), new TextRun({ text: "underlined thick", underline: { type: UnderlineType.THICK } })],
    }),
    new Paragraph({ children: [new TextRun("CP4b "), new TextRun({ text: JAPANESE, font: EAST_ASIAN, underline: {} })] }),
    line("CP4c plain"),
    line("CP4d plain"),
    heading("CP5 letters"),
    line(`CP5a ${prose(50)}`, { characterSpacing: 10 }),
    line(`CP5b ${prose(60)}`, { characterSpacing: -6 }),
    line(`CP5c ${prose(40)}`, { characterSpacing: 26 }),
    line(`CP6 ${prose(50)}`, { smallCaps: true }),
    line(`CP7 AVATAR WAVE Tokyo Yale LTA PAY AWAY TAVERN VOYAGE Te Yo ${prose(40)}`, { kern: 2 }),
    line(`CP8a ${prose(70)}`),
    new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun(`CP8b ${prose(34)}`), new TextRun({ text: prose(40), break: 1 })],
    }),
    line(`CP9 ${prose(40).replace(/ /g, "      ")}`),
    heading("CP10 tabs"),
    line("CP10a\tafter the tab", {}, { indent: { left: 1000, hanging: 1000 } }),
    new Paragraph({ numbering: { reference: "compat-list", level: 0 }, children: [new TextRun("CP10b after the number")] }),
    line("CP10c left\tright", {}, { alignment: AlignmentType.CENTER, tabStops: [{ type: TabStopType.RIGHT, position: 4000 }] }),
    line("CP10d left\tcentred", {}, { alignment: AlignmentType.RIGHT, tabStops: [{ type: TabStopType.CENTER, position: 3000 }] }),
    line("CP11 above"),
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: [
            new TableRow({
                children: [
                    cell(
                        Array.from({ length: 4 }, (_, i) =>
                            line(`CP11 para ${i + 1}`, {}, { contextualSpacing: true, spacing: { before: 240, after: 240 } }),
                        ),
                    ),
                ],
            }),
        ],
    }),
    line("CP11 below"),
    ...[1, 2].map((i) =>
        line(
            `CP12 bordered ${i}`,
            {},
            {
                border: {
                    top: { style: BorderStyle.SINGLE, size: 12, space: 4 },
                    bottom: { style: BorderStyle.SINGLE, size: 12, space: 4 },
                },
            },
        ),
    ),
    line("CP12 below"),
    heading("CP13 page breaks"),
    new Paragraph({ children: [new TextRun("CP13a before the break"), new PageBreak()] }),
    line("CP13b after the break", {}, { spacing: { before: 480 } }),
    line("CP13c after a break before", {}, { pageBreakBefore: true, spacing: { before: 480 } }),
    line("CP13 below"),
    line(`CP14a ${prose(30)}`, {}, { pageBreakBefore: true, spacing: { line: 600, lineRule: LineRuleType.EXACT } }),
    line(`CP14b ${prose(30)}`, {}, { spacing: { line: 600, lineRule: LineRuleType.AT_LEAST } }),
    line("CP14 below"),
    heading("CP15 exact lines"),
    ...Array.from({ length: 60 }, (_, i) => line(`CP15 line ${i + 1}`, {}, { spacing: { line: 400, lineRule: LineRuleType.EXACT } })),
];

const columns: (Paragraph | Table)[] = Array.from({ length: 15 }, (_, i) => line(`CP16 para ${i + 1}`));

const tables: (Paragraph | Table)[] = [
    heading("CP17 tables"),
    new Table({
        rows: [
            new TableRow({
                children: [
                    cell([line(`CP17a ${"incomprehensibilities".repeat(4)}`)]),
                    cell([line(`CP17a cell ${prose(20)}`)]),
                    cell([line(`CP17a cell ${prose(20)}`)]),
                ],
            }),
        ],
    }),
    line("CP17a below"),
    new Table({
        width: { size: 6000, type: WidthType.DXA },
        columnWidths: [3000, 3000],
        rows: [
            new TableRow({
                children: [
                    cell([line("CP17b top left")], { borders: { bottom: { style: BorderStyle.SINGLE, size: 32, color: "000000" } } }),
                    cell([line("CP17b top right")], { borders: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" } } }),
                ],
            }),
            new TableRow({
                children: [
                    cell([line("CP17b bottom left")], { borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000" } } }),
                    cell([line("CP17b bottom right")], { borders: { top: { style: BorderStyle.DOUBLE, size: 24, color: "000000" } } }),
                ],
            }),
        ],
    }),
    line("CP17b below"),
    new Table({
        style: "CompatSettingsTable",
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: Array.from({ length: 4 }, (_, i) => new TableRow({ children: [cell([line(`CP17c row ${i + 1}`)])] })),
    }),
    line("CP17c below"),
    new Table({
        rows: [
            new TableRow({
                children: [
                    cell([line("CP17d abcdefghijklmnopqrstuvwxyz")], { width: { size: 1000, type: WidthType.DXA } }),
                    cell([line(`CP17d cell ${prose(30)}`)]),
                ],
            }),
        ],
    }),
    line("CP17d below"),
    heading("CP18 footnotes"),
    new Paragraph({
        children: [
            new TextRun(`CP18 ${prose(20)}`),
            footnote(`CP18 note 1 ${prose(25)}`),
            new TextRun(` ${prose(20)}`),
            footnote(`CP18 note 2 ${prose(25)}`),
            new TextRun(` ${prose(20)}`),
            footnote(`CP18 note 3 ${prose(25)}`),
        ],
    }),
    line("CP18 below"),
    heading("CP19 East Asian"),
    new Paragraph({ children: [new TextRun("CP19a "), new TextRun({ text: JAPANESE.repeat(4), font: EAST_ASIAN })] }),
    new Paragraph({ children: [new TextRun("CP19b "), new TextRun({ text: `ABC123${JAPANESE}xyz456`.repeat(3), font: EAST_ASIAN })] }),
    new Paragraph({ children: [new TextRun("CP19c "), new TextRun({ text: `${KOREAN} `.repeat(4), language: { eastAsia: "ko-KR" } })] }),
    new Paragraph({ children: [new TextRun("CP19d "), new TextRun({ text: "C:\\path\\to\\a\\file ".repeat(8), font: EAST_ASIAN })] }),
    new Paragraph({ children: [new TextRun("CP19e "), new TextRun({ text: `${ARABIC} `.repeat(6), rightToLeft: true })] }),
    line("CP19 below"),
];

// CP20, in the second round's documents only: the first line of a page at least 30 points
const topOfPage: (Paragraph | Table)[] = [
    line(`CP20 ${prose(30)}`, {}, { pageBreakBefore: true, spacing: { line: 600, lineRule: LineRuleType.AT_LEAST } }),
    line("CP20 below"),
];

const sectionsOf = (round: 1 | 2): ISectionOptions[] => [
    { children: body },
    { properties: { type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } }, children: [line("CP16 two columns"), ...columns] },
    {
        properties: { type: SectionType.CONTINUOUS },
        children: [line("CP16 after the columns"), ...tables, ...(round === 2 ? topOfPage : [])],
    },
];

// CP17c's table style, which docx can't write
const STYLES =
    '<w:style w:type="table" w:styleId="CompatSettingsTable"><w:name w:val="Compat Settings Table"/><w:basedOn w:val="TableNormal"/>' +
    '<w:pPr><w:spacing w:after="200"/></w:pPr><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>' +
    '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>' +
    '<w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:tblStylePr></w:style>';

// The schema's compatibility settings, in the order the schema has them, by group
const GROUPS: readonly (readonly [string, readonly string[], readonly string[]])[] = [
    [
        "heights",
        [
            "noLeading",
            "noExtraLineSpacing",
            "truncateFontHeightsLikeWP6",
            "usePrinterMetrics",
            "subFontBySize",
            "adjustLineHeightInTable",
            "noSpaceRaiseLower",
            "spaceForUL",
            "ulTrailSpace",
        ],
        [],
    ],
    [
        "pages",
        [
            "suppressTopSpacing",
            "suppressBottomSpacing",
            "suppressTopSpacingWP",
            "suppressSpacingAtTopOfPage",
            "suppressSpBfAfterPgBrk",
            "splitPgBreakAndParaMark",
        ],
        [],
    ],
    [
        "latin",
        [
            "spacingInWholePoints",
            "wpSpaceWidth",
            "mwSmallCaps",
            "useAnsiKerningPairs",
            "wrapTrailSpaces",
            "doNotExpandShiftReturn",
            "wpJustification",
        ],
        [],
    ],
    [
        "east-asian",
        [
            "balanceSingleByteDoubleByteWidth",
            "doNotLeaveBackslashAlone",
            "displayHangulFixedWidth",
            "autoSpaceLikeWord95",
            "lineWrapLikeWord6",
            "useWord97LineBreakRules",
            "applyBreakingRules",
            "doNotWrapTextWithPunct",
            "doNotUseEastAsianBreakRules",
            "useAltKinsokuLineBreakRules",
            "useFELayout",
        ],
        [],
    ],
    [
        "paragraphs",
        [
            "noTabHangInd",
            "forgetLastTabAlignment",
            "doNotUseIndentAsNumberingTabStop",
            "underlineTabInNumList",
            "useNormalStyleForList",
            "allowSpaceOfSameStyleInTable",
            "doNotSuppressIndentation",
            "doNotSuppressParagraphBorders",
            "swapBordersFacingPages",
        ],
        [],
    ],
    [
        "tables",
        [
            "useSingleBorderforContiguousCells",
            "alignTablesRowByRow",
            "layoutRawTableWidth",
            "layoutTableRowsApart",
            "useWord2002TableStyleRules",
            "growAutofit",
            "doNotAutofitConstrainedTables",
            "autofitToFirstFixedWidthCell",
            "doNotBreakConstrainedForcedTable",
            "doNotVertAlignCellWithSp",
            "doNotSnapToGridInCell",
            "doNotBreakWrappedTables",
        ],
        [],
    ],
    ["columns", ["noColumnBalance", "cachedColBalance", "footnoteLayoutLikeWW8"], []],
    [
        "other",
        [
            "printBodyTextBeforeHeader",
            "printColBlack",
            "showBreaksInFrames",
            "convMailMergeEsc",
            "shapeLayoutLikeWW8",
            "selectFldWithFirstOrLastChar",
            "doNotVertAlignInTxbx",
        ],
        ["allowHyphenationAtTrackBottom", "allowTextAfterFloatingTableBreak"],
    ],
];

// The order of the schema's settings in `w:compat` (CT_Compat), which Word reads them in
const SCHEMA_ORDER = (
    "useSingleBorderforContiguousCells wpJustification noTabHangInd noLeading spaceForUL noColumnBalance " +
    "balanceSingleByteDoubleByteWidth noExtraLineSpacing doNotLeaveBackslashAlone ulTrailSpace doNotExpandShiftReturn " +
    "spacingInWholePoints lineWrapLikeWord6 printBodyTextBeforeHeader printColBlack wpSpaceWidth showBreaksInFrames " +
    "subFontBySize suppressBottomSpacing suppressTopSpacing suppressSpacingAtTopOfPage suppressTopSpacingWP " +
    "suppressSpBfAfterPgBrk swapBordersFacingPages convMailMergeEsc truncateFontHeightsLikeWP6 mwSmallCaps " +
    "usePrinterMetrics doNotSuppressParagraphBorders wrapTrailSpaces footnoteLayoutLikeWW8 shapeLayoutLikeWW8 " +
    "alignTablesRowByRow forgetLastTabAlignment adjustLineHeightInTable autoSpaceLikeWord95 noSpaceRaiseLower " +
    "doNotUseHTMLParagraphAutoSpacing layoutRawTableWidth layoutTableRowsApart useWord97LineBreakRules " +
    "doNotBreakWrappedTables doNotSnapToGridInCell selectFldWithFirstOrLastChar applyBreakingRules doNotWrapTextWithPunct " +
    "doNotUseEastAsianBreakRules useWord2002TableStyleRules growAutofit useFELayout useNormalStyleForList " +
    "doNotUseIndentAsNumberingTabStop useAltKinsokuLineBreakRules allowSpaceOfSameStyleInTable doNotSuppressIndentation " +
    "doNotAutofitConstrainedTables autofitToFirstFixedWidthCell underlineTabInNumList displayHangulFixedWidth " +
    "splitPgBreakAndParaMark doNotVertAlignCellWithSp doNotBreakConstrainedForcedTable doNotVertAlignInTxbx " +
    "useAnsiKerningPairs cachedColBalance"
).split(" ");

/** The settings of a group, as they go in `w:compat` before Word's own */
const compatibilityOf = (settings: readonly string[], words: readonly string[]): string =>
    [...settings]
        .sort((a, b) => SCHEMA_ORDER.indexOf(a) - SCHEMA_ORDER.indexOf(b))
        .map((name) => `<w:${name}/>`)
        .join("") +
    words.map((name) => `<w:compatSetting w:name="${name}" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>`).join("");

const documentOf = (round: 1 | 2): Document =>
    new Document({
        styles: {
            default: { document: { run: { font: "Calibri", size: 22 } } },
            paragraphStyles: [
                { id: "Normal", name: "Normal", paragraph: { spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO } } },
            ],
        },
        numbering: {
            config: [
                {
                    reference: "compat-list",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            alignment: AlignmentType.LEFT,
                            style: { paragraph: { indent: { left: 1000, hanging: 1000 } } },
                        },
                    ],
                },
            ],
        },
        footnotes: Object.fromEntries(footnoteTexts.map((text, index) => [index + 1, { children: [line(text)] }])),
        sections: sectionsOf(round),
    });

// The second round: each of the settings of the groups whose documents Word laid out unlike the one without, alone
const SECOND_ROUND = GROUPS.filter(([name]) => name === "pages" || name === "east-asian").flatMap(([, settings]) =>
    settings.map((setting) => [setting, [setting], []] as const),
);

// The third round: every setting Word laid out lines alike with, alone or in its group, all together, against the second
// round's document without them: whether any of them change lines together
const CHANGING_LINES = new Set(["suppressTopSpacing", "useFELayout"]);
const TOGETHER = [
    "together",
    GROUPS.flatMap(([, settings]) => settings).filter((setting) => !CHANGING_LINES.has(setting)),
    GROUPS.flatMap(([, , words]) => words),
] as const;

const main = async (): Promise<void> => {
    mkdirSync("build/word-probes", { recursive: true });
    const documents = [
        ...[["", [], []] as const, ...GROUPS].map(([name, settings, words]) => [1, name, settings, words] as const),
        ...[["", [], []] as const, ...SECOND_ROUND, TOGETHER].map(([name, settings, words]) => [2, name, settings, words] as const),
    ];
    for (const [round, name, settings, words] of documents) {
        const zip = await JSZip.loadAsync(await Packer.toBuffer(documentOf(round)));
        const styles = await zip.file("word/styles.xml")!.async("string");
        zip.file("word/styles.xml", styles.replace("</w:styles>", `${STYLES}</w:styles>`));
        const xml = await zip.file("word/settings.xml")!.async("string");
        zip.file("word/settings.xml", xml.replace("<w:compat>", `<w:compat>${compatibilityOf(settings, words)}`));
        const base = round === 1 ? "word-compat-settings" : "word-compat-settings2";
        const file = name === "" ? base : `${base}-${name}`;
        writeFileSync(`build/word-probes/${file}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
    }
};

void main();
