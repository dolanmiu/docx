/**
 * Probes of what Word's PDF of word-stops-text2 left open, for docx/layout's stops at them, and of a rule it follows past
 * what Word's PDFs showed: a tab that goes on to the next line with a word that doesn't fit after a default stop. Calibri
 * 11, single spaced, on A4 with inch margins (lines of 9026 twips); each probe between a line above and a line below.
 *
 * Phonetic guides (the guide and its base in MS Mincho, written in the XML, as docx doesn't write them):
 * RF31e to RF31g: a guide of 5.5 points raised 0, 5 and 15 points over a base of 11 (word-stops-text2.ts RF31b was raised 10)
 * RF31h, RF31i: a guide of 8 and 11 points raised 10 points over a base of 11
 * RF31j: a guide of 5.5 points raised 10 points over a base of 20, in a line of Calibri 20 (RF31d's, with the fonts given)
 * RF31k: a guide of Latin letters over a base of Latin letters, in Calibri, raised 10 points
 * RF31l: RF31b's guide on the second line of its paragraph: how much higher the line is than the one before it
 *
 * Tabs:
 * TA12a: a tab after text that ends past 7920 twips, to the default stop at 8640, with "afterwards" after it, which doesn't
 *   fit before the margin: whether the tab goes on to the next line with it, to the first default stop there, as it does
 *   after a stop of the paragraph's own (word-stops-text2.ts TA11a), as docx/layout lays it out
 * TA12b, TA12c: a right and a centred stop at 8800 after text that ends at 8500, with "afterwards" after it
 * TA12d: a picture of 20 points after a left stop at 8800, which doesn't fit before the margin
 * TA12e: "afterwards" after two tabs in a row, to left stops at 8000 and 8600
 * TA12f: "afterwards", with a soft hyphen after "after", after a left stop at 8800, where "after-" doesn't fit either
 * TA12g: a tab at the start of a line to a left stop at 8000, and a picture of 100 points after it
 * TA12h: a numbered paragraph whose text after its number's tab is one word longer than the line
 * TA12i, TA12j: a centred stop at 9500 after text, and a right one at the start of a line, in a paragraph indented 1000 on
 *   the right
 * TA12k: a left stop at 9500 at the start of a first line indented 720
 * TA12l: a right stop at 8500, past the right indent of 1000, in a distributed paragraph (word-stops-text2.ts TA10g's
 *   justified)
 *
 * Soft hyphens:
 * SH18a: a justified line where "Do-" fits with 240 twips to spare and "Donau-" only squeezed, 96 past the end: whether
 *   Word squeezes the longer part when the shorter would leave more than twice the room (word-stops-text2.ts SH17 left 200,
 *   and "Donau-" was 136 past)
 * SH18b: the same, distributed
 * SH18c, SH18d: "LASTWORD" and "SURVEYTOWN", with a soft hyphen in each, kerned from a point, in Calibri, broken at the
 *   soft hyphen at the end of a line: whether the hyphen Word draws is kerned with the "T" or "Y" before it
 * SH18e: "office efficient", with a soft hyphen between the "f" and "f" of "office" and between the "f" and "i" of
 *   "efficient", in standard ligatures, and "office efficient" after it without them, on one line: whether the letters join
 *   across the soft hyphens
 *
 * Justified lines:
 * JU5a, JU5b: justified lines of 10 ordinary spaces and 6 en spaces whose last word is past the end by 12% and 20% of the
 *   ordinary spaces' width: whether Word squeezes them in, as it would without the en spaces (word-stops-text2.ts JU4: not at
 *   27% and 35%)
 *
 * Run formatting:
 * RF24e: a double run border of half a point with a shadow; RF24f: a dotted one drawn as a frame; RF24g: a single one of 3
 *   points with a shadow, no space
 * RF32c: a picture of 20 points in a run with a border of its own, at 1.5 lines; RF32d: the same picture between text with
 *   the same border, before and after it
 * RF29e: text fitted to 12000 twips, wider than its line; RF29f: two runs fitted together with one w:id, of 11 and 16 points
 *
 * Multiple spacing below the page:
 * PB7h to PB7j: on a document grid of lines of 360 twips, 33 lines of fill and a reference to a one-line footnote, then a
 *   line 370, 390 and 410 twips below them, which fits on the page only without the grid's room below its text, in one of
 *   them: whether that room can go into the footnotes, as multiple spacing's can't (word-stops-text2.ts PB7e)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-text3.ts [folder]
 */
// cspell:ignore Donaudampf dampf schiff Donau
import { AlignmentType, DocumentGridType, type ISectionOptions, LevelFormat, LineRuleType, Paragraph, TabStopType, TextRun } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

import {
    type Child,
    type Injection,
    PAGE,
    fill,
    footnote,
    group,
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
const twips = (text: string, font: { readonly font: string; readonly size: number } = CALIBRI): number => measureTextWidth(text, font) * 20;
const LINE = 9026;
const SOFT = String.fromCodePoint(0xad);
const EN_SPACE = String.fromCodePoint(0x2002);

/** Prose after a probe's name that ends between `from` and `to` twips across the line */
const proseBetween = (name: string, from: number, to: number): string => {
    let text = name;
    let count = 0;
    while (twips(text) < from) {
        text = `${name} ${prose(++count)}`;
    }
    if (twips(text) > to) {
        throw new Error(`No prose after ${name} ends between ${from} and ${to}`);
    }
    return text;
};

// Phonetic guides, in MS Mincho, which Word drew word-stops-text2's in
const MINCHO = '<w:rFonts w:ascii="MS Mincho" w:eastAsia="MS Mincho" w:hAnsi="MS Mincho"/>';
const CALIBRI_FONTS = '<w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri"/>';
const ruby = ({
    guide = "かんじ",
    base = "漢字",
    raise = 20,
    size = 11,
    baseSize = 22,
    fonts = MINCHO,
}: {
    readonly guide?: string;
    readonly base?: string;
    readonly raise?: number;
    readonly size?: number;
    readonly baseSize?: number;
    readonly fonts?: string;
}): string =>
    `<w:r><w:ruby><w:rubyPr><w:rubyAlign w:val="distributeSpace"/><w:hps w:val="${size}"/><w:hpsRaise w:val="${raise}"/><w:hpsBaseText w:val="${baseSize}"/><w:lid w:val="ja-JP"/></w:rubyPr><w:rt><w:r><w:rPr>${fonts}<w:sz w:val="${size}"/></w:rPr><w:t>${guide}</w:t></w:r></w:rt><w:rubyBase><w:r><w:rPr>${fonts}<w:sz w:val="${baseSize}"/></w:rPr><w:t>${base}</w:t></w:r></w:rubyBase></w:ruby></w:r>`;

/** SH18a, SH18b: a line where "Do-" fits with 240 twips to spare, and "Donau-" only squeezed, 96 past the end */
const shorterPart = (name: string, alignment: (typeof AlignmentType)[keyof typeof AlignmentType]): Paragraph => {
    const before = `${name} of the by in to and on of the by in to and on of the by in`;
    const right = Math.round(LINE - twips(`${before} Do-`) - 240);
    if (Math.abs(twips(`${before} Donau-`) - (LINE - right) - 96) > 5) {
        throw new Error(`"Donau-" isn't 96 twips past the end in ${name}`);
    }
    return new Paragraph({
        alignment,
        indent: { right },
        children: [new TextRun(`${before} Do${SOFT}nau${SOFT}dampf${SOFT}schiff ${prose(30)}`)],
    });
};

/** SH18c, SH18d: a kerned word whose soft hyphen's part, with a hyphen, ends 100 twips before the end of the line */
const kernedHyphen = (name: string, word: readonly [string, string], font: string): Paragraph => {
    const sized = { font, size: 11 };
    const text = proseBetween(name, 5000, 6000);
    const right = Math.round(LINE - twips(`${text} ${word[0]}-`, sized) - 100);
    return new Paragraph({
        indent: { right },
        children: [new TextRun({ text: `${text} ${word[0]}${SOFT}${word[1]} ${prose(20)}`, font, kern: 2 })],
    });
};

/** JU5: a justified line of 10 ordinary and 6 en spaces whose last word is past its end by a share of the ordinary spaces */
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

const border = (attributes: string): string => `<w:bdr ${attributes} w:color="000000"/>`;

/** Gives the picture after a marker a border of its own, and takes the marker out (word-stops-text2.ts RF32b) */
const borderedPicture =
    (name: string, attributes: string): Injection =>
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
        if (drawing < 0 || withoutMarker.lastIndexOf("</w:p>", drawing) > runStart) {
            throw new Error(`No picture run after the marker ${name} in its paragraph`);
        }
        parts.set(
            "word/document.xml",
            `${withoutMarker.slice(0, drawing)}<w:r><w:rPr>${border(attributes)}</w:rPr><w:drawing>${withoutMarker.slice(drawing + "<w:r><w:drawing>".length)}`,
        );
    };

const SINGLE = 'w:val="single" w:sz="12" w:space="2"';

const children: Child[] = [
    ...probe("RF31e", [
        new Paragraph({ children: [new TextRun("RF31e "), marker("RUBY_e"), new TextRun(` ${prose(20)}`)] }),
        line("RF31e next"),
    ]),
    ...(
        [
            ["f", { raise: 10 }],
            ["g", { raise: 30 }],
            ["h", { size: 16 }],
            ["i", { size: 22 }],
        ] as const
    ).flatMap(([letter]) =>
        group(`RF31${letter}`, [
            new Paragraph({
                children: [new TextRun(`RF31${letter} `), marker(`RUBY_${letter}`), new TextRun(` ${prose(20)}`)],
            }),
            line(`RF31${letter} next`),
        ]),
    ),
    ...group("RF31j", [
        new Paragraph({
            children: [new TextRun({ text: "RF31j ", size: 40 }), marker("RUBY_j"), new TextRun({ text: ` ${prose(10)}`, size: 40 })],
        }),
        line("RF31j next"),
    ]),
    ...group("RF31k", [
        new Paragraph({ children: [new TextRun("RF31k "), marker("RUBY_k"), new TextRun(` ${prose(20)}`)] }),
        line("RF31k next"),
    ]),
    ...group("RF31l", [
        new Paragraph({ children: [new TextRun(`RF31l ${prose(16)} `), marker("RUBY_l"), new TextRun(` ${prose(10)}`)] }),
        line("RF31l next"),
    ]),
    newPage(),
    ...group("TA12a", [new Paragraph({ children: [new TextRun(`${proseBetween("TA12a", 7950, 8600)}\tafterwards`)] })]),
    ...(
        [
            ["TA12b", TabStopType.RIGHT],
            ["TA12c", TabStopType.CENTER],
        ] as const
    ).flatMap(([name, type]) =>
        group(name, [
            new Paragraph({
                tabStops: [{ type, position: 8800 }],
                children: [new TextRun(`${proseBetween(name, 8300, 8550)}\tafterwards`)],
            }),
        ]),
    ),
    ...group("TA12d", [
        new Paragraph({
            tabStops: [{ type: TabStopType.LEFT, position: 8800 }],
            children: [new TextRun("TA12d text\t"), picture(20, 20), new TextRun(" after")],
        }),
    ]),
    ...group("TA12e", [
        new Paragraph({
            tabStops: [
                { type: TabStopType.LEFT, position: 8000 },
                { type: TabStopType.LEFT, position: 8600 },
            ],
            children: [new TextRun("TA12e text\t\tafterwards")],
        }),
    ]),
    ...group("TA12f", [
        new Paragraph({
            tabStops: [{ type: TabStopType.LEFT, position: 8800 }],
            children: [new TextRun(`TA12f text\tafter${SOFT}wards and more`)],
        }),
    ]),
    ...group("TA12g", [
        new Paragraph({
            tabStops: [{ type: TabStopType.LEFT, position: 8000 }],
            children: [new TextRun("\t"), picture(100, 20), new TextRun(" TA12g after")],
        }),
    ]),
    ...group("TA12h", [
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun(`TA12h${"m".repeat(110)}`)] }),
    ]),
    ...group("TA12i", [
        new Paragraph({
            indent: { right: 1000 },
            tabStops: [{ type: TabStopType.CENTER, position: 9500 }],
            children: [new TextRun("TA12i text\tcentred")],
        }),
    ]),
    ...group("TA12j", [
        new Paragraph({
            indent: { right: 1000 },
            tabStops: [{ type: TabStopType.RIGHT, position: 9500 }],
            children: [new TextRun("\tTA12j right")],
        }),
    ]),
    ...group("TA12k", [
        new Paragraph({
            indent: { firstLine: 720 },
            tabStops: [{ type: TabStopType.LEFT, position: 9500 }],
            children: [new TextRun("\tTA12k left")],
        }),
    ]),
    ...group("TA12l", [
        new Paragraph({
            alignment: AlignmentType.DISTRIBUTE,
            indent: { right: 1000 },
            tabStops: [{ type: TabStopType.RIGHT, position: 8500 }],
            children: [new TextRun(`TA12l ${prose(8)}\tright ${prose(30)}`)],
        }),
    ]),
    newPage(),
    ...group("SH18a", [shorterPart("SH18a", AlignmentType.JUSTIFIED)]),
    ...group("SH18b", [shorterPart("SH18b", AlignmentType.DISTRIBUTE)]),
    ...group("SH18c", [kernedHyphen("SH18c", ["LAST", "WORD"], "Calibri")]),
    ...group("SH18d", [kernedHyphen("SH18d", ["SURVEY", "TOWN"], "Calibri")]),
    ...group("SH18e", [new Paragraph({ children: [new TextRun("SH18e "), marker("LIGATURES"), new TextRun(` ${prose(10)}`)] })]),
    ...group("JU5a", [enSpaces("JU5a", 0.12)]),
    ...group("JU5b", [enSpaces("JU5b", 0.2)]),
    newPage(),
    ...(
        [
            ["RF24e", 'w:val="double" w:sz="4" w:space="2" w:shadow="1"'],
            ["RF24f", 'w:val="dotted" w:sz="12" w:space="2" w:frame="1"'],
            ["RF24g", 'w:val="single" w:sz="24" w:space="0" w:shadow="1"'],
        ] as const
    ).flatMap(([name]) =>
        group(name, [
            new Paragraph({ children: [new TextRun(`${name} `), marker(`BORDER_${name}`), new TextRun(` ${prose(20)}`)] }),
            line(`${name} next`),
        ]),
    ),
    ...group("RF32c", [
        new Paragraph({
            spacing: { line: 360, lineRule: LineRuleType.AUTO },
            children: [new TextRun("RF32c "), marker("PICTURE_c"), picture(20, 20), new TextRun(` ${prose(20)}`)],
        }),
        line("RF32c next"),
    ]),
    ...group("RF32d", [
        new Paragraph({
            children: [
                new TextRun("RF32d "),
                marker("BEFORE_d"),
                marker("PICTURE_d"),
                picture(20, 20),
                marker("AFTER_d"),
                new TextRun(` ${prose(20)}`),
            ],
        }),
        line("RF32d next"),
    ]),
    ...group("RF29e", [
        new Paragraph({ children: [new TextRun("RF29e "), marker("FIT_e"), new TextRun(` ${prose(10)}`)] }),
        line("RF29e next"),
    ]),
    ...group("RF29f", [
        new Paragraph({ children: [new TextRun("RF29f "), marker("FIT_f"), new TextRun(` ${prose(20)}`)] }),
        line("RF29f next"),
    ]),
];

/** PB7h to PB7j: on a grid of lines of 360 twips, fill, a reference to a footnote, and a line below it, spaced down */
const gridded = [370, 390, 410].flatMap((before, index) => {
    const name = `PB7${"hij"[index]}`;
    return probe(name, [
        ...fill(name, 33),
        new Paragraph({ children: [new TextRun(`${name} reference`), footnote(line(`${name} note`))] }),
        line(`${name} last`, { spacing: { before } }),
    ]);
});

const sections: ISectionOptions[] = [
    { properties: PAGE, children },
    { properties: { ...PAGE, grid: { type: DocumentGridType.LINES, linePitch: 360 } }, children: gridded },
];

const fitted = (width: number, id: number, text: string, more = ""): string =>
    `<w:r><w:rPr>${more}<w:fitText w:val="${width}" w:id="${id}"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;

const injections: Injection[] = [
    replaceMarkerRun("RUBY_e", ruby({ raise: 0 })),
    replaceMarkerRun("RUBY_f", ruby({ raise: 10 })),
    replaceMarkerRun("RUBY_g", ruby({ raise: 30 })),
    replaceMarkerRun("RUBY_h", ruby({ size: 16 })),
    replaceMarkerRun("RUBY_i", ruby({ size: 22 })),
    replaceMarkerRun("RUBY_j", ruby({ baseSize: 40 })),
    replaceMarkerRun("RUBY_k", ruby({ guide: "guide", base: "base", fonts: CALIBRI_FONTS })),
    replaceMarkerRun("RUBY_l", ruby({})),
    // Standard ligatures, which docx doesn't write, across soft hyphens and, to measure them by, without
    replaceMarkerRun(
        "LIGATURES",
        '<w:r><w:rPr><w14:ligatures w14:val="standard"/></w:rPr><w:t xml:space="preserve">of</w:t><w:softHyphen/><w:t xml:space="preserve">fice eff</w:t><w:softHyphen/><w:t xml:space="preserve">icient office efficient</w:t></w:r>',
    ),
    softHyphens(),
    replaceMarkerRun(
        "BORDER_RF24e",
        `<w:r><w:rPr>${border('w:val="double" w:sz="4" w:space="2" w:shadow="1"')}</w:rPr><w:t>shadowed</w:t></w:r>`,
    ),
    replaceMarkerRun(
        "BORDER_RF24f",
        `<w:r><w:rPr>${border('w:val="dotted" w:sz="12" w:space="2" w:frame="1"')}</w:rPr><w:t>framed</w:t></w:r>`,
    ),
    replaceMarkerRun(
        "BORDER_RF24g",
        `<w:r><w:rPr>${border('w:val="single" w:sz="24" w:space="0" w:shadow="1"')}</w:rPr><w:t>shadowed</w:t></w:r>`,
    ),
    borderedPicture("PICTURE_c", SINGLE),
    replaceMarkerRun("AFTER_d", `<w:r><w:rPr>${border(SINGLE)}</w:rPr><w:t>after</w:t></w:r>`),
    replaceMarkerRun("BEFORE_d", `<w:r><w:rPr>${border(SINGLE)}</w:rPr><w:t>before</w:t></w:r>`),
    borderedPicture("PICTURE_d", SINGLE),
    replaceMarkerRun("FIT_e", fitted(12000, 6, "fitted text")),
    replaceMarkerRun("FIT_f", `${fitted(3000, 7, "fitted ")}${fitted(3000, 7, "text", '<w:sz w:val="32"/>')}`),
];

await write({
    name: "word-stops-text3",
    sections,
    injections,
    options: {
        numbering: {
            config: [
                {
                    reference: "numbers",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                        },
                    ],
                },
            ],
        },
    } as object,
});
