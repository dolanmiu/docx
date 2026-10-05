/**
 * Probes of run and paragraph formatting docx/layout stops at, after `word-run-formatting.docx` (RF1 to RF8),
 * `word-run-formatting2.docx` (RF9 to RF14) and `word-paragraph-formats.docx` (B, A, C and L); and of contextual spacing
 * in a table cell, which docx/layout lays out unlike Word without stopping (`word-compat-settings.docx` CP11: Word leaves
 * out the first paragraph's space before and the last's space after in the cell, 24 points that docx/layout keeps).
 *
 * Calibri 11, single spaced, on A4 with inch margins; each probe between a line above and a line below.
 *
 * Run formatting (RF):
 * RF20a, RF20b: emphasis marks over (dot) and under (underDot) on one line (a); and over one word and under the next (b)
 * RF21: emphasis marks on a line with a picture of 20 points
 * RF22a to RF22h: a line with emphasis marks at 0.8, 0.9, 1.2, 1.25 and 1.3 lines (a to e), exactly 18 points (f), at
 *   least 14 points (g), and at 1.15 lines with a word raised 6 points (h)
 * RF23: a word longer than its line in a run with a border
 * RF24a, RF24b: a run border with a shadow (a), and drawn as a frame (b)
 * RF25a to RF25f: run borders of thinThickThinMediumGap 24, thickThinLargeGap 36, the art border apples at 12, single 4
 *   at 40 points from the text, double with no width, and single of width 1
 * RF26a, RF26b: text lowered by "-2.5pt" (a) and "-0.5pt" (b)
 * RF27a to RF27c: a size of "0.25in" (a) and "2pc" (b) in a run whose style gives 12 points, and "0.3cm" (c)
 * RF28a, RF28b: character spacing of "-0.5mm" (a) and a position of "-0.3cm" (b)
 * RF29: text fitted to 2000 twips (w:fitText)
 * RF30: two lines in one (w:eastAsianLayout w:combine)
 * RF31: text with a phonetic guide (w:ruby), Japanese
 * RF32: a picture in text with a border
 *
 * Paragraphs (PB):
 * PB1a to PB1c: two paragraphs whose borders are the same but for a between border: the first has one of 4 (a), of 12
 *   (b), and the second has one where the first hasn't (c) (B5f showed one case)
 * PB2a, PB2b: the empty paragraph that ends a section, with borders (a) and with automatic spacing (b)
 * PB3a, PB3b: paragraphs with the same borders either side of a continuous section break (a), and of a page break before
 *   the second (b)
 * PB4a to PB4e: paragraph borders: apples at 12 (a), thinThickThinLargeGap 24 (b), wave 18 (c), double of no width (d),
 *   single 4 at 40 points from the text (e)
 * PB5a to PB5e: indents in characters: a list whose number is 16 points and text 11, leftChars 400 (a); leftChars 400
 *   in a paragraph whose mark is 16 points and style 11 (b); rightChars 400 with text of 16 points and a mark of 11 (c);
 *   hangingChars 200 from a left indent of 1440 twips (d); leftChars 400 with a first line indent of 720 twips (e)
 * PB6a to PB6e: contextual spacing in a table cell: four paragraphs with 12 points before and after (a, CP11 again);
 *   the same with the paragraphs around the table in another style (b); one paragraph (c); the paragraphs in a style of
 *   their own and the table between Normal paragraphs (d); and without contextual spacing (e, the control)
 * PB7a to PB7d: the last line of a page at double spacing, its space below going into a page's footnotes (a), at the
 *   foot of columns evened out by a continuous section break (b), above its paragraph's bottom border (c), and in a
 *   table row that breaks across the page (d)
 * PB8: a picture of 10 points alone in a line of a paragraph whose mark is 20 points
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-text.ts [folder]
 */
import {
    BorderStyle,
    EmphasisMarkType,
    type ISectionOptions,
    LevelFormat,
    LineRuleType,
    Paragraph,
    SectionType,
    Table,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

import {
    ALL_BORDERS,
    type Child,
    PAGE,
    cell,
    fill,
    footnote,
    group,
    injectIntoParagraph,
    line,
    lines,
    marker,
    newPage,
    picture,
    probe,
    prose,
    replaceMarkerRun,
    write,
} from "./kit";

const border = (style: string, size: number, space = 1) => ({
    style: style as (typeof BorderStyle)[keyof typeof BorderStyle],
    size,
    space,
    color: "000000",
});
const box = (style: string, size: number, space = 4) => ({
    top: border(style, size, space),
    bottom: border(style, size, space),
    left: border(style, size, space),
    right: border(style, size, space),
});
const DOT = { emphasisMark: { type: EmphasisMarkType.DOT } };

const markedLine = (name: string, options: object = {}, extra: TextRun[] = []): Paragraph =>
    new Paragraph({
        ...options,
        children: [new TextRun(`${name} `), new TextRun({ text: prose(8), ...DOT }), ...extra, new TextRun(` ${prose(30)}`)],
    });

const spacings: readonly (readonly [string, object])[] = [
    ["RF22a", { spacing: { line: 192, lineRule: LineRuleType.AUTO } }],
    ["RF22b", { spacing: { line: 216, lineRule: LineRuleType.AUTO } }],
    ["RF22c", { spacing: { line: 288, lineRule: LineRuleType.AUTO } }],
    ["RF22d", { spacing: { line: 300, lineRule: LineRuleType.AUTO } }],
    ["RF22e", { spacing: { line: 312, lineRule: LineRuleType.AUTO } }],
    ["RF22f", { spacing: { line: 360, lineRule: LineRuleType.EXACT } }],
    ["RF22g", { spacing: { line: 280, lineRule: LineRuleType.AT_LEAST } }],
];

const children: Child[] = [
    ...probe("RF20a", [
        new Paragraph({
            children: [
                new TextRun("RF20a "),
                new TextRun({ text: "over", ...DOT }),
                new TextRun(" "),
                new TextRun({ text: "under", emphasisMark: { type: "underDot" as never } }),
                new TextRun(` ${prose(20)}`),
            ],
        }),
        line("RF20a next"),
    ]),
    ...group("RF20b", [
        new Paragraph({
            children: [
                new TextRun({ text: "RF20b over words", ...DOT }),
                new TextRun({ text: " under words", emphasisMark: { type: "underDot" as never } }),
            ],
        }),
        line("RF20b next"),
    ]),
    ...group("RF21", [markedLine("RF21", {}, [new TextRun(" "), picture(20, 20) as unknown as TextRun]), line("RF21 next")]),
    ...spacings.flatMap(([name, options]) =>
        group(name, [markedLine(name, options), markedLine(`${name} second`, options), line(`${name} next`)]),
    ),
    ...group("RF22h", [
        markedLine("RF22h", { spacing: { line: 276, lineRule: LineRuleType.AUTO } }, [new TextRun({ text: " raised", position: "6pt" })]),
        line("RF22h next"),
    ]),
    newPage(),
    ...group("RF23", [
        new Paragraph({
            children: [new TextRun("RF23 "), new TextRun({ text: "lighthousekeeper".repeat(10), border: border("single", 4) })],
        }),
    ]),
    ...group("RF24a", [
        new Paragraph({
            children: [
                new TextRun("RF24a "),
                new TextRun({ text: "shadowed", border: { ...border("single", 12, 2), shadow: true } as never }),
                new TextRun(` ${prose(20)}`),
            ],
        }),
    ]),
    ...group("RF24b", [
        new Paragraph({
            children: [
                new TextRun("RF24b "),
                new TextRun({ text: "framed", border: { ...border("single", 12, 2), frame: true } as never }),
                new TextRun(` ${prose(20)}`),
            ],
        }),
    ]),
    ...(
        [
            ["RF25a", border("thinThickThinMediumGap", 24)],
            ["RF25b", border("thickThinLargeGap", 36)],
            ["RF25c", border("apples", 12)],
            ["RF25d", border("single", 4, 40)],
            ["RF25e", border("double", 0)],
            ["RF25f", border("single", 1)],
        ] as const
    ).flatMap(([name, one]) =>
        group(name, [
            new Paragraph({
                children: [new TextRun(`${name} `), new TextRun({ text: "bordered", border: one }), new TextRun(` ${prose(20)}`)],
            }),
            line(`${name} next`),
        ]),
    ),
    ...group("RF26a", [
        new Paragraph({
            children: [new TextRun("RF26a "), new TextRun({ text: "lowered", position: "-2.5pt" }), new TextRun(` ${prose(20)}`)],
        }),
        line("RF26a next"),
    ]),
    ...group("RF26b", [
        new Paragraph({
            children: [new TextRun("RF26b "), new TextRun({ text: "lowered", position: "-0.5pt" }), new TextRun(` ${prose(20)}`)],
        }),
        line("RF26b next"),
    ]),
    newPage(),
    ...(["a", "b", "c"] as const).flatMap((letter) =>
        group(`RF27${letter}`, [
            new Paragraph({
                style: "Twelve",
                children: [new TextRun(`RF27${letter} `), marker(`SIZE_${letter}`), new TextRun(` ${prose(20)}`)],
            }),
            line(`RF27${letter} next`),
        ]),
    ),
    ...group("RF28a", [
        new Paragraph({ children: [new TextRun("RF28a "), marker("SPACING_a"), new TextRun(` ${prose(20)}`)] }),
        line("RF28a next"),
    ]),
    ...group("RF28b", [
        new Paragraph({ children: [new TextRun("RF28b "), marker("POSITION_b"), new TextRun(` ${prose(20)}`)] }),
        line("RF28b next"),
    ]),
    ...group("RF29", [new Paragraph({ children: [new TextRun("RF29 "), marker("FIT"), new TextRun(` ${prose(20)}`)] }), line("RF29 next")]),
    ...group("RF30", [
        new Paragraph({ children: [new TextRun("RF30 "), marker("COMBINE"), new TextRun(` ${prose(20)}`)] }),
        line("RF30 next"),
    ]),
    ...group("RF31", [
        new Paragraph({ children: [new TextRun("RF31 "), marker("RUBY"), new TextRun(` ${prose(20)}`)] }),
        line("RF31 next"),
    ]),
    ...group("RF32", [
        new Paragraph({
            children: [
                new TextRun("RF32 "),
                new TextRun({ text: "boxed ", border: border("single", 4) }),
                picture(20, 20) as unknown as TextRun,
                new TextRun(` ${prose(20)}`),
            ],
        }),
        line("RF32 next"),
    ]),
    newPage(),
    ...group("PB1a", [
        new Paragraph({ border: { ...box("single", 4), between: border("single", 4, 4) }, children: [new TextRun("PB1a first")] }),
        new Paragraph({ border: box("single", 4), children: [new TextRun("PB1a second")] }),
    ]),
    ...group("PB1b", [
        new Paragraph({ border: { ...box("single", 4), between: border("single", 12, 4) }, children: [new TextRun("PB1b first")] }),
        new Paragraph({ border: box("single", 4), children: [new TextRun("PB1b second")] }),
    ]),
    ...group("PB1c", [
        new Paragraph({ border: box("single", 4), children: [new TextRun("PB1c first")] }),
        new Paragraph({ border: { ...box("single", 4), between: border("single", 4, 4) }, children: [new TextRun("PB1c second")] }),
    ]),
    ...(
        [
            ["PB4a", box("apples", 12)],
            ["PB4b", box("thinThickThinLargeGap", 24)],
            ["PB4c", box("wave", 18)],
            ["PB4d", box("double", 0)],
            ["PB4e", box("single", 4, 40)],
        ] as const
    ).flatMap(([name, borders]) => group(name, [new Paragraph({ border: borders, children: [new TextRun(`${name} ${prose(20)}`)] })])),
    newPage(),
    ...group("PB5a", [
        new Paragraph({ numbering: { reference: "big", level: 0 }, children: [new TextRun(`PB5a ${prose(30)}`), marker("CHARS_a")] }),
    ]),
    ...group("PB5b", [new Paragraph({ run: { size: 32 }, children: [new TextRun(`PB5b ${prose(30)}`), marker("CHARS_b")] })]),
    ...group("PB5c", [new Paragraph({ children: [new TextRun({ text: `PB5c ${prose(30)}`, size: 32 }), marker("CHARS_c")] })]),
    ...group("PB5d", [new Paragraph({ indent: { left: 1440 }, children: [new TextRun(`PB5d ${prose(30)}`), marker("CHARS_d")] })]),
    ...group("PB5e", [new Paragraph({ indent: { firstLine: 720 }, children: [new TextRun(`PB5e ${prose(30)}`), marker("CHARS_e")] })]),
    newPage(),
    ...(["a", "b", "c", "d", "e"] as const).flatMap((letter) => {
        const name = `PB6${letter}`;
        const contextual = letter !== "e";
        const count = letter === "c" ? 1 : 4;
        const style = letter === "d" ? "Cellish" : undefined;
        const around = letter === "b" ? "Outside" : undefined;
        return group(name, [
            line(`${name} before table`, around ? { style: around } : {}),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [9026],
                borders: ALL_BORDERS,
                rows: [
                    new TableRow({
                        children: [
                            cell(
                                Array.from({ length: count }, (_, index) =>
                                    line(`${name} para ${index + 1}`, {
                                        contextualSpacing: contextual,
                                        spacing: { before: 240, after: 240 },
                                        ...(style ? { style } : {}),
                                    }),
                                ),
                            ),
                        ],
                    }),
                ],
            }),
            line(`${name} after table`, around ? { style: around } : {}),
        ]);
    }),
    newPage(),
    ...probe("PB7a", [
        ...fill("PB7a", 40),
        new Paragraph({ children: [new TextRun("PB7a reference"), footnote(line("PB7a note"))] }),
        ...fill("PB7a more", 6),
        lines("PB7a double", 3, { spacing: { line: 480, lineRule: LineRuleType.AUTO } }),
    ]),
    ...probe("PB7c", [
        ...fill("PB7c", 45),
        new Paragraph({
            border: { bottom: border("single", 12, 4) },
            spacing: { line: 480, lineRule: LineRuleType.AUTO },
            children: [new TextRun(`PB7c ${prose(60)}`)],
        }),
    ]),
    ...probe("PB7d", [
        ...fill("PB7d", 44),
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            borders: ALL_BORDERS,
            rows: [new TableRow({ children: [cell([lines("PB7d cell", 8, { spacing: { line: 480, lineRule: LineRuleType.AUTO } })])] })],
        }),
    ]),
    ...probe("PB8", [new Paragraph({ run: { size: 40 }, children: [picture(10, 10)] }), line("PB8 next")]),
];

const sections: ISectionOptions[] = [
    { properties: PAGE, children },
    // PB2a: the empty paragraph that ends a section has borders; PB2b: automatic spacing
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE },
        children: [line("PB2a above"), line(`PB2a ${prose(20)}`), new Paragraph({ children: [marker("SECTMARK_a")] })],
    },
    {
        properties: { ...PAGE, type: SectionType.CONTINUOUS },
        children: [line("PB2a below"), line("PB2b above"), line(`PB2b ${prose(20)}`), new Paragraph({ children: [marker("SECTMARK_b")] })],
    },
    {
        properties: { ...PAGE, type: SectionType.CONTINUOUS },
        children: [
            line("PB2b below"),
            line("PB3a above"),
            new Paragraph({ border: box("single", 4), children: [new TextRun("PB3a before the break")] }),
        ],
    },
    {
        properties: { ...PAGE, type: SectionType.CONTINUOUS },
        children: [
            new Paragraph({ border: box("single", 4), children: [new TextRun("PB3a after the break")] }),
            line("PB3a below"),
            line("PB3b above"),
            new Paragraph({ border: box("single", 4), children: [new TextRun("PB3b before")] }),
            new Paragraph({ pageBreakBefore: true, border: box("single", 4), children: [new TextRun("PB3b after a page break")] }),
            line("PB3b below"),
        ],
    },
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } },
        children: [
            line("PB7b above"),
            ...fill("PB7b", 50),
            lines("PB7b double", 4, { spacing: { line: 480, lineRule: LineRuleType.AUTO } }),
        ],
    },
    { properties: { ...PAGE, type: SectionType.CONTINUOUS }, children: [line("PB7b below")] },
];

const injections = [
    replaceMarkerRun("SIZE_a", '<w:r><w:rPr><w:sz w:val="0.25in"/></w:rPr><w:t>quarter</w:t></w:r>'),
    replaceMarkerRun("SIZE_b", '<w:r><w:rPr><w:sz w:val="2pc"/></w:rPr><w:t>picas</w:t></w:r>'),
    replaceMarkerRun("SIZE_c", '<w:r><w:rPr><w:sz w:val="0.3cm"/></w:rPr><w:t>centimetres</w:t></w:r>'),
    replaceMarkerRun("SPACING_a", '<w:r><w:rPr><w:spacing w:val="-0.5mm"/></w:rPr><w:t>squeezed</w:t></w:r>'),
    replaceMarkerRun("POSITION_b", '<w:r><w:rPr><w:position w:val="-0.3cm"/></w:rPr><w:t>lowered</w:t></w:r>'),
    replaceMarkerRun("FIT", '<w:r><w:rPr><w:fitText w:val="2000" w:id="1"/></w:rPr><w:t>fitted text</w:t></w:r>'),
    replaceMarkerRun("COMBINE", '<w:r><w:rPr><w:eastAsianLayout w:id="2" w:combine="1"/></w:rPr><w:t>twolines</w:t></w:r>'),
    replaceMarkerRun(
        "RUBY",
        '<w:r><w:ruby><w:rubyPr><w:rubyAlign w:val="distributeSpace"/><w:hps w:val="11"/><w:hpsRaise w:val="20"/><w:hpsBaseText w:val="22"/><w:lid w:val="ja-JP"/></w:rubyPr><w:rt><w:r><w:rPr><w:sz w:val="11"/></w:rPr><w:t>かんじ</w:t></w:r></w:rt><w:rubyBase><w:r><w:t>漢字</w:t></w:r></w:rubyBase></w:ruby></w:r>',
    ),
    injectIntoParagraph("CHARS_a", { pPr: '<w:ind w:leftChars="400" w:left="880" w:hanging="360"/>' }),
    injectIntoParagraph("CHARS_b", { pPr: '<w:ind w:leftChars="400" w:left="880"/>' }),
    injectIntoParagraph("CHARS_c", { pPr: '<w:ind w:rightChars="400" w:right="880"/>' }),
    injectIntoParagraph("CHARS_d", { pPr: '<w:ind w:left="1440" w:hangingChars="200" w:hanging="440"/>' }),
    injectIntoParagraph("CHARS_e", { pPr: '<w:ind w:leftChars="400" w:left="880" w:firstLine="720"/>' }),
    // PB2: the section's last paragraph, which docx writes after the marker's, takes borders or automatic spacing
    ...(
        [
            [
                "SECTMARK_a",
                '<w:pBdr><w:top w:val="single" w:sz="12" w:space="4" w:color="000000"/><w:bottom w:val="single" w:sz="12" w:space="4" w:color="000000"/></w:pBdr>',
            ],
            ["SECTMARK_b", '<w:spacing w:beforeAutospacing="1" w:afterAutospacing="1"/>'],
        ] as const
    ).map(([name, xml]) => (parts: Map<string, string>) => {
        let text = parts.get("word/document.xml")!;
        const at = text.indexOf(`@@${name}@@`);
        const start = text.lastIndexOf("<w:p>", at);
        const end = text.indexOf("</w:p>", at) + 6;
        text = text.slice(0, start) + text.slice(end);
        const sectPr = text.indexOf("<w:sectPr", start);
        parts.set("word/document.xml", `${text.slice(0, sectPr)}${xml}${text.slice(sectPr)}`);
    }),
];

await write({
    name: "word-stops-text",
    sections,
    injections,
    options: {
        styles: {
            paragraphStyles: [
                { id: "Twelve", name: "Twelve", basedOn: "Normal", run: { size: 24 } },
                { id: "Outside", name: "Outside", basedOn: "Normal", run: { color: "333333" } },
                { id: "Cellish", name: "Cellish", basedOn: "Normal", run: { color: "333333" } },
            ],
        },
        numbering: {
            config: [
                {
                    reference: "big",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            style: { paragraph: { indent: { left: 880, hanging: 360 } }, run: { size: 32 } },
                        },
                    ],
                },
            ],
        },
    } as object,
});
