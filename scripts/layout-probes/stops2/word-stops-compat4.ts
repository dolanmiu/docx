/**
 * Probes of what `word-stops-compat3.ts` left open, where docx/layout still stops after following what Word's PDFs of it
 * showed in round 26. Each probe starts a page, between a line above and a line below it, in Calibri 11 on A4 with inch
 * margins, unless it says. `word-stops.py` reads them all, and `whole-layout.ts` with `whole-lines.py` the divisions, whose
 * paragraphs Word lays out by the order of their divisions in the document.
 *
 * word-stops-divisions3.docx: paragraphs in HTML divisions, each probe in divisions of its own, as documents made from HTML
 * have them, so each is the first run of its division's paragraphs, whose box Word draws (`word-stops-divisions2.docx`
 * DV3b to DV3f were in the division of DV3a, after it, and showed no box). Each bordered division has margins of 720 left
 * and right and 120 above and below, and borders of 1.5 points 4 points away; those without borders the margins alone
 * DV4a: a paragraph with 12 points before and after it in a bordered division ("a paragraph in an HTML division with space
 *   before or after it, where the division has a border there")
 * DV4b: a bordered division after a paragraph with 12 points after it, and before one with 12 points before it ("an HTML
 *   division with a border above or below it next to a paragraph with space between them")
 * DV4c: a bordered division next to one without borders, and one without borders next to a bordered one ("... or next to
 *   another division")
 * DV4d: a division without borders at the top of a page, after a page break ("a paragraph in an HTML division without a
 *   border above it at the top of a page or column")
 * DV4e: three paragraphs in a bordered division, the middle one with 6 points before and after it ("a paragraph in an HTML
 *   division with space before or after it ... or another paragraph of it")
 * DV4f: a bordered division of 3 paragraphs of 12 lines going on to the next page, as DV3f did after its first run
 *
 * word-stops-divisions4.docx: the same divisions in a document that adds the space after a paragraph to the space before
 * the next (`w:doNotUseHTMLParagraphAutoSpacing`), where a division's margins beside spacing haven't been seen
 * DV5a: a division without borders after a paragraph with 12 points after it ("an HTML division next to a paragraph with
 *   space between them ... in a document that adds the space after a paragraph to the space before the next")
 * DV5b: two divisions without borders next to each other ("... or to another division")
 *
 * word-stops-compat4-15.docx, -14 and -12: the same pages in compatibility modes 15 (the control), 14 and 12
 * CN19: prose beside frames and pictures, with no distance from the text: frames 1300 and 1400 twips from the margin of
 *   prose aligned left (CN19a, CN19b), between the 1250 Word 2010 left empty and the 1500 it filled; a frame 1000 from it of
 *   centred (CN19c) and right-aligned prose (CN19d); a picture 1000 from it of right-aligned prose (CN19e) and 500 of
 *   centred (CN19f) ("a line beside a drawing or frame in a gap narrower than Word was seen putting text in")
 * CN20: a VML rectangle 100 by 50 points with an outline of a point placed 100 points from the margin with square wrapping
 *   (CN20a), and docx's text box in the line of a header (CN20b, in the header of CN20's pages) ("a VML shape that text
 *   flows around ... or a VML drawing in a header, footer or text box, in a document in compatibility mode 12 or 11")
 * CN21: tables whose cells all have widths of 2000 with a word of 2400, of half the width (CN21a) and with space of 30
 *   twips between the cells (CN21b) ("a table with space between its cells or a share of the width widened for a long word,
 *   or with its rows evened out, in a document in compatibility mode")
 *
 * word-stops-fe-layout4.docx, with useFELayout on, Japanese in MS Mincho 10.5 with Latin words:
 * FE4a: the Latin words in Arial, Times New Roman and Cambria 12, whose average character widths are 441, 401 and 615
 *   thousandths of an em, to check the half of it Word puts after them: 26.5, 24.1 and 36.9 twips
 * FE4b: the Latin words in Calibri bold 10.5 (536 thousandths: 56.3 twips) and Calibri 8 (521: 41.7)
 * FE4c: the Japanese in Yu Mincho 10.5, whose average is 969 thousandths (101.7 twips, or 52.5 for a quarter of its em)
 * FE4d: Japanese beside Greek letters and full-width Latin letters ("East Asian text beside letters of another script than
 *   Latin, or East Asian punctuation or full-width forms beside Latin letters or digits"), and beside Latin punctuation,
 *   which Word left as it is in FE2c, as a check
 * FE4e: 42 ideographs filling a line of 8850 twips (a right indent of 176) and then Latin words, to show whether the space
 *   after the last ideograph counts against the line, which would send the ideograph to the next line
 * FE4f: a right-aligned paragraph of Japanese ending in Latin words, and one ending in Japanese after Latin words, to show
 *   whether a space at the end of the line moves the text
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-compat4.ts [folder]
 */
import { AlignmentType, FrameAnchorType, Header, PageBreak, Paragraph, Table, TableRow, TextRun, Textbox, WidthType } from "docx";

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

// The divisions: each probe's own, 2001 and on, bordered or not
const BORDER = 'w:val="single" w:sz="12" w:space="4" w:color="000000"';
const MARGINS = '<w:marLeft w:val="720"/><w:marRight w:val="720"/><w:marTop w:val="120"/><w:marBottom w:val="120"/>';
const division = (id: number, bordered: boolean): string =>
    `<w:div w:id="${id}">${MARGINS}${
        bordered ? `<w:divBdr><w:top ${BORDER}/><w:left ${BORDER}/><w:bottom ${BORDER}/><w:right ${BORDER}/></w:divBdr>` : ""
    }</w:div>`;
const webSettings =
    (divisions: readonly string[]): Injection =>
    (parts) => {
        parts.set(
            "word/webSettings.xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:webSettings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:divs>' +
                `${divisions.join("")}</w:divs></w:webSettings>`,
        );
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
    };

// The document adds the space after a paragraph to the space before the next (`w:doNotUseHTMLParagraphAutoSpacing`, in
// the compatibility settings)
const addsParagraphSpacing: Injection = (parts) => {
    const text = parts.get("word/settings.xml")!;
    const at = text.indexOf("<w:compat>");
    if (at < 0) {
        throw new Error("No compatibility settings in word/settings.xml");
    }
    parts.set("word/settings.xml", text.replace("<w:compat>", "<w:compat><w:doNotUseHTMLParagraphAutoSpacing/>"));
};

const divisionDocument = async (
    name: string,
    probes: (inDivision: (text: string, id: number, options?: object) => Paragraph) => Child[],
    extra: readonly Injection[] = [],
) => {
    const injections: Injection[] = [];
    const divisions: string[] = [];
    const inDivision = (text: string, id: number, options: object = {}): Paragraph => {
        const markerName = `DIV${injections.length + 1}`;
        injections.push(injectIntoParagraph(markerName, { pPr: `<w:divId w:val="${id}"/>` }));
        return new Paragraph({ ...options, children: [new TextRun(text), marker(markerName)] });
    };
    const declare = (id: number, bordered: boolean): number => {
        divisions.push(division(id, bordered));
        return id;
    };
    const children = probes((text, id, options) => inDivision(text, declare(id, id % 2 === 1), options));
    await write({ name, sections: [{ properties: PAGE, children }], injections: [...injections, webSettings(divisions), ...extra] });
};

// Odd ids are bordered, even ones have margins alone
await divisionDocument("word-stops-divisions3", (inDivision) => [
    ...probe("DV4a", [inDivision(`DV4a ${prose(60)}`, 2001, { spacing: { before: 240, after: 240 } })]),
    ...probe("DV4b", [
        para("DV4b before", 20, { spacing: { after: 240 } }),
        inDivision(`DV4b ${prose(60)}`, 2003),
        para("DV4b after", 20, { spacing: { before: 240 } }),
    ]),
    ...probe("DV4c", [
        inDivision(`DV4c first ${prose(60)}`, 2005),
        inDivision(`DV4c second ${prose(60)}`, 2006),
        line("DV4c between"),
        inDivision(`DV4c third ${prose(60)}`, 2008),
        inDivision(`DV4c fourth ${prose(60)}`, 2009),
    ]),
    line("DV4d above"),
    new Paragraph({ children: [new TextRun("DV4d break"), new PageBreak()] }),
    inDivision(`DV4d ${prose(60)}`, 2010),
    line("DV4d below"),
    ...probe("DV4e", [
        inDivision(`DV4e p1 ${prose(60)}`, 2011),
        inDivision(`DV4e p2 ${prose(60)}`, 2011, { spacing: { before: 120, after: 120 } }),
        inDivision(`DV4e p3 ${prose(60)}`, 2011),
    ]),
    ...probe("DV4f", [
        ...Array.from({ length: 36 }, (_, index) => line(`DV4f fill ${index + 1}`)),
        ...[1, 2, 3].map((index) => inDivision(`DV4f p${index} ${prose(150)}`, 2013)),
    ]),
]);

await divisionDocument(
    "word-stops-divisions4",
    (inDivision) => [
        ...probe("DV5a", [para("DV5a before", 20, { spacing: { after: 240 } }), inDivision(`DV5a ${prose(60)}`, 2102)]),
        ...probe("DV5b", [inDivision(`DV5b first ${prose(60)}`, 2104), inDivision(`DV5b second ${prose(60)}`, 2106)]),
    ],
    [addsParagraphSpacing],
);

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

const beside = (name: string, alignment: (typeof AlignmentType)[keyof typeof AlignmentType]): Child[] =>
    probe(name, [new Paragraph({ alignment, children: [new TextRun(`${name} anchor ${prose(150)}`), picture(72)] })]);

const framed = (name: string, x: number, alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT): Child[] =>
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
        para(`${name} beside`, 200, { alignment }),
    ]);

// The pictures beside CN19e and CN19f, by their distances from the margin
const PICTURES = { CN19e: 1000, CN19f: 500 } as const;
const RECTANGLE =
    '<w:r><w:pict><v:rect style="position:absolute;margin-left:100pt;margin-top:0;width:100pt;height:50pt;z-index:1;mso-position-horizontal-relative:margin;mso-position-vertical-relative:text" strokecolor="black" strokeweight="1pt"><w10:wrap type="square"/></v:rect></w:pict></w:r>';
// Space of 30 twips between the cells of CN21b's table
const cellSpacing: Injection = (parts) => {
    const text = parts.get("word/document.xml")!;
    const at = text.indexOf("CN21b");
    const table = at < 0 ? -1 : text.lastIndexOf("<w:tbl>", at);
    const width = table < 0 ? -1 : text.indexOf("/>", text.indexOf("<w:tblW ", table)) + 2;
    if (width < 2) {
        throw new Error("No table width before CN21b in word/document.xml");
    }
    parts.set("word/document.xml", `${text.slice(0, width)}<w:tblCellSpacing w:w="30" w:type="dxa"/>${text.slice(width)}`);
};

const widened = (name: string, options: object): Table =>
    new Table({
        borders: ALL_BORDERS,
        columnWidths: [2000, 2000, 2000],
        ...options,
        rows: [
            new TableRow({
                children: [
                    cell(`${name} ${"lighthouse".repeat(4)}`, { width: { size: 2000, type: WidthType.DXA } }),
                    cell(`${name} ${prose(20)}`, { width: { size: 2000, type: WidthType.DXA } }),
                    cell(`${name} ${prose(20)}`, { width: { size: 2000, type: WidthType.DXA } }),
                ],
            }),
        ],
    });

const compatPages = (): Child[] => [
    ...framed("CN19a", 1300),
    ...framed("CN19b", 1400),
    ...framed("CN19c", 1000, AlignmentType.CENTER),
    ...framed("CN19d", 1000, AlignmentType.RIGHT),
    ...beside("CN19e", AlignmentType.RIGHT),
    ...beside("CN19f", AlignmentType.CENTER),
    ...probe("CN20a", [new Paragraph({ children: [new TextRun("CN20a anchor "), marker("CN20a"), new TextRun(prose(150))] })]),
    ...probe("CN21a", [widened("CN21a", { width: { size: 50, type: WidthType.PERCENTAGE } })]),
    ...probe("CN21b", [widened("CN21b", {})]),
];

for (const mode of [15, 14, 12]) {
    await write({
        name: `word-stops-compat4-${mode}`,
        options: { compatibility: { version: mode } },
        sections: [
            {
                properties: PAGE,
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun("CN20b header "),
                                    new Textbox({ style: { width: "150pt", height: "auto" }, children: [line("CN20b in the box")] }),
                                    new TextRun(" after"),
                                ],
                            }),
                        ],
                    }),
                },
                children: [line(`CN mode ${mode}`), ...compatPages()],
            },
        ],
        injections: [
            ...Object.entries(PICTURES).map(([name, offset]) => floatPicture(name, offset)),
            replaceMarkerRun("CN20a", RECTANGLE),
            cellSpacing,
        ],
    });
}

const MINCHO = { font: { eastAsia: "MS Mincho", ascii: "MS Mincho" }, size: 21 };
const JAPANESE = "日本語の文章に";
const AFTER = "と数字を含む。測量は夏に行われた。";
const mixed = (latin: object, times = 6): Paragraph[] => [
    new Paragraph({
        children: Array.from({ length: times }, () => [
            new TextRun({ text: JAPANESE, ...MINCHO }),
            new TextRun({ text: "Latin words", ...latin }),
            new TextRun({ text: AFTER, ...MINCHO }),
        ]).flat(),
    }),
];
await write({
    name: "word-stops-fe-layout4",
    options: { compatibility: { useFELayout: true } },
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("FE4a", [
                    ...mixed({ font: "Arial", size: 24 }, 3),
                    ...mixed({ font: "Times New Roman", size: 24 }, 3),
                    ...mixed({ font: "Cambria", size: 24 }, 3),
                ]),
                ...probe("FE4b", [...mixed({ font: "Calibri", size: 21, bold: true }, 3), ...mixed({ font: "Calibri", size: 16 }, 3)]),
                ...probe("FE4c", [
                    new Paragraph({
                        children: Array.from({ length: 6 }, () => [
                            new TextRun({ text: JAPANESE, font: { eastAsia: "Yu Mincho", ascii: "Yu Mincho" }, size: 21 }),
                            new TextRun({ text: "Latin words", font: "Calibri", size: 21 }),
                            new TextRun({ text: AFTER, font: { eastAsia: "Yu Mincho", ascii: "Yu Mincho" }, size: 21 }),
                        ]).flat(),
                    }),
                ]),
                ...probe("FE4d", [line(`FE4d ${"日本語(にほんご)の文章, Word, と数字。αβγの文字Ａａと".repeat(5)}`, {}, MINCHO)]),
                ...probe("FE4e", [
                    new Paragraph({
                        indent: { right: 176 },
                        children: [
                            new TextRun({ text: "日本語の文章に".repeat(6), ...MINCHO }),
                            new TextRun({ text: "Latin words", font: "Calibri", size: 21 }),
                        ],
                    }),
                ]),
                ...probe("FE4f", [
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({ text: JAPANESE, ...MINCHO }),
                            new TextRun({ text: "Latin words", font: "Calibri", size: 21 }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({ text: "Latin words", font: "Calibri", size: 21 }),
                            new TextRun({ text: JAPANESE, ...MINCHO }),
                        ],
                    }),
                ]),
            ],
        },
    ],
});
