/**
 * Probes of how Word measures text and lines where docx/layout reads nothing or guesses, for the watertight inventory.
 * Each probe starts a page, and each line's text names its probe, so the lines can be found in a PDF saved from Word with
 * pdftotext -bbox-layout, which word-watertight.py reads. Calibri 11, single spaced, no space before or after, on A4 with
 * 1440 margins, so the text is 1440 to 15398 twips down the page, 9026 twips wide, and Word's lines are 268.55 twips.
 *
 * A "page" probe is 80 one-line paragraphs, whose pitch is measured over the first page, as word-line-heights.ts does.
 *
 * TX1: superscript and subscript: the pitch of lines with a superscript or subscript digit, and their width and size
 * TX2: text raised and lowered (`w:position`): the pitch of lines with a run raised 6 points, lowered 6, raised 2
 * TX3: italic and bold italic widths in Times New Roman, Calibri, Cambria and Arial, against upright
 * TX4: small capitals: their width and size against capitals
 * TX5: paragraph borders (`w:pBdr`): the pitch of every other paragraph with a bottom border, top and bottom borders,
 *      thematicBreak, and 3-point borders, of paragraphs whose borders Word joins into one box, with and without between
 *      borders, and whether left and right borders narrow the text
 * TX6: automatic spacing (`beforeAutospacing`, `afterAutospacing`): between paragraphs, in a table cell, at a page's top
 * TX7: lengths in characters and lines: `firstLineChars` at 11 and 20 points, `leftChars` and `hangingChars`, and
 *      `beforeLines` and `afterLines`
 * TX8: pictures in the line: the pitch of lines with a 30-point picture, alone, with text, at 1.15, exactly 12 and at
 *      least 12 points, a 6-point picture, and a picture beside Times New Roman
 * TX9: two fonts on a line: Calibri with Courier New, with Times New Roman, and with Arial
 * TX10: soft hyphens (`w:softHyphen` and U+00AD in the text): where lines break, and their width inside a line
 * TX11: a hidden paragraph mark, and `specVanish`
 * TX12: tabs: a decimal tab, a tab with no stop left before the margin, and stops past the margin
 * TX14: ligatures (`w14:ligatures`), which Word's Normal template turns on
 * TX15: emphasis marks (`w:em`): the pitch of lines with them
 * TX16: a border around a run (`w:bdr`): whether it takes room
 * TX17: letters the width tables don't have: Latin Extended-A, Greek, Cyrillic, Vietnamese, symbols, a no-break hyphen,
 *       and symbol characters (`w:sym`)
 * TX18: fonts that aren't installed, and fonts docx/layout measures as another: which font Word draws, and how wide
 * TX19: spaces other than U+0020: en, em, thin, ideographic and no-break spaces, and whether lines break after en spaces
 * TX20: justified and distributed paragraphs against left-aligned ones: whether their lines break in the same places
 * TX21: list numbers aligned right, centred and left (`w:lvlJc`): where the text after them starts
 *
 * docx can't write some of these, so it writes a marker that this script replaces in the XML: see `INJECTIONS`.
 */
// cspell:ignore bbox Donau dampf schiff fahrts gesell schaft ordi narily Zażółć gęślą jaźń
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

import JSZip from "jszip";

import {
    AlignmentType,
    BorderStyle,
    Document,
    EmphasisMarkType,
    type ISectionOptions,
    ImageRun,
    LevelFormat,
    LineRuleType,
    NoBreakHyphen,
    Packer,
    Paragraph,
    SoftHyphen,
    SymbolRun,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TabStopType,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Run = ConstructorParameters<typeof TextRun>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });

// More lines than fit on a page of the smallest of them
const FILL = 80;
/** A page probe: lines made by `make`, each starting with the probe's name and its number */
const page = (probe: string, make: (label: string, index: number) => Paragraph): ISectionOptions => ({
    children: Array.from({ length: FILL }, (_, i) => make(`${probe} ${i + 1}`, i)),
});
/** A probe of a few lines on a page of its own */
const lines = (...children: Paragraph[]): ISectionOptions => ({ children });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

// A soft hyphen, as U+00AD in the text
const SOFT_HYPHEN = String.fromCodePoint(0xad);
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789".repeat(4);

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
const PIXEL = pixel();
/** A picture in the line, this many points tall and 20 wide */
const picture = (points: number): ImageRun =>
    new ImageRun({ type: "png", data: PIXEL, transformation: { width: (20 * 96) / 72, height: (points * 96) / 72 } });

const border = (size: number, space: number) => ({ style: BorderStyle.SINGLE, size, space, color: "auto" });

/**
 * The XML docx can't write, which replaces a marker it can: a run property or a length no probe uses otherwise. Each is
 * [what docx writes, what replaces it], in document.xml.
 */
const INJECTIONS: readonly (readonly [RegExp, string | ((match: string, ...groups: string[]) => string)])[] = [
    // TX2: positions in half-points, as Word writes them, rather than the universal measure docx writes, such as "6pt"
    [/<w:position w:val="(-?\d+)pt"\/>/g, (_, points: string) => `<w:position w:val="${Number(points) * 2}"/>`],
    // TX7c: an indent in characters on the left, with a hanging indent in characters
    [/w:firstLineChars="777"/g, 'w:leftChars="400" w:hangingChars="200"'],
    // TX7d: the space before and after in lines
    [/w:before="7771"/g, 'w:beforeLines="100"'],
    [/w:after="7772"/g, 'w:afterLines="100"'],
    // TX11a: a hidden paragraph mark, written as the mark's double strikethrough
    [/<w:pPr>((?:(?!<\/w:pPr>).)*?)<w:rPr><w:dstrike\/><\/w:rPr>/g, "<w:pPr>$1<w:rPr><w:vanish/></w:rPr>"],
    // TX14a and TX14c: ligatures, written as noProof and imprint, at the end of the run's properties as their schema has it
    [/<w:noProof\/>((?:(?!<\/w:rPr>).)*)<\/w:rPr>/g, '$1<w14:ligatures w14:val="standardContextual"/></w:rPr>'],
    [/<w:imprint\/>((?:(?!<\/w:rPr>).)*)<\/w:rPr>/g, '$1<w14:ligatures w14:val="all"/></w:rPr>'],
];

const sections: ISectionOptions[] = [
    // TX1a, TX1b: a superscript and a subscript digit of the same size at the end of each line
    page("TX1a", (label) => new Paragraph({ children: [new TextRun(`${label} x`), new TextRun({ text: "2", superScript: true })] })),
    page("TX1b", (label) => new Paragraph({ children: [new TextRun(`${label} x`), new TextRun({ text: "2", subScript: true })] })),
    // TX1c: 40 digits in superscript, subscript and neither, each a word of its own, for their width and size
    lines(
        new Paragraph({ children: [new TextRun("TX1c sup "), new TextRun({ text: DIGITS, superScript: true }), new TextRun(" end")] }),
        new Paragraph({ children: [new TextRun("TX1c sub "), new TextRun({ text: DIGITS, subScript: true }), new TextRun(" end")] }),
        new Paragraph({ children: [new TextRun(`TX1c plain ${DIGITS} end`)] }),
        new Paragraph({
            children: [new TextRun({ text: "TX1c big sup ", size: 40 }), new TextRun({ text: DIGITS, superScript: true, size: 40 })],
        }),
    ),

    // TX2: a run raised 6 points, lowered 6 points, and raised 2 points, in each line
    page("TX2a", (label) => new Paragraph({ children: [new TextRun(`${label} x `), new TextRun({ text: "raised", position: "6pt" })] })),
    page("TX2b", (label) => new Paragraph({ children: [new TextRun(`${label} x `), new TextRun({ text: "lowered", position: "-6pt" })] })),
    page("TX2c", (label) => new Paragraph({ children: [new TextRun(`${label} x `), new TextRun({ text: "raised", position: "2pt" })] })),

    // TX3: the alphabet twice as one word, in each font upright, italic, bold and bold italic
    lines(
        ...(
            [
                ["Times New Roman", 20],
                ["Calibri", 22],
                ["Cambria", 22],
                ["Arial", 22],
            ] as const
        ).flatMap(([font, size], f) =>
            (
                [
                    ["upright", {}],
                    ["italic", { italics: true }],
                    ["bold", { bold: true }],
                    ["bolditalic", { bold: true, italics: true }],
                ] as const
            ).map(
                ([name, style]) =>
                    new Paragraph({
                        children: [
                            new TextRun(`TX3${"abcd"[f]} ${name} `),
                            new TextRun({ text: ALPHABET + ALPHABET, font, size, ...(style as Run) }),
                        ],
                    }),
            ),
        ),
    ),

    // TX4: the alphabet in small capitals, all capitals, and typed in capitals, at 11 and 20 points
    lines(
        ...([22, 40] as const).flatMap((size) => [
            new Paragraph({ children: [new TextRun(`TX4 ${size} small `), new TextRun({ text: ALPHABET, smallCaps: true, size })] }),
            new Paragraph({ children: [new TextRun(`TX4 ${size} caps `), new TextRun({ text: ALPHABET, allCaps: true, size })] }),
            new Paragraph({ children: [new TextRun(`TX4 ${size} typed `), new TextRun({ text: ALPHABET.toUpperCase(), size })] }),
        ]),
    ),

    // TX5a: a half-point (sz 6) bottom border 1 point from the text on every other paragraph, so each is a box of its own
    page(
        "TX5a",
        (label, i) => new Paragraph({ ...(i % 2 === 0 ? { border: { bottom: border(6, 1) } } : {}), children: [new TextRun(label)] }),
    ),
    // TX5b: the same top and bottom borders on every paragraph, which Word joins into one box
    page("TX5b", (label) => new Paragraph({ border: { top: border(6, 1), bottom: border(6, 1) }, children: [new TextRun(label)] })),
    // TX5c: top and bottom borders on every other paragraph, so each is a box of its own
    page(
        "TX5c",
        (label, i) =>
            new Paragraph({
                ...(i % 2 === 0 ? { border: { top: border(6, 1), bottom: border(6, 1) } } : {}),
                children: [new TextRun(label)],
            }),
    ),
    // TX5d: thematicBreak, as docx writes it, on every other paragraph
    page("TX5d", (label, i) => new Paragraph({ thematicBreak: i % 2 === 0, children: [new TextRun(label)] })),
    // TX5e: 3-point (sz 24) top and bottom borders 4 points from the text on every other paragraph
    page(
        "TX5e",
        (label, i) =>
            new Paragraph({
                ...(i % 2 === 0 ? { border: { top: border(24, 4), bottom: border(24, 4) } } : {}),
                children: [new TextRun(label)],
            }),
    ),
    // TX5f, TX5g: left and right borders 20 points from the text, against none, on the same text
    lines(
        new Paragraph({ border: { left: border(6, 20), right: border(6, 20) }, children: [new TextRun(`TX5f ${prose(120)}`)] }),
        new Paragraph({ children: [new TextRun(`TX5g ${prose(120)}`)] }),
    ),
    // TX5h: the same top, bottom and between borders on every paragraph
    page(
        "TX5h",
        (label) =>
            new Paragraph({ border: { top: border(6, 1), bottom: border(6, 1), between: border(6, 1) }, children: [new TextRun(label)] }),
    ),

    // TX6a: automatic space before and after on every paragraph
    page(
        "TX6a",
        (label) => new Paragraph({ spacing: { beforeAutoSpacing: true, afterAutoSpacing: true }, children: [new TextRun(label)] }),
    ),
    // TX6b: automatic space after, with 0 after given too
    page("TX6b", (label) => new Paragraph({ spacing: { after: 0, afterAutoSpacing: true }, children: [new TextRun(label)] })),
    // TX6c: three paragraphs with automatic space in a table cell without margins, between lines above and below
    lines(
        line("TX6c above"),
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            borders: TableBorders.NONE,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 9026, type: WidthType.DXA },
                            children: [1, 2, 3].map(
                                (n) =>
                                    new Paragraph({
                                        spacing: { beforeAutoSpacing: true, afterAutoSpacing: true },
                                        children: [new TextRun(`TX6c cell ${n}`)],
                                    }),
                            ),
                        }),
                    ],
                }),
            ],
        }),
        line("TX6c below"),
    ),
    // TX6d: automatic space before the first paragraph of a section on a new page
    lines(new Paragraph({ spacing: { beforeAutoSpacing: true }, children: [new TextRun("TX6d first")] }), line("TX6d second")),

    // TX7a, TX7b: a first line indent of 2 characters, at 11 and 20 points
    lines(
        new Paragraph({ indent: { firstLineChars: 200 }, children: [new TextRun(`TX7a ${prose(60)}`)] }),
        new Paragraph({ indent: { firstLineChars: 200 }, children: [new TextRun({ text: `TX7b ${prose(40)}`, size: 40 })] }),
        // TX7c: a left indent of 4 characters and a hanging indent of 2
        new Paragraph({ indent: { firstLineChars: 777 }, children: [new TextRun(`TX7c ${prose(60)}`)] }),
        line(`TX7e ${prose(60)}`),
    ),
    // TX7d: a line before and after every paragraph
    page("TX7d", (label) => new Paragraph({ spacing: { before: 7771, after: 7772 }, children: [new TextRun(label)] })),

    // TX8a: a 30-point picture alone in each paragraph, counted on the first page
    page("TX8a", () => new Paragraph({ children: [picture(30)] })),
    // TX8b: a 30-point picture after the text
    page("TX8b", (label) => new Paragraph({ children: [new TextRun(`${label} `), picture(30)] })),
    // TX8c, TX8d, TX8e: the same at 1.15 lines, exactly 12 points, and at least 12 points
    page(
        "TX8c",
        (label) =>
            new Paragraph({ spacing: { line: 276, lineRule: LineRuleType.AUTO }, children: [new TextRun(`${label} `), picture(30)] }),
    ),
    page(
        "TX8d",
        (label) =>
            new Paragraph({ spacing: { line: 240, lineRule: LineRuleType.EXACT }, children: [new TextRun(`${label} `), picture(30)] }),
    ),
    page(
        "TX8e",
        (label) =>
            new Paragraph({ spacing: { line: 240, lineRule: LineRuleType.AT_LEAST }, children: [new TextRun(`${label} `), picture(30)] }),
    ),
    // TX8f: a 6-point picture, shorter than the text
    page("TX8f", (label) => new Paragraph({ children: [new TextRun(`${label} `), picture(6)] })),
    // TX8g: a 30-point picture after Times New Roman 10, with its mark in Times New Roman 10
    page(
        "TX8g",
        (label) =>
            new Paragraph({
                run: { font: "Times New Roman", size: 20 },
                children: [new TextRun({ text: `${label} `, font: "Times New Roman", size: 20 }), picture(30)],
            }),
    ),

    // TX9: Calibri 11 with a word in another font at 11 points, on every line
    page("TX9a", (label) => new Paragraph({ children: [new TextRun(`${label} `), new TextRun({ text: "mono", font: "Courier New" })] })),
    page(
        "TX9b",
        (label) => new Paragraph({ children: [new TextRun(`${label} `), new TextRun({ text: "serif", font: "Times New Roman" })] }),
    ),
    page("TX9c", (label) => new Paragraph({ children: [new TextRun(`${label} `), new TextRun({ text: "arial", font: "Arial" })] })),

    // TX10a, TX10b, TX10c: a long word repeated, with soft hyphens as elements, as U+00AD in the text, and with none
    lines(
        new Paragraph({
            children: [
                new TextRun("TX10a"),
                ...Array.from(
                    { length: 30 },
                    () =>
                        new TextRun({
                            children: [
                                " Donau",
                                new SoftHyphen(),
                                "dampf",
                                new SoftHyphen(),
                                "schiff",
                                new SoftHyphen(),
                                "fahrts",
                                new SoftHyphen(),
                                "gesellschaft",
                            ],
                        }),
                ),
            ],
        }),
        line(`TX10b${` Donau${SOFT_HYPHEN}dampf${SOFT_HYPHEN}schiff${SOFT_HYPHEN}fahrts${SOFT_HYPHEN}gesellschaft`.repeat(30)}`),
        line(`TX10c${" Donaudampfschifffahrtsgesellschaft".repeat(30)}`),
        // TX10d, TX10e: a word with soft hyphens inside a line, and without
        new Paragraph({ children: [new TextRun({ children: ["TX10d extra", new SoftHyphen(), "ordi", new SoftHyphen(), "narily end"] })] }),
        line("TX10e extraordinarily end"),
    ),

    // TX11a: a paragraph whose mark is hidden, before another; TX11b: a run with specVanish; TX11c: a run with vanish
    lines(
        new Paragraph({ run: { doubleStrike: true }, children: [new TextRun("TX11a first")] }),
        line("TX11a second"),
        new Paragraph({
            children: [new TextRun("TX11b before "), new TextRun({ text: "SPECVANISH", specVanish: true }), new TextRun(" after")],
        }),
        new Paragraph({ children: [new TextRun("TX11c before "), new TextRun({ text: "VANISH", vanish: true }), new TextRun(" after")] }),
    ),

    // TX12a: numbers at a decimal tab at 4000 twips
    lines(
        ...["12.5", "1234.56", "7", "-0.25"].map(
            (number) =>
                new Paragraph({ tabStops: [{ type: TabStopType.DECIMAL, position: 4000 }], children: [new TextRun(`TX12a\t${number}`)] }),
        ),
        // TX12b: a tab after text that ends at 422, 431, 440 and 448 points, before and past the last default stop before
        // the margin at 451, which is at 432 points
        ...[43, 44, 45, 46].map((count) => line(`TX12b ${count} ${"m".repeat(count)}\tx`)),
        // TX12c, TX12d: a right tab at 10000 twips and a left tab at 9500, past the margin at 9026; TX12e: right at 9026
        new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 10000 }], children: [new TextRun("TX12c\tright")] }),
        new Paragraph({ tabStops: [{ type: TabStopType.LEFT, position: 9500 }], children: [new TextRun("TX12d\tleft")] }),
        new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9026 }], children: [new TextRun("TX12e\tright")] }),
    ),

    // TX14: words with Calibri's ligatures, with standard ligatures, all ligatures, and none
    lines(
        ...(
            [
                ["TX14a standard", { noProof: true }],
                ["TX14b none", {}],
                ["TX14c all", { imprint: true }],
            ] as const
        ).flatMap(([label, marker]) =>
            ["official", "affluent", "fifty", "attitude", "fjord"].map(
                (word) =>
                    new Paragraph({ children: [new TextRun(`${label} `), new TextRun({ text: word.repeat(6), ...(marker as Run) })] }),
            ),
        ),
    ),

    // TX15: a word with dots over it on every line
    page(
        "TX15",
        (label) =>
            new Paragraph({
                children: [new TextRun(`${label} `), new TextRun({ text: "dotted", emphasisMark: { type: EmphasisMarkType.DOT } })],
            }),
    ),

    // TX16: a word with a border around it, and without
    lines(
        new Paragraph({
            children: [new TextRun("TX16a before "), new TextRun({ text: "boxed", border: border(6, 4) }), new TextRun(" after")],
        }),
        line("TX16b before boxed after"),
    ),

    // TX17: words of letters the width tables don't have, in Calibri 11, each with the same in Times New Roman 10
    lines(
        ...(
            [
                ["latin", "ŁĄĆĘŃÓŚŹŻłąćęńóśźżČŠŽčšžŐŰőűĞŞİğşı"],
                ["greek", "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω"],
                ["cyrillic", "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯабвгдежзийклмнопрстуфхцчшщэюя"],
                ["vietnamese", "ẠẢẤẦẨẪẬẮẰẲẴẶạảấầẩẫậắằẳẵặ"],
                ["symbols", "≤≥≠±−∞√∑∏∫≈‰†‡‚„‹›→←↑↓"],
            ] as const
        ).flatMap(([name, text]) => [
            new Paragraph({ children: [new TextRun(`TX17 ${name} `), new TextRun(text)] }),
            new Paragraph({ children: [new TextRun(`TX17 ${name}tnr `), new TextRun({ text, font: "Times New Roman", size: 20 })] }),
        ]),
        // A no-break hyphen between words, which docx writes as w:noBreakHyphen
        new Paragraph({
            children: [
                new TextRun({
                    children: ["TX17 nbh state", new NoBreakHyphen(), "of", new NoBreakHyphen(), "the", new NoBreakHyphen(), "art end"],
                }),
            ],
        }),
        line("TX17 hyphen state-of-the-art end"),
        // Symbol characters: Wingdings' tick and Symbol's bullet, ten of each
        new Paragraph({
            children: [
                new TextRun("TX17 wingdings "),
                ...Array.from({ length: 10 }, () => new SymbolRun({ char: "F0FC", symbolfont: "Wingdings" })),
                new TextRun(" end"),
            ],
        }),
        new Paragraph({
            children: [
                new TextRun("TX17 symbol "),
                ...Array.from({ length: 10 }, () => new SymbolRun({ char: "F0B7", symbolfont: "Symbol" })),
                new TextRun(" end"),
            ],
        }),
    ),

    // TX18: the same pangram in fonts docx/layout doesn't have, which it measures as another
    lines(
        ...[
            "Watertight Missing Sans",
            "Watertight Missing Serif",
            "Helvetica",
            "Aptos",
            "Segoe UI",
            "Garamond",
            "Georgia",
            "Verdana",
            "Tahoma",
            "Calibri Light",
        ].map(
            (font) =>
                new Paragraph({
                    children: [
                        new TextRun(`TX18 ${font.replace(/ /g, "_")} `),
                        new TextRun({ text: "Thequickbrownfoxjumpsoverthelazydog", font }),
                    ],
                }),
        ),
    ),

    // TX19a to TX19e: words between en spaces, em spaces, thin spaces, ideographic spaces and no-break spaces
    lines(
        ...(
            [
                ["TX19a", String.fromCodePoint(0x2002)],
                ["TX19b", String.fromCodePoint(0x2003)],
                ["TX19c", String.fromCodePoint(0x2009)],
                ["TX19d", String.fromCodePoint(0x3000)],
                ["TX19e", String.fromCodePoint(0xa0)],
                ["TX19f", " "],
            ] as const
        ).map(([label, space]) => line(`${label} ${["one", "two", "three", "four", "five"].join(space)}`)),
        // TX19g: 60 words joined by en spaces, longer than a line
        line(`TX19g ${prose(60).split(" ").join(String.fromCodePoint(0x2002))}`),
    ),

    // TX21: lists numbered 1 to 12, whose numbers are right-aligned, centred and left-aligned at the indent
    lines(
        ...(["end", "center", "start"] as const).flatMap((alignment) =>
            Array.from(
                { length: 12 },
                (_, i) =>
                    new Paragraph({
                        numbering: { reference: `tx21-${alignment}`, level: 0 },
                        children: [new TextRun(`TX21 ${alignment} ${i + 1}`)],
                    }),
            ),
        ),
    ),

    // TX20: the same prose justified, distributed and left-aligned
    lines(
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun(`TX20a ${prose(160)}`)] }),
        new Paragraph({ alignment: AlignmentType.DISTRIBUTE, children: [new TextRun(`TX20b ${prose(160)}`)] }),
        new Paragraph({ children: [new TextRun(`TX20c ${prose(160)}`)] }),
    ),
];

const doc = new Document({
    numbering: {
        config: (["end", "center", "start"] as const).map((alignment) => ({
            reference: `tx21-${alignment}`,
            levels: [
                {
                    level: 0,
                    format: LevelFormat.DECIMAL,
                    text: "%1.",
                    alignment:
                        alignment === "end" ? AlignmentType.END : alignment === "center" ? AlignmentType.CENTER : AlignmentType.START,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                },
            ],
        })),
    },
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const xml = INJECTIONS.reduce(
        (text, [marker, replacement]) =>
            typeof replacement === "string" ? text.replace(marker, replacement) : text.replace(marker, replacement),
        await zip.file("word/document.xml")!.async("string"),
    );
    zip.file("word/document.xml", xml);
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-watertight-text.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
