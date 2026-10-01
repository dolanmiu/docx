// cspell:disable
// Probes of how Word breaks lines of Chinese, Japanese, Korean and Thai text, and lays out right-to-left text, for
// docx/layout's line breaking (src/text-layout/line-breaking.ts). Each probe has a label before it, in 7-point Calibri,
// so its lines can be found in a PDF saved from Word: word-unicode.read.ts reads pdftotext -bbox-layout's HTML of it.
// Labels name the characters they test by their code points, so they have no characters Calibri doesn't have.
//
// The text is 485 points wide, so 40 ideographs of 12-point MS Mincho fit on a line, and neither a 41st nor half of one.
//
// K: which characters can't start a line, with no language set: 40 ideographs, the character, then 3 more
// E: which characters can't end a line: 39 ideographs, the character, then 4 more
// L: K and E for the characters Word's lists for Japanese, Chinese and Korean differ on, in each of those languages
// H: punctuation that hangs past the end of the line, with overflowPunct on and off
// N: K and E with kinsoku off
// W: wordWrap off, which lets Latin words break anywhere, and Latin words and numbers after ideographs
// A: the space Word adds between ideographs and Latin letters or numbers (autoSpaceDE and autoSpaceDN)
// P: whether punctuation next to punctuation is compressed, in a document that doesn't ask for it
// KR: whether Korean breaks inside words
// T: where Thai breaks
// R: right-to-left paragraphs and runs: where they break, and the size and bold of complex scripts
// G: the height of lines of East Asian, Thai and Hebrew text in their fonts
//
// Usage: npm run run-ts -- scripts/layout-probes/word-unicode.ts, which writes build/word-probes/word-unicode.docx
import * as fs from "fs";
import JSZip from "jszip";
import { Document, Packer, Paragraph, TextRun } from "docx";

const IDEOGRAPH = "永";
const ideographs = (count: number): string => IDEOGRAPH.repeat(count);
const MINCHO = { font: "MS Mincho", size: 24 };

/** Paragraph properties docx doesn't write, put in after the paragraph's style by its id */
const INJECTED: Readonly<Record<string, string>> = {
    KinsokuOff: '<w:kinsoku w:val="0"/>',
    HangOff: '<w:overflowPunct w:val="0"/>',
    HangOn: '<w:overflowPunct w:val="1"/>',
    AutoSpaceOff: '<w:autoSpaceDE w:val="0"/><w:autoSpaceDN w:val="0"/>',
    AutoSpaceOn: '<w:autoSpaceDE w:val="1"/><w:autoSpaceDN w:val="1"/>',
};

const label = (text: string): Paragraph => new Paragraph({ keepNext: true, children: [new TextRun({ text, size: 14 })] });

/** A character by its code point, as labels name them, so they are all in Calibri */
const codePoint = (character: string): string => `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`;

type Options = { readonly language?: string; readonly style?: string; readonly wordWrap?: boolean };

const mincho = (text: string, { language, style, wordWrap }: Options = {}): Paragraph =>
    new Paragraph({
        ...(style ? { style } : {}),
        ...(wordWrap ? { wordWrap } : {}),
        children: [new TextRun({ text, ...MINCHO, ...(language ? { language: { eastAsia: language } } : {}) })],
    });

/** A character at the start of the second line, after a full line of ideographs */
const atStart = (name: string, character: string, options: Options = {}): readonly Paragraph[] => [
    label(`${name} start ${codePoint(character)}`),
    mincho(`${ideographs(40)}${character}${ideographs(3)}`, options),
];

/** A character at the end of the first line, the 40th */
const atEnd = (name: string, character: string, options: Options = {}): readonly Paragraph[] => [
    label(`${name} end ${codePoint(character)}`),
    mincho(`${ideographs(39)}${character}${ideographs(4)}`, options),
];

const numbered = (prefix: string, index: number): string => `${prefix}${String(index + 1).padStart(2, "0")}`;

// Word's lists for Japanese (the first two lines, and the small kana of its strict list), Chinese and Korean, and
// characters Unicode's line breaking rules keep from starting a line that none of them has
const CANT_START = [
    ..."!%),.:;?]}¢°’”‰′″℃、。々〉》」』】〕゛゜ゝゞ・ヽヾ",
    ..."！％），．：；？］｝｡｣､･ﾞﾟ￠",
    ..."っャァーｯｰ",
    ..."·ˇ―‖…〃〗〞︶﹚＂＇｀｜～›∶¨",
    ..."—–•‥‧﹐﹑︰",
    ..."〜‐゠〙‼⁉",
];
const CANT_END = [..."([{$£¥‘“〈《「『【〔＄（［｛｢￡￥〖〝﹙﹛﹝＼\\￦¿¡«·〘"];
const LANGUAGES = ["ja-JP", "zh-CN", "zh-TW", "ko-KR"];
const BY_LANGUAGE_START = [..."々・…〃〗～―—‥¢っ‰"];
const BY_LANGUAGE_END = [..."‘＼￦〖﹙·"];
const HANGING = [..."、。，．）」！？：；"];

const PROSE = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const LONG_WORD = "abcdefghijklmnopqrstuvwxyzab";
const prose = (words: number): string => Array.from({ length: words }, (_, i) => PROSE[(i * 5) % PROSE.length]).join(" ");

const HEBREW = ["זהו משפט לדוגמה בעברית", "הטקסט נכתב מימין לשמאל", "השורות נשברות ברווחים בין המילים"];
const ARABIC = ["هذا نص تجريبي باللغة العربية", "يكتب النص من اليمين إلى اليسار", "وتنكسر الأسطر عند المسافات بين الكلمات"];
const THAI = [
    "ภาษาไทยเป็นภาษาที่ไม่เว้นวรรคระหว่างคำ",
    "โปรแกรมจึงต้องใช้พจนานุกรมเพื่อหาขอบเขตของคำ",
    "วันนี้อากาศดีมากเราจึงไปเที่ยวทะเลกับครอบครัว",
    "นักเรียนทุกคนต้องอ่านหนังสือก่อนสอบ",
    "กรุงเทพมหานครเป็นเมืองหลวงของประเทศไทย",
    "ประเทศไทยมีจังหวัดทั้งหมดเจ็ดสิบเจ็ดจังหวัด",
    "คนไทยชอบกินข้าวเหนียวกับมะม่วงในฤดูร้อน",
];
const KOREAN_WORD = "가나다라마바사";

const repeated = (sentences: readonly string[], times: number, separator: string): string =>
    Array.from({ length: times }, (_, round) =>
        sentences.map((_, i) => sentences[(i + round * 3) % sentences.length]).join(separator),
    ).join(separator);

/** Eleven one-line paragraphs, for the height of a line */
const pitch = (name: string, text: string, run: ConstructorParameters<typeof TextRun>[0] & object): readonly Paragraph[] =>
    Array.from({ length: 11 }, (_, i) => new Paragraph({ children: [new TextRun({ ...run, text: `${name} ${i + 1} ${text}` })] }));

const MIXED_FONT = { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "MS Mincho", cs: "Calibri" };

const HEIGHT_FONTS: readonly (readonly [string, string])[] = [
    ["MS Mincho", ideographs(8)],
    ["MS Gothic", ideographs(8)],
    ["Yu Mincho", ideographs(8)],
    ["Yu Gothic", ideographs(8)],
    ["SimSun", ideographs(8)],
    ["Microsoft YaHei", ideographs(8)],
    ["DengXian", ideographs(8)],
    ["PMingLiU", ideographs(8)],
    ["Malgun Gothic", "가나다라마바사"],
    ["Batang", "가나다라마바사"],
    ["Calibri", ideographs(8)],
    ["Tahoma", "ภาษาไทยเป็นภาษา"],
    ["Cordia New", "ภาษาไทยเป็นภาษา"],
    ["Arial", "זהו משפט לדוגמה"],
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: Object.keys(INJECTED).map((id) => ({ id, name: id, basedOn: "Normal" })),
    },
    sections: [
        {
            properties: {
                page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1270, right: 1270 } },
            },
            children: [
                ...CANT_START.flatMap((character, i) => atStart(numbered("K", i), character)),
                ...CANT_END.flatMap((character, i) => atEnd(numbered("E", i), character)),
                ...LANGUAGES.flatMap((language) => [
                    ...BY_LANGUAGE_START.flatMap((character, i) => atStart(`${numbered("L", i)} ${language}`, character, { language })),
                    ...BY_LANGUAGE_END.flatMap((character, i) => atEnd(`${numbered("L", i + 20)} ${language}`, character, { language })),
                ]),
                ...HANGING.flatMap((character, i) => [
                    ...atStart(`${numbered("H", i)} on`, character, { style: "HangOn" }),
                    ...atStart(`${numbered("H", i)} off`, character, { style: "HangOff" }),
                ]),
                ...[..."、。）」ーっ！"].flatMap((character, i) => atStart(numbered("N", i), character, { style: "KinsokuOff" })),
                ...[..."（「＄"].flatMap((character, i) => atEnd(numbered("N", i + 10), character, { style: "KinsokuOff" })),

                // W1 and W2: a Latin paragraph with wordWrap off, and without. W3 to W8: a Latin word or number that doesn't
                // fit at the end of a line of ideographs, after a space, with wordWrap off, and with no space
                label("W1 Latin, wordWrap off"),
                new Paragraph({ wordWrap: true, children: [new TextRun(prose(120))] }),
                label("W2 Latin"),
                new Paragraph({ children: [new TextRun(prose(120))] }),
                label("W3 space internationalization"),
                mincho(`${ideographs(35)} internationalization${ideographs(2)}`),
                label("W4 space internationalization, wordWrap off"),
                mincho(`${ideographs(35)} internationalization${ideographs(2)}`, { wordWrap: true }),
                label("W5 abcd"),
                mincho(`${ideographs(39)}abcd${ideographs(2)}`),
                label("W6 1234"),
                mincho(`${ideographs(39)}1234${ideographs(2)}`),
                label("W7 full-width 1234"),
                mincho(`${ideographs(39)}１２３４${ideographs(2)}`),
                label("W8 full-width abcd"),
                mincho(`${ideographs(39)}ａｂｃｄ${ideographs(2)}`),
                // W9 to W14: a Calibri word joined to another by a dash, slash or zero-width space at the end of a line. The
                // line ends after the join where Word breaks there, and before the first word where it doesn't
                ...[
                    ["W9 em dash", "\u2014"],
                    ["W10 en dash", "\u2013"],
                    ["W11 hyphen", "-"],
                    ["W12 Unicode hyphen", "\u2010"],
                    ["W13 slash", "/"],
                    ["W14 zero-width space", "\u200B"],
                ].flatMap(([name, join]) => [
                    label(name),
                    new Paragraph({ children: [new TextRun({ text: `${prose(9)} ${LONG_WORD}${join}${LONG_WORD}`, size: 24 })] }),
                ]),

                // A1 to A3: ideographs, then Calibri letters and numbers, with autoSpaceDE and autoSpaceDN as Word has them,
                // off and on. A4 to A6: 39 ideographs and "ab", 480 points, then 3 more ideographs, which only fit on the
                // first line with less than 2.5 points around "ab"
                ...(["", "AutoSpaceOff", "AutoSpaceOn"] as const).flatMap((style, i) => [
                    label(`A${i + 1} ${style || "default"}`),
                    new Paragraph({
                        ...(style ? { style } : {}),
                        children: [
                            new TextRun({ text: `${ideographs(5)}abc${ideographs(5)}123${ideographs(5)}`, font: MIXED_FONT, size: 24 }),
                        ],
                    }),
                ]),
                ...(["", "AutoSpaceOff", "AutoSpaceOn"] as const).flatMap((style, i) => [
                    label(`A${i + 4} ${style || "default"} fit`),
                    new Paragraph({
                        ...(style ? { style } : {}),
                        children: [new TextRun({ text: `${ideographs(20)}ab${ideographs(22)}`, font: MIXED_FONT, size: 24 })],
                    }),
                ]),

                // P1 to P4: 82 characters, 27 of them pairs of punctuation. Uncompressed they take 3 lines, and 2 with the pairs
                // compressed
                ...["」「", "。」", "、「", "）（"].flatMap((pair, i) => [
                    label(`P${i + 1} ${[...pair].map(codePoint).join(" ")}`),
                    mincho(`${`${IDEOGRAPH}${pair}`.repeat(27)}${IDEOGRAPH}`),
                ]),

                // KR1 to KR3: words of 7 syllables, with no language, in Korean, and with wordWrap off
                ...([{}, { language: "ko-KR" }, { wordWrap: true }] as const).flatMap((options, i) => [
                    label(`KR${i + 1}`),
                    new Paragraph({
                        ...("wordWrap" in options ? { wordWrap: true } : {}),
                        children: [
                            new TextRun({
                                text: Array.from({ length: 30 }, () => KOREAN_WORD).join(" "),
                                font: "Malgun Gothic",
                                size: 24,
                                ...("language" in options ? { language: { eastAsia: options.language } } : {}),
                            }),
                        ],
                    }),
                ]),

                // T1 to T3: Thai in Tahoma with no spaces, with spaces between sentences, and in Calibri, which has no Thai
                label("T1 Thai, no spaces"),
                new Paragraph({ children: [new TextRun({ text: repeated(THAI, 2, ""), font: "Tahoma", size: 24 })] }),
                label("T2 Thai, spaces between sentences"),
                new Paragraph({ children: [new TextRun({ text: repeated(THAI, 2, " "), font: "Tahoma", size: 24 })] }),
                label("T3 Thai in Calibri"),
                new Paragraph({ children: [new TextRun({ text: repeated(THAI, 2, ""), size: 24 })] }),

                // R1 to R3: the same Latin words in a left-to-right paragraph, a right-to-left one of right-to-left runs, and a
                // right-to-left one of left-to-right runs
                label("R1 Latin"),
                new Paragraph({ children: [new TextRun(prose(150))] }),
                label("R2 Latin, bidi paragraph, rtl runs"),
                new Paragraph({ bidirectional: true, children: [new TextRun({ text: prose(150), rightToLeft: true })] }),
                label("R3 Latin, bidi paragraph"),
                new Paragraph({ bidirectional: true, children: [new TextRun(prose(150))] }),
                // R4: rtl runs of 11 points and 22 for complex scripts. R5: Hebrew in runs that aren't rtl, the same
                label("R4 rtl runs, sz 22 szCs 44"),
                ...pitch("R4", "the line", { rightToLeft: true, size: 22, sizeComplexScript: 44 }),
                label("R5 Hebrew, sz 22 szCs 44"),
                ...pitch("R5", HEBREW[0], { font: "Arial", size: 22, sizeComplexScript: 44 }),
                // R6 and R7: an rtl run bold only for complex scripts, and one not bold, to compare their widths
                label("R6 rtl run, bCs"),
                new Paragraph({
                    children: [new TextRun({ text: `R6 ${prose(12)}`, rightToLeft: true, bold: false, boldComplexScript: true })],
                }),
                label("R7 rtl run"),
                new Paragraph({ children: [new TextRun({ text: `R7 ${prose(12)}`, rightToLeft: true })] }),
                // R8 and R9: Hebrew and Arabic paragraphs
                label("R8 Hebrew"),
                new Paragraph({
                    bidirectional: true,
                    children: [new TextRun({ text: repeated(HEBREW, 6, " "), font: "Arial", rightToLeft: true })],
                }),
                label("R9 Arabic"),
                new Paragraph({
                    bidirectional: true,
                    children: [new TextRun({ text: repeated(ARABIC, 6, " "), font: "Arial", rightToLeft: true })],
                }),

                // G: 11 lines of 12-point text in each font, and of 11-point Calibri letters with MS Mincho ideographs
                ...HEIGHT_FONTS.flatMap(([font, text], i) => [label(`G${i + 1} ${font}`), ...pitch(`G${i + 1}`, text, { font, size: 24 })]),
                label(`G${HEIGHT_FONTS.length + 1} Calibri 11 and MS Mincho`),
                ...pitch(`G${HEIGHT_FONTS.length + 1}`, `abc${ideographs(5)}`, { font: MIXED_FONT, size: 22 }),
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
    fs.writeFileSync("build/word-probes/word-unicode.docx", await zip.generateAsync({ type: "nodebuffer" }));
});
