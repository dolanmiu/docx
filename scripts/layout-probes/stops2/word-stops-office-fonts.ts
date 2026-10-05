/**
 * Probes of what lay2-fonts left stopping in Office's fonts that Word installs, after Word's PDFs of
 * word-stops-font-widths, word-stops-font-italic-widths, word-stops-font-heights and word-stops-font-kerning: each line
 * is "<probe> ..." between a line above and below it, so pdftotext finds it, and each measured word is one word.
 *
 * MB1a to MB1l: the bold Word makes itself for a font without a bold face ("a font not in the width tables"): Word's PDF of
 *   word-stops-font-widths showed each character of Calibri Light, Franklin Gothic Book and Impact 18 thousandths of an em
 *   wider in bold, at 10 points, and the spaces as wide. Here at 8, 9, 11, 12, 14, 16, 20, 28, 36, 48, 72 and 10 points
 *   (a to l), in Calibri Light, Franklin Gothic Book and Impact: a word of ten H's, of ten i's, and "H H H H H H H H H H",
 *   each on a line of its own that names the font, with four of each from 28 points and three from 48, bold and not, so
 *   whether the 18 is of an em or of a point shows
 * MB2a to MB2c: the same text kerned from 1 point with standard and contextual ligatures, as Word's Normal template has
 *   it, in each font's made bold at 11 points: "To Wyatt AVATAR office", for whether Word kerns it and joins its letters
 *   as the regular face
 * MB3a to MB3c: 20 lines of each font's made bold at 11 points, and 20 at 20 points, for the height of its lines
 * MB4a, MB4b: Pacifico, which the document embeds, regular only, as demo/text/custom-fonts does: a word of ten H's in
 *   bold and not, at 10 and 20 points, for the bold Word makes of an embedded font
 * FB1a to FB1h: characters Office's fonts don't have, which Word drew in other fonts in word-stops-font-widths: each a
 *   word of ten, in runs with no language, and in English, Russian, Greek, Vietnamese and Japanese (w:lang), and with an
 *   East Asian font of their own (w:eastAsia MS Mincho): whether the font Word draws them in depends on the run's
 *   language or East Asian font ("a character whose width in its font isn't known")
 * FB2a to FB2f: 10 lines of 11 points each with one such character in it, and 10 without, for whether the font Word draws
 *   it in makes the line taller
 * KL1a to KL1x: "ToToToToTo AVAVAVAVAV WaWaWaWaWa" kerned from 1 point in Trebuchet MS, Verdana, Tahoma, Impact, Gill Sans
 *   MT and Franklin Gothic Book, whose kerning is in their kern tables alone, with standard ligatures, historical and
 *   discretional, all, and none written as w14:ligatures (a to d for each font): Word's PDF of word-stops-font-kerning
 *   showed them not kerned with standard and contextual ligatures, and kerned without ligatures ("ligatures of a setting
 *   not yet followed")
 * KL2: a line of prose in Verdana 10, kerned with standard and contextual ligatures, as word-stops-font-kerning's P has it,
 *   whose lines broke there, as Verdana is wider than the probe made room for
 * DS1a, DS1b: a picture 30 points tall beside Corbel 11 and beside Consolas 11, whose descents in their hhea tables, 525
 *   and 527 of 2048, aren't their descents for Windows, 550 and 514: the line is as tall as the picture and the descent
 * DS2a, DS2b: Courier New 11 beside Corbel 11, and beside Consolas 11: the line is the taller ascent and the deeper descent
 *
 * Word's PDF, saved from Word 16 for Mac on 2026-10-05 (round 25), showed:
 * MB1: the bold Word makes itself draws each glyph 20 thousandths of an em further on than the face it makes it from, at
 *   every size from 8 to 72 points, in Calibri Light, Franklin Gothic Book and Impact, and the space as wide. The 18 of
 *   word-stops-font-widths was its reader's: a word of ten is nine glyphs further on and a last one as wide
 * MB2: Calibri Light's made bold kerned and joined with Normal's ligatures as its regular, tt and ffi joined, each glyph
 *   20 further on; Franklin Gothic Book's and Impact's not kerned, as their regulars aren't with ligatures
 * MB3: the made bold's lines as tall as the regular's: 13.43, 12.47 and 13.41 points at 11 points
 * MB4: Pacifico 20 further on too, but drawn in the copy of Pacifico Office downloads, whose H is 873 thousandths of an
 *   em, not in the file the document embeds, whose H is 1052
 * FB1: Д, ƀ, ∀, Ⅳ and ‥ drawn in Calibri, Calibri, Cambria Math, MS Gothic and MS Mincho whatever the run's language or
 *   East Asian font; Century Gothic's Ω, Book Antiqua's Ж and Georgia's ≤ are the fonts' own
 * FB2: a line with a character Word draws in Calibri as tall as Calibri's, 13.41 points at 11 where Gill Sans MT's and
 *   Trebuchet MS's are 12.77, and with one in Cambria Math 12.88: the tallest ascent and deepest descent of the two
 * KL1: none of the six fonts kerned with standard ligatures, historical and discretional, or all, and each kerned with
 *   none, as without ligatures. KL2: Verdana's line within 0.11 points of the layout's, not kerned
 * DS1, DS2: Corbel's and Consolas's lines go their hhea tables' descents below the baseline, beside a picture and beside
 *   Courier New, to within the 0.24 points Word puts baselines to
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-office-fonts.ts [folder], which writes
 * word-stops-office-fonts.docx and word-stops-office-fonts.json, the text of each line of MB, FB and KL for the reader,
 * word-stops-office-fonts.py
 */
// cspell:ignore Wyatt AVATAR Pacifico AVAVAVAVAV hhea Consolas's
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Paragraph, TextRun } from "docx";

import { type Child, PAGE, group, line, marker, newPage, picture, prose, replaceMarkerRun, write } from "./kit";

const letters = "abcdefghijklmnopqrstuvwxyz";
const MADE_BOLD = ["Calibri Light", "Franklin Gothic Book", "Impact"] as const;
const SIZES = [8, 9, 11, 12, 14, 16, 20, 28, 36, 48, 72, 10] as const;
// What is measured, each on a line of its own: a word of H's, one of i's, and H's apart, fewer of them at larger sizes, so
// each fits on its line beside its label
const copiesAt = (size: number): number => (size >= 48 ? 3 : size >= 28 ? 4 : 10);
const MEASURES = {
    H: (copies: number): string => "H".repeat(copies),
    i: (copies: number): string => "i".repeat(copies),
    space: (copies: number): string => Array.from({ length: copies }, () => "H").join(" "),
} as const;

// The measured lines of MB1, MB4 and KL, as the reader reads them: the probe, the font, its size, and how it is written.
// Each line of MB1 and MB4 names its font, with underscores for its spaces, as each font's MB1 has the same names
const measured: (readonly [probe: string, font: string, size: number, how: string])[] = [];
const measuredLines = (probe: string, font: string, size: number, how: string, run: object = {}): Paragraph[] => {
    measured.push([probe, font, size, how]);
    return Object.entries(MEASURES).map(
        ([kind, text]) =>
            new Paragraph({
                children: [
                    new TextRun(`${probe} ${font.replace(/ /g, "_")} ${how} ${kind} `),
                    new TextRun({ text: text(copiesAt(size)), font, size: size * 2, ...run }),
                    new TextRun(" end"),
                ],
            }),
    );
};

const madeBold: Child[] = MADE_BOLD.flatMap((font) =>
    SIZES.flatMap((size, index) => {
        const name = `MB1${letters[index]}`;
        return group(`${name} ${font.replace(/ /g, "_")}`, [
            ...measuredLines(name, font, size, "bold", { bold: true }),
            ...measuredLines(name, font, size, "regular"),
        ]);
    }),
);

// The kerned text, with Normal's settings, injected, as docx writes no w14:ligatures
const KERNED = "To Wyatt AVATAR office";
const ligatureRun = (setting: string, text: string, font: string, size: number, bold = false): string =>
    `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>${bold ? "<w:b/>" : ""}<w:kern w:val="2"/><w:sz w:val="${size * 2}"/><w14:ligatures w14:val="${setting}"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
const injected = new Map<string, string>();
const runOf = (name: string, xml: string): TextRun => {
    injected.set(name, xml);
    return marker(name);
};

const madeBoldKerned: Child[] = MADE_BOLD.flatMap((font, index) => {
    const name = `MB2${letters[index]}`;
    return group(name, [
        new Paragraph({
            children: [
                new TextRun(`${name} bold `),
                runOf(`${name}_bold`, ligatureRun("standardContextual", KERNED, font, 11, true)),
                new TextRun(" end"),
            ],
        }),
        new Paragraph({
            children: [
                new TextRun(`${name} regular `),
                runOf(`${name}_regular`, ligatureRun("standardContextual", KERNED, font, 11)),
                new TextRun(" end"),
            ],
        }),
    ]);
});

const madeBoldHeights: Child[] = MADE_BOLD.flatMap((font, index) => {
    const name = `MB3${letters[index]}`;
    return [
        line(`${name} above`, { pageBreakBefore: true }),
        ...Array.from({ length: 20 }, (_, row) => line(`${name} ${font} bold 11 line ${row + 1}`, {}, { font, size: 22, bold: true })),
        ...Array.from({ length: 20 }, (_, row) => line(`${name} ${font} bold 20 line ${row + 1}`, {}, { font, size: 40, bold: true })),
        line(`${name} below`),
    ];
});

const embedded: Child[] = [10, 20].flatMap((size, index) => {
    const name = `MB4${letters[index]}`;
    return group(name, [
        ...measuredLines(name, "Pacifico", size, "bold", { bold: true }),
        ...measuredLines(name, "Pacifico", size, "regular"),
    ]);
});

// FB: a character Word drew in another font, the font it is in, and the font Word drew it in for word-stops-font-widths
const FALLBACKS = [
    ["Д", "Gill Sans MT", "Calibri"],
    ["Ω", "Century Gothic", "Calibri"],
    ["ƀ", "Trebuchet MS", "Calibri"],
    ["Ж", "Book Antiqua", "Cambria"],
    ["∀", "Trebuchet MS", "Cambria Math"],
    ["≤", "Georgia", "Cambria Math"],
    ["Ⅳ", "Calibri Light", "MS Gothic"],
    ["‥", "Consolas", "MS Mincho"],
] as const;
const LANGUAGES = [
    ["none", ""],
    ["English", '<w:lang w:val="en-US"/>'],
    ["Russian", '<w:lang w:val="ru-RU"/>'],
    ["Greek", '<w:lang w:val="el-GR"/>'],
    ["Vietnamese", '<w:lang w:val="vi-VN"/>'],
    ["Japanese", '<w:lang w:eastAsia="ja-JP"/>'],
    ["MS_Mincho", ""],
] as const;
const fallbackRun = (character: string, font: string, language: string, eastAsia: boolean): string =>
    `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}" w:eastAsia="${eastAsia ? "MS Mincho" : font}"/><w:sz w:val="20"/>${language}</w:rPr><w:t xml:space="preserve">${character.repeat(10)}</w:t></w:r>`;
const fallbacks: Child[] = FALLBACKS.flatMap(([character, font], index) => {
    const name = `FB1${letters[index]}`;
    return group(
        name,
        LANGUAGES.map(
            ([language, xml]) =>
                new Paragraph({
                    children: [
                        new TextRun(`${name} ${language} `),
                        runOf(`${name}_${language}`, fallbackRun(character, font, xml, language === "MS_Mincho")),
                        new TextRun(" end"),
                    ],
                }),
        ),
    );
});

const fallbackHeights: Child[] = FALLBACKS.slice(0, 6).flatMap(([character, font], index) => {
    const name = `FB2${letters[index]}`;
    return [
        line(`${name} above`, { pageBreakBefore: true }),
        ...Array.from({ length: 10 }, (_, row) => line(`${name} ${font} line ${row + 1} with ${character}`, {}, { font, size: 22 })),
        ...Array.from({ length: 10 }, (_, row) => line(`${name} ${font} line ${row + 1} without`, {}, { font, size: 22 })),
        line(`${name} below`),
    ];
});

const KERN_TABLE_FONTS = ["Trebuchet MS", "Verdana", "Tahoma", "Impact", "Gill Sans MT", "Franklin Gothic Book"] as const;
const SETTINGS = ["standard", "historicalDiscretional", "all", "none"] as const;
const PAIRS = "ToToToToTo AVAVAVAVAV WaWaWaWaWa";
const kernTable: Child[] = KERN_TABLE_FONTS.flatMap((font, fontIndex) =>
    SETTINGS.flatMap((setting, index) => {
        const name = `KL1${letters[fontIndex * 4 + index]}`;
        measured.push([name, font, 10, setting]);
        return group(name, [
            new Paragraph({
                children: [new TextRun(`${name} ${setting} `), runOf(name, ligatureRun(setting, PAIRS, font, 10)), new TextRun(" end")],
            }),
        ]);
    }),
);
const PROSE = "“To Wyatt’s office,” Avery wrote — fifty-five affluent officials";
const verdana: Child[] = group("KL2", [
    new Paragraph({
        children: [new TextRun("KL2 "), runOf("KL2", ligatureRun("standardContextual", PROSE, "Verdana", 10)), new TextRun(" end")],
    }),
]);

const descents: Child[] = (["Corbel", "Consolas"] as const).flatMap((font, index) => [
    ...group(`DS1${letters[index]}`, [
        new Paragraph({ children: [new TextRun({ text: `DS1${letters[index]} ${font} `, font, size: 22 }), picture(30)] }),
        new Paragraph({ children: [new TextRun({ text: `DS1${letters[index]} ${font} `, font, size: 22 }), picture(30)] }),
    ]),
    ...group(`DS2${letters[index]}`, [
        new Paragraph({
            children: [
                new TextRun({ text: `DS2${letters[index]} ${font} `, font, size: 22 }),
                new TextRun({ text: "Courier New", font: "Courier New", size: 22 }),
            ],
        }),
        new Paragraph({
            children: [
                new TextRun({ text: `DS2${letters[index]} ${font} `, font, size: 22 }),
                new TextRun({ text: "Courier New", font: "Courier New", size: 22 }),
            ],
        }),
        line(`DS2${letters[index]} ${prose(3)}`),
    ]),
]);

const PACIFICO = readFileSync("demo/assets/Pacifico.ttf");
// The kit writes into the folder given, or build/word-stops
const folder = process.argv[2] ?? "build/word-stops";
await write({
    name: "word-stops-office-fonts",
    sections: [
        {
            properties: PAGE,
            children: [
                ...madeBold,
                newPage(),
                ...madeBoldKerned,
                ...embedded,
                ...madeBoldHeights,
                newPage(),
                ...fallbacks,
                ...fallbackHeights,
                newPage(),
                ...kernTable,
                ...verdana,
                newPage(),
                ...descents,
            ],
        },
    ],
    options: { fonts: [{ name: "Pacifico", data: PACIFICO }] },
    injections: [...injected].map(([name, xml]) => replaceMarkerRun(name, xml)),
});
writeFileSync(
    join(folder, "word-stops-office-fonts.json"),
    `${JSON.stringify({ measured, copies: Object.fromEntries(SIZES.map((size) => [size, copiesAt(size)])), kerned: KERNED, pairs: PAIRS, prose: PROSE })}\n`,
);
