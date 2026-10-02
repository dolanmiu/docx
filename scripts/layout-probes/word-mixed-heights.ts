/**
 * Probes of how tall Word makes a line of two fonts, or with a picture, where the round-8 probes (word-watertight-text.ts
 * TX8 and TX9) left it open. Each probe starts a page, and each line's text names its probe, so the lines can be found in
 * a PDF saved from Word with pdftotext -bbox-layout, which word-mixed-heights.py reads. Calibri 11, single spaced, no space
 * before or after, on A4 with 1440 margins, so the text is 1440 to 15398 twips down the page.
 *
 * Word's line is as tall as its tallest ascent and its deepest descent, a picture in it sits on the baseline, and 1.15
 * lines over a picture beside Calibri add 0.15 of Calibri's line (TX8, TX9). What isn't known:
 *
 * MH1: multiple and at-least spacing over Calibri 11 with Courier New 11, whose line (275.53 twips) is taller than either
 *      font's own (268.55 and 249.2): whether 1.5 lines are 1.5 of 275.53, or 275.53 and half of 268.55
 * MH2: fonts with a line gap, which Word puts above the text: Arial with Courier New, Times New Roman 20 with Courier
 *      New 20, and Times New Roman 10 with Courier New 10 at 1.5 lines
 * MH3: a picture alone in its paragraph at 1.15, 1.5 and 0.8 lines, and at 1.5 with its mark in Times New Roman 10: each
 *      picture is followed by a single-spaced line of Calibri 11, so the pitch of those lines is the picture's line and
 *      268.55
 * MH4: a picture beside text at 0.8 lines, beside Calibri and Courier New at 1.5, beside Times New Roman 10 at 1.5,
 *      beside Calibri at 1.5, and beside Calibri 8 in a paragraph whose mark is Calibri 11
 * MH5: a picture beside 12-point text in each East Asian font the layout knows, which makes the line the picture and the
 *      font's descent
 * MH6: East Asian fonts beside Latin ones of the same or other sizes
 * MH7: pictures alone in their paragraphs shorter than its mark's line, single spaced: whether the line is the picture,
 *      or the mark's line
 */
// cspell:ignore bbox IHDR IDAT IEND
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

import { Document, type ISectionOptions, ImageRun, LineRuleType, Packer, Paragraph, TextRun } from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Run = ConstructorParameters<typeof TextRun>[0] & object;

// More lines than fit on a page of the smallest of them
const FILL = 80;
/** A page probe: lines made by `make`, each starting with the probe's name and its number */
const page = (probe: string, make: (label: string, index: number) => readonly Paragraph[], count = FILL): ISectionOptions => ({
    children: Array.from({ length: count }, (_, i) => make(`${probe} ${i + 1}`, i)).flat(),
});

/** Line spacing of this many lines, as Word writes it in 240ths */
const multiple = (lines: number): Options["spacing"] => ({ line: Math.round(lines * 240), lineRule: LineRuleType.AUTO });

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

/** A line of Calibri 11 with a word in another font after its label */
const twoFonts =
    (word: Run, options: Options = {}, label: Run = {}) =>
    (text: string): readonly Paragraph[] => [
        new Paragraph({ ...options, children: [new TextRun({ ...label, text: `${text} ` }), new TextRun(word)] }),
    ];

/** A picture alone in its paragraph, then a single-spaced line of Calibri 11 that names it */
const alone =
    (options: Options = {}, points = 30) =>
    (text: string): readonly Paragraph[] => [new Paragraph({ ...options, children: [picture(points)] }), new Paragraph(text)];

/** A 30-point picture after text */
const beside =
    (options: Options = {}, run: Run = {}, word?: Run) =>
    (text: string): readonly Paragraph[] => [
        new Paragraph({
            ...options,
            children: [
                new TextRun({ ...run, text: `${text} ` }),
                ...(word ? [new TextRun({ ...word }), new TextRun({ ...run, text: " " })] : []),
                picture(30),
            ],
        }),
    ];

const IDEOGRAPHS = "永永永永永永永永";
const HANGUL = "가나다라마바사";
// The East Asian fonts whose lines the layout knows, from word-unicode2.ts G1 to G21
const EAST_ASIAN_FONTS: readonly (readonly [string, string])[] = [
    ["MS Mincho", IDEOGRAPHS],
    ["MS Gothic", IDEOGRAPHS],
    ["MS PMincho", IDEOGRAPHS],
    ["MS PGothic", IDEOGRAPHS],
    ["Yu Mincho", IDEOGRAPHS],
    ["Yu Gothic", IDEOGRAPHS],
    ["Meiryo", IDEOGRAPHS],
    ["SimSun", IDEOGRAPHS],
    ["NSimSun", IDEOGRAPHS],
    ["SimHei", IDEOGRAPHS],
    ["Microsoft YaHei", IDEOGRAPHS],
    ["DengXian", IDEOGRAPHS],
    ["KaiTi", IDEOGRAPHS],
    ["FangSong", IDEOGRAPHS],
    ["PMingLiU", IDEOGRAPHS],
    ["MingLiU", IDEOGRAPHS],
    ["Microsoft JhengHei", IDEOGRAPHS],
    ["Malgun Gothic", HANGUL],
    ["Batang", HANGUL],
    ["Gulim", HANGUL],
    ["Dotum", HANGUL],
];

const COURIER: Run = { text: "mono", font: "Courier New" };

const sections: ISectionOptions[] = [
    // MH1a to MH1d: Calibri 11 with Courier New 11 at 1.15, 1.5, 2 and 0.8 lines. MH1e: at least 13.5 points, between
    // the taller font's line (268.55) and the line of both (275.53)
    page("MH1a", twoFonts(COURIER, { spacing: multiple(1.15) })),
    page("MH1b", twoFonts(COURIER, { spacing: multiple(1.5) })),
    page("MH1c", twoFonts(COURIER, { spacing: multiple(2) })),
    page("MH1d", twoFonts(COURIER, { spacing: multiple(0.8) })),
    page("MH1e", twoFonts(COURIER, { spacing: { line: 270, lineRule: LineRuleType.AT_LEAST } })),

    // MH2a: Arial 11 with Courier New 11. MH2b: Times New Roman 20 with Courier New 20. MH2c: Times New Roman 10 with
    // Courier New 10 at 1.5 lines
    page("MH2a", twoFonts(COURIER, {}, { font: "Arial" })),
    page("MH2b", twoFonts({ ...COURIER, size: 40 }, {}, { font: "Times New Roman", size: 40 })),
    page("MH2c", twoFonts({ ...COURIER, size: 20 }, { spacing: multiple(1.5) }, { font: "Times New Roman", size: 20 })),

    // MH3a to MH3c: a 30-point picture alone in its paragraph at 1.15, 1.5 and 0.8 lines. MH3d: at 1.5, with its mark in
    // Times New Roman 10. MH3e: single spaced, against which to read the others
    page("MH3a", alone({ spacing: multiple(1.15) }), FILL / 2),
    page("MH3b", alone({ spacing: multiple(1.5) }), FILL / 2),
    page("MH3c", alone({ spacing: multiple(0.8) }), FILL / 2),
    page("MH3d", alone({ spacing: multiple(1.5), run: { font: "Times New Roman", size: 20 } }), FILL / 2),
    page("MH3e", alone(), FILL / 2),

    // MH4a: a 30-point picture beside Calibri 11 at 0.8 lines. MH4b: beside Calibri 11 and Courier New 11 at 1.5. MH4c:
    // beside Times New Roman 10 at 1.5, with its mark in Times New Roman 10. MH4d: beside Calibri 11 at 1.5. MH4e: beside
    // Calibri 8 at 1.5, with its mark in Calibri 11
    page("MH4a", beside({ spacing: multiple(0.8) })),
    page("MH4b", beside({ spacing: multiple(1.5) }, {}, COURIER)),
    page("MH4c", beside({ spacing: multiple(1.5), run: { font: "Times New Roman", size: 20 } }, { font: "Times New Roman", size: 20 })),
    page("MH4d", beside({ spacing: multiple(1.5) })),
    page("MH4e", beside({ spacing: multiple(1.5) }, { size: 16 })),

    // MH5: 10 lines of a 30-point picture beside 12-point text in each East Asian font, and in Calibri 12 to read them
    // against
    {
        children: [...EAST_ASIAN_FONTS, ["Calibri", ""] as const].flatMap(([font, text], f) =>
            Array.from(
                { length: 10 },
                (_, i) =>
                    new Paragraph({
                        run: { font, size: 24 },
                        children: [new TextRun({ text: `MH5 ${f + 1}-${i + 1} ${font} ${text} `, font, size: 24 }), picture(30)],
                    }),
            ),
        ),
    },

    // MH6a: MS Mincho 12 with Courier New 12. MH6b: MS Mincho 10.5 with Times New Roman 12. MH6c: Yu Mincho 10.5 with
    // Calibri 10.5. MH6d: MS Mincho 12 with Calibri 16. The label is in the East Asian font, and the word in the other
    page("MH6a", twoFonts({ ...COURIER, size: 24 }, {}, { font: "MS Mincho", size: 24 }), 30),
    page("MH6b", twoFonts({ text: "serif", font: "Times New Roman", size: 24 }, {}, { font: "MS Mincho", size: 21 }), 30),
    page("MH6c", twoFonts({ text: "sans", font: "Calibri", size: 21 }, {}, { font: "Yu Mincho", size: 21 }), 30),
    page("MH6d", twoFonts({ text: "sans", font: "Calibri", size: 32 }, {}, { font: "MS Mincho", size: 24 }), 30),

    // MH7a, MH7b: a 6-point and a 12-point picture alone in its paragraph, whose mark's line is 268.55
    page("MH7a", alone({}, 6), FILL / 2),
    page("MH7b", alone({}, 12), FILL / 2),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => writeFileSync("build/word-probes/word-mixed-heights.docx", buffer));
