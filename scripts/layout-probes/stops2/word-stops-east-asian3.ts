/**
 * Probes of what Word's PDFs of `word-stops-east-asian2.ts` and `word-stops-arabic.ts` (round 25) left open, for a later
 * batch Word saves. Japanese in MS Mincho 10.5, 42 ideographs to a line of 9026 twips, as there.
 *
 * word-stops-strict2.docx, with Word's strict rules (w:strictFirstAndLastChars):
 *   EA5 S: each character the strict rules may keep from the start of a line, after 42 ideographs, so that it starts the
 *     second line, unless Word keeps it from it and moves the ideograph before with it: the small kana, the prolonged sound
 *     mark and the half-width small katakana (EA4a showed ぁ to ぇ kept), with an ideograph and 、 to compare, in Japanese,
 *     and some of them in Chinese and Korean. Its label, "EA5 S ja-JP 3041", is a paragraph of its own above it
 *   EA5 E: each character Word's list keeps from the end of a line, as the 42nd, in Japanese
 * word-stops-strict-list.docx, with the strict rules and the document's own list of the characters that can't start a line
 *   of Japanese, 、 and 。 (EA5L): ぁ, ー and 」 as EA5 S has them
 * word-stops-compress2.docx and word-stops-compress-kana2.docx, with punctuation compressed, and punctuation and kana (EA6):
 *   EA4b's text justified (EA6a) and distributed (EA6b), aligned left in Yu Mincho (EA6c) and MS PMincho (EA6d), in
 *   Chinese in SimSun (EA6e), and in Korean in Malgun Gothic (EA6f)
 * word-stops-grid-indents2.docx, on GR14's grid that snaps to characters, of cells of 225.65 twips (GR17):
 *   GR17a: indented 1.2 characters and its first line 0.5 more (leftChars 120, firstLineChars 50)
 *   GR17b: indented 0.5 characters and hanging 1 (leftChars 50, hangingChars 100), its first line before the margin
 *   GR17c: indented -0.5 characters (leftChars -50)
 *   GR17d: indented 2 characters and hanging 0.5 (GR14e), with a tab after a label, to the hanging indent
 *   GR17e: indented 1.2 characters, with a left tab stop at 2000 twips before ideographs
 * word-stops-rtl-ends.docx: where Word breaks lines of right-to-left text in a left-to-right paragraph, each line made, with
 *   docx/layout's widths of the words, so that its last word fits only without the space after it (AR3):
 *   AR3a: Arabic words, then a Latin word after that space
 *   AR3b: Latin words, then an Arabic word after it
 *   AR3c: Hebrew words, then more of them (AR2 showed Arabic's going on to the next line)
 *   AR3d: Arabic words, then more of them, in a right-to-left paragraph (word-unicode.ts R8's Hebrew broke as left to right)
 * word-stops-endnotes-down2.docx (GR15d): an endnote from a document whose one section runs down the page
 * word-stops-endnotes-down3.docx (GR15e): an endnote from a section running down the page, followed by one across it and
 *   one down it again: whether Word ends it with its own section, at the change, or after the last, which runs down too
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-east-asian3.ts [folder]
 */
// cspell:ignore tatweel
import {
    AlignmentType,
    DocumentGridType,
    EndnoteReferenceRun,
    type ISectionOptions,
    PageTextDirectionType,
    Paragraph,
    SectionType,
    TabStopType,
    TextRun,
} from "docx";

import { measureTextWidth } from "../../../src/text-layout";
import { PAGE, TEXT_WIDTH, injectIntoParagraph, line, marker, settings, write } from "./kit";

const MINCHO = { font: { eastAsia: "MS Mincho", ascii: "Calibri", hAnsi: "Calibri" }, size: 21 } as const;
const JAPANESE = "測量は夏に船と徒歩で行われ、灯台から河口まで続いた。記録には見つかったものが書かれている。";
const IDEOGRAPH = "永";
const LABEL = { size: 14 } as const;

/** A paragraph of text in a font and language, in MS Mincho 10.5 by default */
const inLanguage = (text: string, language: string, run: object = MINCHO, options: object = {}): Paragraph =>
    new Paragraph({ ...options, children: [new TextRun({ text, ...run, language: { eastAsia: language } })] });

const hex = (character: string): string => character.codePointAt(0)!.toString(16).padStart(4, "0");

// EA5: the characters the strict rules may keep from the start of a line, and two to compare
// cspell:disable-next-line
const STARTS = [..."ぁぃぅぇぉっゃゅょゎゕゖァィゥェォッャュョヮヵヶーｧｨｩｪｫｬｭｮｯｰ永、"];
const OTHER_LANGUAGES = [..."ぁっャー永"];
// cspell:disable-next-line
const ENDS = [..."「（〔［｛〈《『【＄￡￥$([{£¥‘“永"];
const startProbe = (language: string, character: string): readonly Paragraph[] => [
    line(`EA5 S ${language} ${hex(character)}`, {}, LABEL),
    inLanguage(`${IDEOGRAPH.repeat(42)}${character}${IDEOGRAPH.repeat(3)}`, language),
];
const endProbe = (character: string): readonly Paragraph[] => [
    line(`EA5 E ja-JP ${hex(character)}`, {}, LABEL),
    inLanguage(`${IDEOGRAPH.repeat(41)}${character}${IDEOGRAPH.repeat(4)}`, "ja-JP"),
];
await write({
    name: "word-stops-strict2",
    children: [
        ...STARTS.flatMap((character) => startProbe("ja-JP", character)),
        ...["zh-CN", "zh-TW", "ko-KR"].flatMap((language) => OTHER_LANGUAGES.flatMap((character) => startProbe(language, character))),
        ...ENDS.flatMap(endProbe),
    ],
    injections: [settings("<w:strictFirstAndLastChars/>")],
});
await write({
    name: "word-stops-strict-list",
    children: [..."ぁー」"].flatMap((character) => [
        line(`EA5L S ja-JP ${hex(character)}`, {}, LABEL),
        inLanguage(`${IDEOGRAPH.repeat(42)}${character}${IDEOGRAPH.repeat(3)}`, "ja-JP"),
    ]),
    injections: [settings('<w:noLineBreaksBefore w:lang="ja-JP" w:val="、。"/>', "<w:strictFirstAndLastChars/>")],
});

// EA6: EA4b's text, with its brackets and punctuation, in other alignments and fonts
const BRACKETS = "「測量」は（夏に）、『船』と【徒歩】で行われた。〔灯台〕から〈河口〉まで、続いた。".repeat(4);
const CHINESE = "“测量”在（夏天）、用『船』和【步行】进行。〔灯塔〕到〈河口〉，继续。".repeat(4);
const KOREAN = "「측량」은 (여름에), 『배』와 【도보】로 했다. 〔등대〕에서 〈하구〉까지, 이어졌다. ".repeat(4);
const compressed = (name: string, value: string): Promise<string> =>
    write({
        name,
        children: [
            line("EA6a above"),
            inLanguage(`EA6a ${BRACKETS}`, "ja-JP", MINCHO, { alignment: AlignmentType.JUSTIFIED }),
            line("EA6b above"),
            inLanguage(`EA6b ${BRACKETS}`, "ja-JP", MINCHO, { alignment: AlignmentType.DISTRIBUTE }),
            line("EA6c above"),
            inLanguage(`EA6c ${BRACKETS}`, "ja-JP", { ...MINCHO, font: { ...MINCHO.font, eastAsia: "Yu Mincho" } }),
            line("EA6d above"),
            inLanguage(`EA6d ${BRACKETS}`, "ja-JP", { ...MINCHO, font: { ...MINCHO.font, eastAsia: "MS PMincho" } }),
            line("EA6e above"),
            inLanguage(`EA6e ${CHINESE}`, "zh-CN", { ...MINCHO, font: { ...MINCHO.font, eastAsia: "SimSun" } }),
            line("EA6f above"),
            inLanguage(`EA6f ${KOREAN}`, "ko-KR", { ...MINCHO, font: { ...MINCHO.font, eastAsia: "Malgun Gothic" } }),
            line("EA6 below"),
        ],
        injections: [settings(`<w:characterSpacingControl w:val="${value}"/>`)],
    });
await compressed("word-stops-compress2", "compressPunctuation");
await compressed("word-stops-compress-kana2", "compressPunctuationAndJapaneseKana");

// GR17: GR14's grid, and indents of parts of characters it didn't have
const SNAP = { type: DocumentGridType.SNAP_TO_CHARS, linePitch: 360, charSpace: 210 } as const;
const INDENTS: readonly (readonly [string, string])[] = [
    ["GR17a", '<w:ind w:left="252" w:leftChars="120" w:firstLine="105" w:firstLineChars="50"/>'],
    ["GR17b", '<w:ind w:left="105" w:leftChars="50" w:hanging="210" w:hangingChars="100"/>'],
    ["GR17c", '<w:ind w:left="-105" w:leftChars="-50"/>'],
    ["GR17d", '<w:ind w:left="420" w:leftChars="200" w:hanging="105" w:hangingChars="50"/>'],
    ["GR17e", '<w:ind w:left="252" w:leftChars="120"/>'],
];
await write({
    name: "word-stops-grid-indents2",
    sections: [
        {
            properties: { ...PAGE, grid: SNAP } as never,
            children: [
                line("GR17 above"),
                ...INDENTS.map(
                    ([name]) =>
                        new Paragraph({
                            ...(name === "GR17e" ? { tabStops: [{ type: TabStopType.LEFT, position: 2000 }] } : {}),
                            children: [
                                new TextRun({
                                    text: `${name}${name === "GR17d" || name === "GR17e" ? "\t" : " "}${JAPANESE.repeat(2)}`,
                                    ...MINCHO,
                                }),
                                marker(name),
                            ],
                        }),
                ),
                line("GR17 below"),
            ],
        },
    ],
    injections: INDENTS.map(([name, indent]) => injectIntoParagraph(name, { pPr: indent })),
});

// AR3: lines whose last right-to-left word fits only without the space after it
const ARABIC = { font: "Arial", size: 20, rightToLeft: true } as const;
const LATIN = { font: "Arial", size: 20 } as const;
const ARABIC_WORD = "بالقارب";
// cspell:disable-next-line
const HEBREW_WORD = "המגדלור";
const LATIN_WORD = "lighthouse";
const LINE = TEXT_WIDTH / 20;
const widthOf = (text: string, run: { readonly font: string; readonly size: number; readonly rightToLeft?: boolean }): number =>
    measureTextWidth(text, { font: run.font, size: run.size / 2 });
/**
 * A label in Calibri 10, with as many i's after it as put the end of the last of as many words as fit on the line, with a
 * space between each, less than a space short of the end of the line, so the space after it doesn't fit
 */
const filled = (name: string, word: string, run: { readonly font: string; readonly size: number }): { label: string; words: number } => {
    const space = widthOf(" ", run);
    const each = widthOf(word, run);
    for (let fill = 0; fill < 200; fill++) {
        const label = `${name} ${"i".repeat(fill)} `;
        const start = measureTextWidth(label, { font: "Calibri", size: 10 });
        const words = Math.floor((LINE - start + space) / (each + space));
        const end = start + words * each + (words - 1) * space;
        if (LINE - end > 0.2 && LINE - end < space - 0.2) {
            return { label, words };
        }
    }
    throw new Error(`No fill for ${name}`);
};
const rightToLeftEnd = (
    name: string,
    word: string,
    run: typeof ARABIC | typeof LATIN,
    next: readonly TextRun[],
    options: object = {},
): Paragraph => {
    const { label, words } = filled(name, word, run);
    return new Paragraph({
        ...options,
        children: [
            new TextRun({ text: label, font: "Calibri", size: 20 }),
            new TextRun({ text: `${Array.from({ length: words }, () => word).join(" ")} `, ...run }),
            ...next,
        ],
    });
};
await write({
    name: "word-stops-rtl-ends",
    children: [
        line("AR3a above"),
        rightToLeftEnd("AR3a", ARABIC_WORD, ARABIC, [new TextRun({ text: `${LATIN_WORD} ${LATIN_WORD}`, ...LATIN })]),
        line("AR3b above"),
        rightToLeftEnd("AR3b", LATIN_WORD, LATIN, [new TextRun({ text: `${ARABIC_WORD} ${ARABIC_WORD}`, ...ARABIC })]),
        line("AR3c above"),
        rightToLeftEnd("AR3c", HEBREW_WORD, ARABIC, [new TextRun({ text: `${HEBREW_WORD} ${HEBREW_WORD}`, ...ARABIC })]),
        line("AR3d above"),
        rightToLeftEnd("AR3d", ARABIC_WORD, ARABIC, [new TextRun({ text: `${ARABIC_WORD} ${ARABIC_WORD}`, ...ARABIC })], {
            bidirectional: true,
        }),
        line("AR3 below"),
    ],
});

// GR15d and GR15e: endnotes after text that runs down the page
const DOWN = { textDirection: PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT };
const section = (name: string, children: readonly Paragraph[], down: boolean): ISectionOptions => ({
    properties: {
        ...PAGE,
        type: SectionType.NEXT_PAGE,
        page: { ...PAGE.page, ...(down ? DOWN : {}) },
    } as never,
    children: [line(`${name} above`), ...children, line(`${name} below`)],
});
const referring = (name: string): Paragraph =>
    new Paragraph({ children: [new TextRun({ text: `${name} ${JAPANESE}`, ...MINCHO }), new EndnoteReferenceRun(1)] });
const endnote = (probe: string): object => ({
    endnotes: { 1: { children: [new Paragraph({ children: [new TextRun({ text: `${probe} endnote ${JAPANESE}`, ...MINCHO })] })] } },
});
await write({ name: "word-stops-endnotes-down2", options: endnote("GR15d"), sections: [section("GR15d", [referring("GR15d")], true)] });
await write({
    name: "word-stops-endnotes-down3",
    options: endnote("GR15e"),
    sections: [
        section("GR15e", [referring("GR15e")], true),
        section("GR15e across", [line("GR15e across section")], false),
        section("GR15e last", [line("GR15e last section")], true),
    ],
});
