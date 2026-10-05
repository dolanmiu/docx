/**
 * Probes of what Word's PDFs of word-stops-text, word-stops-tabs and word-stops-kerning left open, for docx/layout's stops
 * at them. Calibri 11, single spaced, on A4 with inch margins (lines of 9026 twips); each probe between a line above and a
 * line below.
 *
 * Sizes and lengths:
 * RF27d to RF27g: a size of "0.25in" (18 points, whole half-points) and "0.3cm" (8.5 points) in a run with no style giving a
 *   size (d, f), and of "0.4in" (28.8 points) and "1cm" (28.35 points), which aren't, in a run whose style gives 12 points
 *   (e, g): which of a style's size and whole half-points decides whether Word draws a size in a unit other than points
 *   (word-stops-text RF27a to RF27c drew whole half-points in a style of 12 points; word-units2 V3 ignored others with no
 *   style)
 *
 * Indents in characters:
 * PB5f: leftChars 400 with a hanging indent of 360 twips, in a paragraph without a list
 * PB5g: the same in a list whose number is the size of its text (PB5a's number was 16 points and its text 11)
 *
 * Multiple spacing below the page:
 * PB7e to PB7g: 46, 47 and 48 lines of fill and a reference to a one-line footnote, then a paragraph of one line at double
 *   spacing, which fits on the page only without its spacing's room below it, in one of them: whether that room can go into
 *   the footnotes (PB7a's paragraph moved whole by widow control)
 *
 * Soft hyphens:
 * SH16a to SH16i: a line whose word's soft hyphen has its hyphen end 3.5, 5, 7, 9, 11, 13, 15, 17 and 19 twips before the
 *   margin, after a tab to a left stop that places it (SH13 broke at 19.9, and SH2 didn't at 2.7)
 * SH16j to SH16l: justified lines of 13 spaces whose hyphen ends 0.5, 1.5 and 2.5 twips before the end of the line: whether
 *   Word squeezes one Word wouldn't break at on a line that isn't justified
 * SH17: a justified line where "Do-" fits with 200 twips to spare and "Donau-" only squeezed: which Word takes
 *
 * Justified lines:
 * JU4a, JU4b: justified lines of 10 ordinary spaces and 5 en spaces whose last word is past the end by 27% and 35% of the
 *   ordinary spaces' width, under a quarter of all the spaces' width: whether the en spaces count in the squeeze (JU1 had
 *   only en, em or ideographic spaces, which Word didn't squeeze)
 *
 * Run formatting:
 * RF24c, RF24d: a run border of 1.5 points 2 points from the text with a shadow (c), and drawn as a frame (d), written in
 *   the XML (docx doesn't write them, so RF24a and RF24b had neither)
 * RF32b: a picture of 20 points in a run with a border of its own
 * RF29b to RF29d: text fitted to 500 twips, narrower than it (b); two runs fitted together to 2000 twips with one w:id (c);
 *   and fitted text of 3000 twips at the end of a line, where it doesn't fit in the room left (d)
 * RF31b to RF31d: a phonetic guide wider than its base (b), one centred over its base (c), and one in a line of 20-point text
 *   (d)
 *
 * Tabs:
 * TA9a to TA9c: a right, centred and decimal stop at 9500, past the end of the line, after text in a paragraph with a first
 *   line indent of 720; TA9d to TA9f: the same with a hanging indent of 720
 * TA9g: a right stop at 8500, past the right indent, in a justified paragraph indented 1000 on the right
 * TA9h: a centred stop at 9500 at the start of a line in a paragraph indented 1000 on the left (TA3d was a right one)
 * TA9i: a right stop at 9500 after text in a paragraph indented 1000 on the left
 *
 * Kerning:
 * KE9a, KE9b: "A-VA-VA-V..." with a soft hyphen in each "A-V", kerned from 1 point (a) and not kerned (b), on one line:
 *   whether Word kerns across a soft hyphen where the line doesn't break there (SH15a's pairs barely kern)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-text2.ts [folder]
 */
// cspell:ignore Donaudampf dampf schiff fahrt Donau
import { AlignmentType, LevelFormat, LineRuleType, Paragraph, TabStopType, TextRun } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

import {
    type Child,
    type Injection,
    PAGE,
    fill,
    footnote,
    group,
    injectIntoParagraph,
    line,
    marker,
    newPage,
    picture,
    probe,
    prose,
    replaceMarkerRun,
    softHyphens,
    write,
} from "./kit";

const CALIBRI = { font: "Calibri", size: 11 };
const twips = (text: string): number => measureTextWidth(text, CALIBRI) * 20;
const LINE = 9026;
const SOFT = "­";
const EN_SPACE = " ";

/** SH16a to SH16i: a line whose hyphen ends `gap` twips before the margin, after a tab to the left stop that places it */
const hyphenGap = (name: string, gap: number): Paragraph => {
    const part = "eeeee";
    const stop = LINE - gap - twips(`${part}-`);
    return new Paragraph({
        tabStops: [{ type: TabStopType.LEFT, position: Math.round(stop) }],
        children: [new TextRun(`${name}\t${part}${SOFT}continuation and more of the line`)],
    });
};

/** SH16j to SH16l: a justified line whose hyphen ends `gap` twips before its end, set by the paragraph's right indent */
const justifiedGap = (name: string, gap: number): Paragraph => {
    const before = `${name} of the by in to and on of the by in to and on eeee`;
    const end = twips(`${before}-`);
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { right: Math.round(LINE - end - gap) },
        children: [new TextRun(`${before}${SOFT}continuation ${prose(30)}`)],
    });
};

/** JU4: a justified line of 10 ordinary and 5 en spaces whose last word is past its end by a share of the ordinary spaces */
const enSpaces = (name: string, share: number): Paragraph => {
    const words = ["of", "the", "by", "in", "to", "and", "on", "of", "the", "by", "in", "to", "and", "on", "of"];
    const first = `${name} ${words.slice(0, 9).join(" ")}${EN_SPACE}${words.slice(9).join(EN_SPACE)} lighthouse`;
    const ordinary = 10 * twips(" ");
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { right: Math.round(LINE - (twips(first) - share * ordinary)) },
        children: [new TextRun(`${first} ${prose(30)}`)],
    });
};

const BORDER = '<w:bdr w:val="single" w:sz="12" w:space="2" w:color="000000"';
const ruby = (guide: string, base: string, align = "distributeSpace", size = 22): string =>
    `<w:r><w:ruby><w:rubyPr><w:rubyAlign w:val="${align}"/><w:hps w:val="11"/><w:hpsRaise w:val="20"/><w:hpsBaseText w:val="${size}"/><w:lid w:val="ja-JP"/></w:rubyPr><w:rt><w:r><w:rPr><w:sz w:val="11"/></w:rPr><w:t>${guide}</w:t></w:r></w:rt><w:rubyBase><w:r><w:rPr><w:sz w:val="${size}"/></w:rPr><w:t>${base}</w:t></w:r></w:rubyBase></w:ruby></w:r>`;

/** Gives the picture after a marker a border of its own, and takes the marker out */
const borderedPicture =
    (name: string): Injection =>
    (parts) => {
        const text = parts.get("word/document.xml")!;
        const at = text.indexOf(`@@${name}@@`);
        if (at < 0) {
            throw new Error(`No marker ${name} in word/document.xml`);
        }
        const runStart = text.lastIndexOf("<w:r>", at);
        const runEnd = text.indexOf("</w:r>", at) + "</w:r>".length;
        const withoutMarker = text.slice(0, runStart) + text.slice(runEnd);
        const drawing = withoutMarker.indexOf("<w:r><w:drawing>", runStart);
        // The picture's run must follow the marker's directly, with no properties of its own yet
        if (drawing < 0 || withoutMarker.lastIndexOf("</w:p>", drawing) > runStart) {
            throw new Error(`No picture run after the marker ${name} in its paragraph`);
        }
        parts.set(
            "word/document.xml",
            `${withoutMarker.slice(0, drawing)}<w:r><w:rPr>${BORDER}/></w:rPr><w:drawing>${withoutMarker.slice(drawing + "<w:r><w:drawing>".length)}`,
        );
    };

const children: Child[] = [
    ...probe("RF27d", [
        new Paragraph({ children: [new TextRun("RF27d "), marker("SIZE_d"), new TextRun(` ${prose(20)}`)] }),
        line("RF27d next"),
    ]),
    ...group("RF27e", [
        new Paragraph({ style: "Twelve", children: [new TextRun("RF27e "), marker("SIZE_e"), new TextRun(` ${prose(20)}`)] }),
        line("RF27e next"),
    ]),
    ...group("RF27f", [
        new Paragraph({ children: [new TextRun("RF27f "), marker("SIZE_f"), new TextRun(` ${prose(20)}`)] }),
        line("RF27f next"),
    ]),
    ...group("RF27g", [
        new Paragraph({ style: "Twelve", children: [new TextRun("RF27g "), marker("SIZE_g"), new TextRun(` ${prose(20)}`)] }),
        line("RF27g next"),
    ]),
    ...group("PB5f", [new Paragraph({ children: [new TextRun(`PB5f ${prose(30)}`), marker("CHARS_f")] })]),
    ...group("PB5g", [
        new Paragraph({ numbering: { reference: "same", level: 0 }, children: [new TextRun(`PB5g ${prose(30)}`), marker("CHARS_g")] }),
    ]),
    ...[46, 47, 48].flatMap((count, index) => {
        const name = `PB7${"efg"[index]}`;
        return probe(name, [
            ...fill(name, count),
            new Paragraph({ children: [new TextRun(`${name} reference`), footnote(line(`${name} note`))] }),
            line(`${name} double`, { spacing: { line: 480, lineRule: LineRuleType.AUTO } }),
        ]);
    }),
    ...probe("SH16a", [hyphenGap("SH16a", 3.5)]),
    ...[5, 7, 9, 11, 13, 15, 17, 19].flatMap((gap, index) =>
        group(`SH16${"bcdefghi"[index]}`, [hyphenGap(`SH16${"bcdefghi"[index]}`, gap)]),
    ),
    ...[0.5, 1.5, 2.5].flatMap((gap, index) => group(`SH16${"jkl"[index]}`, [justifiedGap(`SH16${"jkl"[index]}`, gap)])),
    ...group("SH17", [
        (() => {
            const before = "SH17 of the by in to and on of the by in to and on of the by in";
            return new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                indent: { right: Math.round(LINE - twips(`${before} Do-`) - 200) },
                children: [new TextRun(`${before} Do${SOFT}nau${SOFT}dampf${SOFT}schiff ${prose(30)}`)],
            });
        })(),
    ]),
    newPage(),
    ...group("JU4a", [enSpaces("JU4a", 0.27)]),
    ...group("JU4b", [enSpaces("JU4b", 0.35)]),
    ...group("RF24c", [
        new Paragraph({ children: [new TextRun("RF24c "), marker("SHADOW"), new TextRun(` ${prose(20)}`)] }),
        line("RF24c next"),
    ]),
    ...group("RF24d", [
        new Paragraph({ children: [new TextRun("RF24d "), marker("FRAME"), new TextRun(` ${prose(20)}`)] }),
        line("RF24d next"),
    ]),
    ...group("RF32b", [
        new Paragraph({ children: [new TextRun("RF32b "), marker("PICTURE"), picture(20, 20), new TextRun(` ${prose(20)}`)] }),
        line("RF32b next"),
    ]),
    ...group("RF29b", [
        new Paragraph({ children: [new TextRun("RF29b "), marker("FIT_b"), new TextRun(` ${prose(20)}`)] }),
        line("RF29b next"),
    ]),
    ...group("RF29c", [
        new Paragraph({ children: [new TextRun("RF29c "), marker("FIT_c"), new TextRun(` ${prose(20)}`)] }),
        line("RF29c next"),
    ]),
    ...group("RF29d", [
        new Paragraph({ children: [new TextRun(`RF29d ${prose(14)} `), marker("FIT_d"), new TextRun(` ${prose(10)}`)] }),
        line("RF29d next"),
    ]),
    ...group("RF31b", [
        new Paragraph({ children: [new TextRun("RF31b "), marker("RUBY_b"), new TextRun(` ${prose(20)}`)] }),
        line("RF31b next"),
    ]),
    ...group("RF31c", [
        new Paragraph({ children: [new TextRun("RF31c "), marker("RUBY_c"), new TextRun(` ${prose(20)}`)] }),
        line("RF31c next"),
    ]),
    ...group("RF31d", [
        new Paragraph({
            children: [new TextRun({ text: "RF31d ", size: 40 }), marker("RUBY_d"), new TextRun({ text: ` ${prose(10)}`, size: 40 })],
        }),
        line("RF31d next"),
    ]),
    ...(
        [
            ["TA9a", TabStopType.RIGHT, { firstLine: 720 }],
            ["TA9b", TabStopType.CENTER, { firstLine: 720 }],
            ["TA9c", TabStopType.DECIMAL, { firstLine: 720 }],
            ["TA9d", TabStopType.RIGHT, { left: 720, hanging: 720 }],
            ["TA9e", TabStopType.CENTER, { left: 720, hanging: 720 }],
            ["TA9f", TabStopType.DECIMAL, { left: 720, hanging: 720 }],
        ] as const
    ).flatMap(([name, type, indent]) =>
        group(name, [new Paragraph({ indent, tabStops: [{ type, position: 9500 }], children: [new TextRun(`${name} text\t12.5 after`)] })]),
    ),
    ...group("TA9g", [
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { right: 1000 },
            tabStops: [{ type: TabStopType.RIGHT, position: 8500 }],
            children: [new TextRun(`TA9g ${prose(8)}\tright ${prose(30)}`)],
        }),
    ]),
    ...group("TA9h", [
        new Paragraph({
            indent: { left: 1000 },
            tabStops: [{ type: TabStopType.CENTER, position: 9500 }],
            children: [new TextRun("\tTA9h after")],
        }),
    ]),
    ...group("TA9i", [
        new Paragraph({
            indent: { left: 1000 },
            tabStops: [{ type: TabStopType.RIGHT, position: 9500 }],
            children: [new TextRun("TA9i text\tafter")],
        }),
    ]),
    ...group("KE9a", [new Paragraph({ children: [new TextRun({ text: `KE9a ${`A${SOFT}V`.repeat(12)} end`, kern: 2 })] })]),
    ...group("KE9b", [new Paragraph({ children: [new TextRun({ text: `KE9b ${`A${SOFT}V`.repeat(12)} end` })] })]),
];

const injections: Injection[] = [
    replaceMarkerRun("SIZE_d", '<w:r><w:rPr><w:sz w:val="0.25in"/></w:rPr><w:t>quarter</w:t></w:r>'),
    replaceMarkerRun("SIZE_e", '<w:r><w:rPr><w:sz w:val="0.4in"/></w:rPr><w:t>inches</w:t></w:r>'),
    replaceMarkerRun("SIZE_f", '<w:r><w:rPr><w:sz w:val="0.3cm"/></w:rPr><w:t>centimetres</w:t></w:r>'),
    replaceMarkerRun("SIZE_g", '<w:r><w:rPr><w:sz w:val="1cm"/></w:rPr><w:t>centimetre</w:t></w:r>'),
    injectIntoParagraph("CHARS_f", { pPr: '<w:ind w:leftChars="400" w:left="880" w:hanging="360"/>' }),
    injectIntoParagraph("CHARS_g", { pPr: '<w:ind w:leftChars="400" w:left="880" w:hanging="360"/>' }),
    replaceMarkerRun("SHADOW", `<w:r><w:rPr>${BORDER} w:shadow="1"/></w:rPr><w:t>shadowed</w:t></w:r>`),
    replaceMarkerRun("FRAME", `<w:r><w:rPr>${BORDER} w:frame="1"/></w:rPr><w:t>framed</w:t></w:r>`),
    borderedPicture("PICTURE"),
    replaceMarkerRun("FIT_b", '<w:r><w:rPr><w:fitText w:val="500" w:id="3"/></w:rPr><w:t>fitted text</w:t></w:r>'),
    replaceMarkerRun(
        "FIT_c",
        '<w:r><w:rPr><w:fitText w:val="2000" w:id="4"/></w:rPr><w:t xml:space="preserve">fitted </w:t></w:r><w:r><w:rPr><w:b/><w:fitText w:val="2000" w:id="4"/></w:rPr><w:t>text</w:t></w:r>',
    ),
    replaceMarkerRun("FIT_d", '<w:r><w:rPr><w:fitText w:val="3000" w:id="5"/></w:rPr><w:t>fitted text</w:t></w:r>'),
    replaceMarkerRun("RUBY_b", ruby("かんじかんじかんじ", "漢字")),
    replaceMarkerRun("RUBY_c", ruby("かんじ", "漢字", "center")),
    replaceMarkerRun("RUBY_d", ruby("かんじ", "漢字", "distributeSpace", 40)),
    softHyphens(),
];

await write({
    name: "word-stops-text2",
    sections: [{ properties: PAGE, children }],
    injections,
    options: {
        styles: { paragraphStyles: [{ id: "Twelve", name: "Twelve", basedOn: "Normal", run: { size: 24 } }] },
        numbering: {
            config: [
                {
                    reference: "same",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            style: { paragraph: { indent: { left: 880, hanging: 360 } } },
                        },
                    ],
                },
            ],
        },
    } as object,
});
