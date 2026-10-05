/**
 * Probes of what `word-stops-compat2.ts` left open, where docx/layout still stops after following what Word's PDFs of it
 * showed in round 25. Each probe starts a page, between a line above and a line below it, in Calibri 11 on A4 with inch
 * margins, unless it says. `word-stops.py` reads them all.
 *
 * word-stops-compat3-15.docx, -14 and -12: the same pages in compatibility modes 15 (the control), 14 and 12
 * CN12: tables of three columns given no widths, with a cell of 40 words, as a share of the width: 25% (CN12a), 75%
 *   (CN12b), and 50% indented 720 (CN12c) ("a table sized to its text as a share of the width, in a document in
 *   compatibility mode"; CN8b's 50% was 4616 twips wide, which a share of the page's text and a margin, and a share of it
 *   and two margins, both make)
 * CN13: prose beside a picture or frame with square wrapping, with no distance from the text, which shows whether the frame
 *   or the justification left CM14's gap of 1000 empty: a picture 1000 from the margin, of justified prose (CN13a), a frame
 *   1000 from it, of prose aligned left (CN13b), frames 1250, 1500 and 1750 from it, aligned left (CN13c to CN13e),
 *   pictures 500 and 750 from it, aligned left (CN13f, CN13g), and a picture 1500 from it, of centred prose (CN13h) ("a line
 *   beside a drawing or frame in a gap narrower than Word was seen putting text in, in a document in compatibility mode")
 * CN14: a left stop at 9500 with 250 words after it, whose line goes further than CN5a's 18827 twips ("text after a tab past
 *   the end of the line that goes further past the margin than Word was seen keeping it on the line")
 * CN15: tables that text flows around: one with no width of its own, sized to its text, 2000 from the margin (CN15a), one
 *   3000 wide centred across the margins (CN15b), and ones 3000 wide 2000 from the margin, 1 and 3 points from the text
 *   left and right (CN15c, CN15d), in prose aligned left ("a table that text flows around, sized to its text, lined up
 *   across the page or with no distance from the text beside it, in a document in compatibility mode"). With no distance,
 *   as CN9 and CM10 had, Word put the text 5019 twips across beside one 2000 from the margin, where the layout puts it at
 *   5010 in mode 15 too, and with 200 at 3210 beside one at the margin (`word-floats3.docx` H2), as the layout does: CN15c
 *   and CN15d show which distance Word keeps from the text at least
 * CN16: tables whose cells all have widths of 2000: with a word of 12000 twips, widened past the page (CN16a), and with rows
 *   that give the first column 2000 and 3000 (CN16b) ("a table widened for a long word past the room for it, or with its
 *   rows evened out, in a document in compatibility mode")
 * CN17: Japanese prose in MS Mincho 10.5 in Japanese (`w:lang w:eastAsia="ja-JP"`, CN17a), and Chinese in SimSun 10.5 in
 *   Chinese (`zh-CN`, CN17b), whose lines Word 2007's mode may break by its rules for the language ("East Asian text in an
 *   East Asian language, or beside characters past ASCII, in a document in compatibility mode 12 or 11")
 * CN18: a VML rectangle 100 by 50 points with an outline in a line of text (CN18a), and docx's text box placed 2000 from the
 *   margin with square wrapping in prose (CN18b) ("a VML drawing other than a text box in the line, in a document in
 *   compatibility mode 12 or 11")
 *
 * word-stops-top-spacing4.docx, with `suppressTopSpacing` on:
 * ST16: the first line of a page at 0.8 lines (ST16a), and a paragraph of 10 lines at exactly 30 points with a border above
 *   it whose later line goes to the top of the next page (ST16b) ("the first line of a page or column, at line spacing Word
 *   hasn't shown, in a document that suppresses the space above it")
 *
 * word-stops-divisions2.docx: paragraphs in HTML divisions, with the web settings' divisions of word-stops-divisions.docx
 * DV3a: a paragraph in the bordered division at the top of a page, after a page break ("a paragraph in an HTML division at
 *   the top of a page or column")
 * DV3b: a paragraph in the bordered division and one in the division without borders after it ("an HTML division next to
 *   another")
 * DV3c: a paragraph in the bordered division with 3 points before and after it, less than the division's margins, and one
 *   with 12 points, more than them (DV3d) ("a paragraph in an HTML division with space before or after it")
 * DV3e: a paragraph with 3 points after it, then one in the bordered division ("an HTML division next to a paragraph with
 *   space before or after it")
 * DV3f: three paragraphs of 12 lines in the bordered division, going on to the next page
 *
 * word-stops-fe-layout3.docx, with useFELayout on, Japanese with Latin words in MS Mincho 10.5:
 * FE3a: the Latin words in Calibri 14, larger than the Japanese, to show which size the quarter of an em is of
 * FE3b: with autoSpaceDE off and autoSpaceDN on, numbers among the ideographs
 * FE3c: with autoSpaceDE on and autoSpaceDN off, Latin words among them (FE1b, with a full stop at the start of a line)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-compat3.ts [folder]
 */
import {
    AlignmentType,
    BorderStyle,
    FrameAnchorType,
    LineRuleType,
    PageBreak,
    Paragraph,
    Table,
    TableAnchorType,
    TableRow,
    TabStopType,
    TextRun,
    Textbox,
    WidthType,
} from "docx";

import {
    ALL_BORDERS,
    type Child,
    type Injection,
    PAGE,
    cell,
    injectIntoParagraph,
    line,
    marker,
    para,
    picture,
    probe,
    prose,
    replaceMarkerRun,
    write,
} from "./kit";

// A picture placed on the page with square wrapping, at a distance from the margin in twips, with no distance from the text
const floatPicture =
    (name: string, offset: number): Injection =>
    (parts) => {
        const text = parts.get("word/document.xml")!;
        const at = text.indexOf(`${name} anchor `);
        const start = at < 0 ? -1 : text.indexOf("<wp:inline", at);
        if (start < 0) {
            throw new Error(`No picture after ${name} anchor in word/document.xml`);
        }
        const end = text.indexOf("</wp:inline>", start) + "</wp:inline>".length;
        const inline = text.slice(start, end);
        const extent = inline.match(/<wp:extent [^>]*\/>/)![0];
        const inner = inline.slice(inline.indexOf("<wp:docPr"), inline.lastIndexOf("</wp:inline>"));
        const anchor =
            `<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="1" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">` +
            `<wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:posOffset>${offset * 635}</wp:posOffset></wp:positionH>` +
            `<wp:positionV relativeFrom="paragraph"><wp:posOffset>0</wp:posOffset></wp:positionV>${extent}<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
            `<wp:wrapSquare wrapText="bothSides"/>${inner.replace(/<wp:effectExtent [^>]*\/>/, "")}</wp:anchor>`;
        parts.set("word/document.xml", text.slice(0, start) + anchor + text.slice(end));
    };

const JAPANESE = "日本語の文章、句読点。「かぎ括弧」と（丸括弧）を含む。";
const CHINESE = "中文的句子，标点符号。“引号”和（括号）都在其中。";
const MINCHO = { font: { eastAsia: "MS Mincho", ascii: "MS Mincho" }, size: 21 };

const sized = (name: string, options: object): Child[] =>
    probe(name, [
        new Table({
            borders: ALL_BORDERS,
            ...options,
            rows: [new TableRow({ children: [cell(`${name} a`), cell(`${name} lighthousekeeper`), cell(`${name} ${prose(40)}`)] })],
        }),
    ]);

const beside = (name: string, alignment: (typeof AlignmentType)[keyof typeof AlignmentType]): Child[] =>
    probe(name, [new Paragraph({ alignment, children: [new TextRun(`${name} anchor ${prose(150)}`), picture(72)] })]);

const framed = (name: string, x: number): Child[] =>
    probe(name, [
        new Paragraph({
            frame: {
                type: "absolute",
                position: { x, y: 600 },
                width: 3000,
                height: 1000,
                anchor: { horizontal: FrameAnchorType.MARGIN, vertical: FrameAnchorType.TEXT },
            },
            children: [new TextRun(`${name} frame`)],
        }),
        para(`${name} beside`, 200),
    ]);

const floating = (name: string, float: object, width?: number): Child[] =>
    probe(name, [
        para(name, 30),
        new Table({
            ...(width === undefined ? {} : { width: { size: width, type: WidthType.DXA }, columnWidths: [width] }),
            borders: ALL_BORDERS,
            float,
            rows: [1, 2, 3].map((row) => new TableRow({ children: [cell(`${name} row ${row}`)] })),
        }),
        para(`${name} after`, 150),
    ]);

// The pictures beside CN13a, CN13f, CN13g and CN13h, by their distances from the margin
const PICTURES = { CN13a: 1000, CN13f: 500, CN13g: 750, CN13h: 1500 } as const;

const compatPages = (): Child[] => [
    ...sized("CN12a", { width: { size: 25, type: WidthType.PERCENTAGE } }),
    ...sized("CN12b", { width: { size: 75, type: WidthType.PERCENTAGE } }),
    ...sized("CN12c", { width: { size: 50, type: WidthType.PERCENTAGE }, indent: { size: 720, type: WidthType.DXA } }),
    ...beside("CN13a", AlignmentType.JUSTIFIED),
    ...framed("CN13b", 1000),
    ...framed("CN13c", 1250),
    ...framed("CN13d", 1500),
    ...framed("CN13e", 1750),
    ...beside("CN13f", AlignmentType.LEFT),
    ...beside("CN13g", AlignmentType.LEFT),
    ...beside("CN13h", AlignmentType.CENTER),
    ...probe("CN14", [
        new Paragraph({ tabStops: [{ type: TabStopType.LEFT, position: 9500 }], children: [new TextRun(`CN14\tpast ${prose(250)}`)] }),
        line("CN14 next"),
    ]),
    ...floating("CN15a", {
        horizontalAnchor: TableAnchorType.MARGIN,
        absoluteHorizontalPosition: 2000,
        verticalAnchor: TableAnchorType.TEXT,
        absoluteVerticalPosition: 500,
    }),
    ...floating(
        "CN15b",
        { horizontalAnchor: TableAnchorType.MARGIN, relativeHorizontalPosition: "center", verticalAnchor: TableAnchorType.TEXT },
        3000,
    ),
    ...[20, 60].flatMap((distance, index) =>
        floating(
            `CN15${"cd"[index]}`,
            {
                horizontalAnchor: TableAnchorType.MARGIN,
                absoluteHorizontalPosition: 2000,
                verticalAnchor: TableAnchorType.TEXT,
                absoluteVerticalPosition: 500,
                leftFromText: distance,
                rightFromText: distance,
            },
            3000,
        ),
    ),
    ...probe("CN16a", [
        new Table({
            borders: ALL_BORDERS,
            columnWidths: [2000, 2000, 2000],
            rows: [
                new TableRow({
                    children: [
                        cell(`CN16a ${"lighthouse".repeat(18)}`, { width: { size: 2000, type: WidthType.DXA } }),
                        cell(`CN16a ${prose(20)}`, { width: { size: 2000, type: WidthType.DXA } }),
                        cell(`CN16a ${prose(20)}`, { width: { size: 2000, type: WidthType.DXA } }),
                    ],
                }),
            ],
        }),
    ]),
    ...probe("CN16b", [
        new Table({
            borders: ALL_BORDERS,
            columnWidths: [2000, 2000, 2000],
            rows: [2000, 3000].map(
                (first) =>
                    new TableRow({
                        children: [
                            cell(`CN16b ${prose(10)}`, { width: { size: first, type: WidthType.DXA } }),
                            cell(`CN16b ${prose(10)}`, { width: { size: 2000, type: WidthType.DXA } }),
                            cell(`CN16b ${prose(10)}`, { width: { size: 2000, type: WidthType.DXA } }),
                        ],
                    }),
            ),
        }),
    ]),
    ...probe("CN17a", [line(`CN17a ${JAPANESE.repeat(8)}`, {}, { ...MINCHO, language: { eastAsia: "ja-JP" } })]),
    ...probe("CN17b", [
        line(
            `CN17b ${CHINESE.repeat(8)}`,
            {},
            { font: { eastAsia: "SimSun", ascii: "SimSun" }, size: 21, language: { eastAsia: "zh-CN" } },
        ),
    ]),
    ...probe("CN18a", [
        new Paragraph({ children: [new TextRun("CN18a shape "), marker("CN18a"), new TextRun(" after")] }),
        para("CN18a next", 20),
    ]),
    ...probe("CN18b", [
        new Paragraph({
            children: [
                new TextRun("CN18b anchor "),
                new Textbox({
                    style: {
                        width: "150pt",
                        height: "auto",
                        position: "absolute",
                        positionHorizontalRelative: "margin",
                        positionVerticalRelative: "text",
                        marginLeft: "100pt",
                        marginTop: "0pt",
                    },
                    children: [line("CN18b in the box")],
                }),
                new TextRun(` ${prose(150)}`),
            ],
        }),
    ]),
];

const RECTANGLE = '<w:r><w:pict><v:rect style="width:100pt;height:50pt" strokecolor="black" strokeweight="1pt"/></w:pict></w:r>';
// docx's text box placed on the page, with square wrapping, which docx doesn't write
const wrapTextBox: Injection = (parts) => {
    const text = parts.get("word/document.xml")!;
    const at = text.indexOf("CN18b anchor");
    const close = at < 0 ? -1 : text.indexOf("</v:shape>", at);
    if (close < 0) {
        throw new Error("No text box after CN18b anchor in word/document.xml");
    }
    parts.set("word/document.xml", `${text.slice(0, close)}<w10:wrap type="square"/>${text.slice(close)}`);
};

for (const mode of [15, 14, 12]) {
    await write({
        name: `word-stops-compat3-${mode}`,
        options: { compatibility: { version: mode } },
        sections: [{ properties: PAGE, children: [line(`CN mode ${mode}`), ...compatPages()] }],
        injections: [
            ...Object.entries(PICTURES).map(([name, offset]) => floatPicture(name, offset)),
            replaceMarkerRun("CN18a", RECTANGLE),
            wrapTextBox,
        ],
    });
}

const exact = (points: number) => ({ spacing: { line: points * 20, lineRule: LineRuleType.EXACT } });
await write({
    name: "word-stops-top-spacing4",
    options: { compatibility: { suppressTopSpacing: true } },
    sections: [
        {
            properties: PAGE,
            children: [
                line("ST16a above"),
                new Paragraph({
                    pageBreakBefore: true,
                    spacing: { line: 192, lineRule: LineRuleType.AUTO },
                    children: [new TextRun(`ST16a first ${prose(24)}`)],
                }),
                line("ST16a next 1"),
                line("ST16a below"),
                ...probe("ST16b", [
                    ...Array.from({ length: 40 }, (_, index) => line(`ST16b fill ${index + 1}`)),
                    new Paragraph({
                        ...exact(30),
                        border: { top: { style: BorderStyle.SINGLE, size: 4, space: 4, color: "000000" } },
                        children: [new TextRun(`ST16b bordered ${prose(150)}`)],
                    }),
                ]),
            ],
        },
    ],
});

// The divisions of word-stops-divisions.docx: 1001 with margins and borders, 1002 with margins only, and 1003 inside 1002
const BORDER = 'w:val="single" w:sz="12" w:space="4" w:color="000000"';
const MARGINS = '<w:marLeft w:val="720"/><w:marRight w:val="720"/><w:marTop w:val="120"/><w:marBottom w:val="120"/>';
const WEB_SETTINGS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:webSettings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:divs>' +
    `<w:div w:id="1001">${MARGINS}<w:divBdr><w:top ${BORDER}/><w:left ${BORDER}/><w:bottom ${BORDER}/><w:right ${BORDER}/></w:divBdr></w:div>` +
    `<w:div w:id="1002">${MARGINS}<w:divsChild><w:div w:id="1003">${MARGINS}</w:div></w:divsChild></w:div>` +
    "</w:divs></w:webSettings>";
const divisions: Injection[] = [];
const inDivision = (text: string, id: number, options: object = {}): Paragraph => {
    const name = `DIV${divisions.length + 1}`;
    divisions.push(injectIntoParagraph(name, { pPr: `<w:divId w:val="${id}"/>` }));
    return new Paragraph({ ...options, children: [new TextRun(text), marker(name)] });
};
await write({
    name: "word-stops-divisions2",
    sections: [
        {
            properties: PAGE,
            children: [
                line("DV3a above"),
                new Paragraph({ children: [new TextRun("DV3a break"), new PageBreak()] }),
                inDivision(`DV3a ${prose(60)}`, 1001),
                line("DV3a below"),
                ...probe("DV3b", [inDivision(`DV3b first ${prose(60)}`, 1001), inDivision(`DV3b second ${prose(60)}`, 1002)]),
                ...probe("DV3c", [inDivision(`DV3c ${prose(60)}`, 1001, { spacing: { before: 60, after: 60 } })]),
                ...probe("DV3d", [inDivision(`DV3d ${prose(60)}`, 1001, { spacing: { before: 240, after: 240 } })]),
                ...probe("DV3e", [para("DV3e before", 20, { spacing: { after: 60 } }), inDivision(`DV3e ${prose(60)}`, 1001)]),
                ...probe("DV3f", [
                    ...Array.from({ length: 36 }, (_, index) => line(`DV3f fill ${index + 1}`)),
                    ...[1, 2, 3].map((index) => inDivision(`DV3f p${index} ${prose(150)}`, 1001)),
                ]),
            ],
        },
    ],
    injections: [
        ...divisions,
        (parts) => {
            parts.set("word/webSettings.xml", WEB_SETTINGS);
            const rels = parts.get("word/_rels/document.xml.rels")!;
            parts.set(
                "word/_rels/document.xml.rels",
                rels.replace(
                    "</Relationships>",
                    '<Relationship Id="rIdStopsWeb" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/></Relationships>',
                ),
            );
            const types = parts.get("[Content_Types].xml")!;
            parts.set(
                "[Content_Types].xml",
                types.replace(
                    "</Types>",
                    '<Override PartName="/word/webSettings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"/></Types>',
                ),
            );
        },
    ],
});

const MIXED = "日本語の文章にLatin wordsと数字123を含む。測量は夏に行われた。";
await write({
    name: "word-stops-fe-layout3",
    options: { compatibility: { useFELayout: true } },
    injections: [
        injectIntoParagraph("FE3b", { pPr: '<w:autoSpaceDE w:val="0"/>' }),
        injectIntoParagraph("FE3c", { pPr: '<w:autoSpaceDN w:val="0"/>' }),
    ],
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("FE3a", [
                    new Paragraph({
                        children: Array.from({ length: 6 }, () => [
                            new TextRun({ text: "日本語の文章に", ...MINCHO }),
                            new TextRun({ text: "Latin words", font: "Calibri", size: 28 }),
                            new TextRun({ text: "と数字を含む。測量は夏に行われた。", ...MINCHO }),
                        ]).flat(),
                    }),
                ]),
                ...(["b", "c"] as const).flatMap((letter) =>
                    probe(`FE3${letter}`, [
                        new Paragraph({
                            children: [new TextRun({ text: `FE3${letter} ${MIXED.repeat(6)}`, ...MINCHO }), marker(`FE3${letter}`)],
                        }),
                    ]),
                ),
            ],
        },
    ],
});
