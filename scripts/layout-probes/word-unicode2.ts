// cspell:disable
// More probes of how Word breaks and measures East Asian, Thai and right-to-left text, after word-unicode.ts, whose PDF
// from Word showed that Word keeps characters from starting or ending a line only in text with an East Asian language,
// that Korean breaks at spaces, and that lines of East Asian fonts are about 1.3 times as tall as the font's height.
// word-unicode2.read.ts reads pdftotext -bbox-layout's HTML of its PDF.
//
// S and E: every character of Word's lists for Japanese, Chinese and Korean, as docx/layout has them, at the start and at
// the end of a line, in each language and in English. In 6-point MS Mincho, in 2 columns 241 points wide, so 40
// ideographs fit on a line, and neither a 41st nor a sixth of one
// H: punctuation that can't start a line, in Japanese, with overflowPunct as Word has it, on and off
// A: the space between ideographs and Latin letters and numbers, in Japanese
// W: wordWrap off in paragraphs with and without ideographs, and a zero-width space between two long words
// T: Thai words without marks above or below their letters, whose text pdftotext reads, with no language, in Thai, and with
// zero-width spaces between them
// F: which font and size Hebrew and Latin text are in, in runs that are right to left and runs that aren't: Courier New for
// complex scripts, whose letters are all 0.6 em wide, and Calibri for the rest
// G: 20 lines of 12-point text in each font, for the height of its lines, and of ideographs in fonts without them
//
// Usage: npm run run-ts -- scripts/layout-probes/word-unicode2.ts, which writes build/word-probes/word-unicode2.docx
import * as fs from "fs";
import JSZip from "jszip";
import { Document, Packer, Paragraph, SectionType, TextRun } from "docx";

const IDEOGRAPH = "永";
const ideographs = (count: number): string => IDEOGRAPH.repeat(count);

/** Paragraph properties docx doesn't write, put in after the paragraph's style by its id */
const INJECTED: Readonly<Record<string, string>> = {
    HangOff: '<w:overflowPunct w:val="0"/>',
    HangOn: '<w:overflowPunct w:val="1"/>',
    AutoSpaceOff: '<w:autoSpaceDE w:val="0"/><w:autoSpaceDN w:val="0"/>',
    AutoSpaceOn: '<w:autoSpaceDE w:val="1"/><w:autoSpaceDN w:val="1"/>',
};

const codePoint = (character: string): string => `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`;
const label = (text: string, size = 14): Paragraph => new Paragraph({ keepNext: true, children: [new TextRun({ text, size })] });

type Options = { readonly language?: string; readonly style?: string; readonly size?: number };

const mincho = (text: string, { language, style, size = 24 }: Options = {}): Paragraph =>
    new Paragraph({
        ...(style ? { style } : {}),
        children: [new TextRun({ text, font: "MS Mincho", size, ...(language ? { language: { eastAsia: language } } : {}) })],
    });

const START = [
    ..."!%),.:;?]}¢°’”‰′″℃、。々〉》」』】〕゛゜ゝゞ・ヽヾ！％），．：；？］｝｡｣､･ﾞﾟ￠·ˇˉ―‖…›∶〃〗〞︶︺︾﹀﹄﹚﹜﹞＂＇｀｜～–—•‥‧",
    ..."﹏﹐﹑﹒﹔﹕﹖﹗︰︱︳︴︸︼﹂ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶーｧｨｩｪｫｬｭｮｯｰ〟〜゠〙〛‼⁉ゕゖ",
];
const END = [..."$([\\{£¥‘“〈《「『【〔＄（［｛｢￡￥·〖〝﹙﹛﹝．‵︴＼￦〘〚«‹¿¡＃＠"];
const LANGUAGES = ["ja-JP", "zh-CN", "zh-TW", "ko-KR", "en-US"];

// Thai words with no marks above or below their letters
const THAI_WORDS = ["เรา", "ไป", "หา", "ปลา", "ตาม", "ทาง", "นาน", "ภาษาไทย", "ราคา", "แมว", "หมา", "ขาว", "ดาว", "เขา", "มา", "ทะเล"];
const thai = (count: number, separator: string): string =>
    Array.from({ length: count }, (_, i) => THAI_WORDS[(i * 7 + Math.floor(i / 16)) % THAI_WORDS.length]).join(separator);

const PROSE = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (words: number): string => Array.from({ length: words }, (_, i) => PROSE[(i * 5) % PROSE.length]).join(" ");
const LONG_WORD = "abcdefghijklmnopqrstuvwxyzab";

const HEBREW_LETTERS = "אבגדהוזחטיכלמנסעפצקרשת".repeat(2);
const SLOTS = { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "Calibri", cs: "Courier New" };
const MIXED_FONT = { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "MS Mincho", cs: "Calibri" };

/** Twenty one-line paragraphs, for the height of a line */
const pitch = (name: string, text: string, run: ConstructorParameters<typeof TextRun>[0] & object, lines = 20): readonly Paragraph[] =>
    Array.from({ length: lines }, (_, i) => new Paragraph({ children: [new TextRun({ ...run, text: `${name} ${i + 1} ${text}` })] }));

const HEIGHT_FONTS: readonly (readonly [string, string])[] = [
    ["MS Mincho", ideographs(8)],
    ["MS Gothic", ideographs(8)],
    ["MS PMincho", ideographs(8)],
    ["MS PGothic", ideographs(8)],
    ["Yu Mincho", ideographs(8)],
    ["Yu Gothic", ideographs(8)],
    ["Meiryo", ideographs(8)],
    ["SimSun", ideographs(8)],
    ["NSimSun", ideographs(8)],
    ["SimHei", ideographs(8)],
    ["Microsoft YaHei", ideographs(8)],
    ["DengXian", ideographs(8)],
    ["KaiTi", ideographs(8)],
    ["FangSong", ideographs(8)],
    ["PMingLiU", ideographs(8)],
    ["MingLiU", ideographs(8)],
    ["Microsoft JhengHei", ideographs(8)],
    ["Malgun Gothic", "가나다라마바사"],
    ["Batang", "가나다라마바사"],
    ["Gulim", "가나다라마바사"],
    ["Dotum", "가나다라마바사"],
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: Object.keys(INJECTED).map((id) => ({ id, name: id, basedOn: "Normal" })),
    },
    sections: [
        {
            properties: {
                page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 940, right: 940 } },
                column: { count: 2, space: 720 },
            },
            children: LANGUAGES.flatMap((language) => [
                ...START.flatMap((character) => [
                    label(`S ${language} ${codePoint(character)}`, 8),
                    mincho(`${ideographs(40)}${character}${ideographs(3)}`, { language, size: 12 }),
                ]),
                ...END.flatMap((character) => [
                    label(`E ${language} ${codePoint(character)}`, 8),
                    mincho(`${ideographs(39)}${character}${ideographs(4)}`, { language, size: 12 }),
                ]),
            ]),
        },
        {
            properties: {
                type: SectionType.NEXT_PAGE,
                page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1270, right: 1270 } },
            },
            children: [
                // H: 40 ideographs of 12-point MS Mincho, then the character, in Japanese, with overflowPunct as Word has it,
                // on and off
                ...(["", "HangOn", "HangOff"] as const).flatMap((style) =>
                    [..."、。，．）」！？"].flatMap((character, i) => [
                        label(`H${i + 1} ${style || "default"} ${codePoint(character)}`),
                        mincho(`${ideographs(40)}${character}${ideographs(3)}`, { language: "ja-JP", ...(style ? { style } : {}) }),
                    ]),
                ),

                // A: ideographs, then Calibri letters and numbers, in Japanese, with autoSpaceDE and autoSpaceDN as Word has
                // them, off and on
                ...(["", "AutoSpaceOff", "AutoSpaceOn"] as const).flatMap((style, i) => [
                    label(`A${i + 1} ${style || "default"}`),
                    new Paragraph({
                        ...(style ? { style } : {}),
                        children: [
                            new TextRun({
                                text: `${ideographs(5)}abc${ideographs(5)}123${ideographs(5)}`,
                                font: MIXED_FONT,
                                size: 24,
                                language: { eastAsia: "ja-JP" },
                            }),
                        ],
                    }),
                ]),

                // W1: wordWrap off, a Calibri word after ideographs. W2: MS Mincho Latin words. W3: Calibri words after one
                // ideograph. W4: Calibri words in Japanese. W5: a zero-width space between two words too long for the line
                label("W1 wordWrap off, Calibri after ideographs"),
                new Paragraph({
                    wordWrap: true,
                    children: [new TextRun({ text: `${ideographs(35)} internationalization${ideographs(2)}`, font: MIXED_FONT, size: 24 })],
                }),
                label("W2 wordWrap off, MS Mincho Latin"),
                new Paragraph({ wordWrap: true, children: [new TextRun({ text: prose(80), font: "MS Mincho", size: 24 })] }),
                label("W3 wordWrap off, an ideograph then Calibri"),
                new Paragraph({
                    wordWrap: true,
                    children: [new TextRun({ text: `${IDEOGRAPH} ${prose(80)}`, font: MIXED_FONT, size: 24 })],
                }),
                label("W4 wordWrap off, Calibri in Japanese"),
                new Paragraph({
                    wordWrap: true,
                    children: [new TextRun({ text: prose(80), size: 24, language: { eastAsia: "ja-JP" } })],
                }),
                label("W5 zero-width space"),
                new Paragraph({ children: [new TextRun({ text: `${prose(9)} ${LONG_WORD}\u200B${LONG_WORD}${LONG_WORD}`, size: 24 })] }),

                // T: Thai words in Tahoma, without spaces, in Thai, and with zero-width spaces between them
                label("T1 Thai"),
                new Paragraph({ children: [new TextRun({ text: thai(150, ""), font: "Tahoma", size: 24 })] }),
                label("T2 Thai in Thai"),
                new Paragraph({
                    children: [new TextRun({ text: thai(150, ""), font: "Tahoma", size: 24, language: { bidirectional: "th-TH" } })],
                }),
                label("T3 Thai, zero-width spaces"),
                new Paragraph({ children: [new TextRun({ text: thai(150, "\u200B"), font: "Tahoma", size: 24 })] }),

                // F1 and F2: Hebrew letters in a run that isn't right to left, and in one that is. F3: Latin letters in a
                // right-to-left run. 11 points, and 22 for complex scripts
                label("F1 Hebrew"),
                new Paragraph({ children: [new TextRun({ text: HEBREW_LETTERS, font: SLOTS, size: 22, sizeComplexScript: 44 })] }),
                label("F2 Hebrew, rtl"),
                new Paragraph({
                    children: [new TextRun({ text: HEBREW_LETTERS, font: SLOTS, size: 22, sizeComplexScript: 44, rightToLeft: true })],
                }),
                label("F3 Latin, rtl"),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "abcdefghijklmnopqrstuvwxyz",
                            font: SLOTS,
                            size: 22,
                            sizeComplexScript: 44,
                            rightToLeft: true,
                        }),
                    ],
                }),

                // G1 to G21: 12-point text in each font. G22 and G23: MS Mincho at 10.5 and 9 points. G24 to G28: ideographs in
                // Calibri, which has none, with no language, in English, Japanese, Chinese and Korean. G29 to G31:
                // ideographs, Thai and Hebrew in the theme's font for body text
                ...HEIGHT_FONTS.flatMap(([font, text], i) => [label(`G${i + 1} ${font}`), ...pitch(`G${i + 1}`, text, { font, size: 24 })]),
                label("G22 MS Mincho 10.5"),
                ...pitch("G22", ideographs(8), { font: "MS Mincho", size: 21 }),
                label("G23 MS Mincho 9"),
                ...pitch("G23", ideographs(8), { font: "MS Mincho", size: 18 }),
                ...([undefined, "en-US", "ja-JP", "zh-CN", "ko-KR"] as const).flatMap((language, i) => [
                    label(`G${24 + i} Calibri ideographs ${language ?? "no language"}`),
                    ...pitch(`G${24 + i}`, ideographs(8), { size: 24, ...(language ? { language: { eastAsia: language } } : {}) }),
                ]),
                ...[ideographs(8), "ภาษาไทยเป็นภาษา", "זהו משפט לדוגמה"].flatMap((text, i) => [
                    label(`G${29 + i} theme body`),
                    ...pitch(`G${29 + i}`, text, { font: { theme: "body" }, size: 24 }),
                ]),
                label("end"),
            ],
        },
    ],
});

Packer.toBuffer(doc).then(async (buffer) => {
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file("word/document.xml")!.async("string");
    const injected = Object.entries(INJECTED).reduce(
        (all, [style, properties]) => all.split(`<w:pStyle w:val="${style}"/>`).join(`<w:pStyle w:val="${style}"/>${properties}`),
        xml,
    );
    zip.file("word/document.xml", injected);
    fs.mkdirSync("build/word-probes", { recursive: true });
    fs.writeFileSync("build/word-probes/word-unicode2.docx", await zip.generateAsync({ type: "nodebuffer" }));
});
