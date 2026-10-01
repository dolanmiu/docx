/**
 * Where a line of text can break, as Word breaks it: after spaces and zero-width spaces, between Chinese and Japanese
 * characters, and after hyphens and dashes. Korean, Thai and the other scripts break at their spaces, as Latin words do.
 * In text in Japanese or Chinese, Word's East Asian rules keep some characters, such as closing brackets and the
 * ideographic full stop, from starting a line, and others, such as opening brackets, from ending one (kinsoku). With word
 * wrap off, the words of East Asian runs break anywhere.
 *
 * The rules are adapted from Pretext's (https://github.com/chenglou/pretext, `src/analysis.ts`), which break text as
 * browsers do: its ranges of East Asian characters, the characters that join the words around them, keeping a character
 * and the marks on it together, and keeping the characters that can't start a line with the one before them. Where Word
 * differs from browsers, they follow Word, as its PDFs of scripts/layout-probes/word-unicode.ts and word-unicode2.ts
 * showed: the characters that can't start or end a line are Word's lists, or the document's, and only in Japanese and
 * Chinese; Korean breaks at its spaces; and Thai, Lao, Khmer and Myanmar break only at spaces and zero-width spaces, rather
 * than between their words as browsers break them with a dictionary.
 *
 * Pretext's license:
 *
 * MIT License
 *
 * Copyright (c) 2026 Pretext contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @module
 */

/**
 * The characters that can't start a line, and those that can't end one, for text in a language.
 */
export type KinsokuList = {
    /** The characters that can't start a line (`w:noLineBreaksBefore`) */
    readonly noLineStart?: string;
    /** The characters that can't end a line (`w:noLineBreaksAfter`) */
    readonly noLineEnd?: string;
};

/** The languages Word has lists of the characters that can't start or end a line for */
export type KinsokuLanguage = "japanese" | "simplifiedChinese" | "traditionalChinese" | "korean";

/**
 * How a paragraph's lines break.
 */
export type LineBreakRules = {
    /** Whether Word's East Asian rules keep characters from starting or ending a line (`w:kinsoku`). Default is on */
    readonly kinsoku?: boolean;
    /** Whether lines break between words (`w:wordWrap`), or, when off, anywhere in the words of East Asian runs. Default is on */
    readonly wordWrap?: boolean;
    /** The document's own lists, which take the place of Word's for their language */
    readonly lists?: Partial<Record<KinsokuLanguage, KinsokuList>>;
};

/** A piece of text, with what of its run changes where its lines break */
export type LanguagePiece = {
    readonly text: string;
    /** The East Asian language of its run (`w:lang w:eastAsia`), such as `"ja-JP"` */
    readonly language?: string;
    /** Whether its run is East Asian, by its East Asian font or language, so its words break anywhere with word wrap off */
    readonly eastAsian?: boolean;
};

/* cspell:disable */
// Word's lists, as Word's PDF of scripts/layout-probes/word-unicode2.ts showed them. Word has none for Korean
const WORD_LISTS: Readonly<Record<KinsokuLanguage, Required<KinsokuList>>> = {
    japanese: {
        noLineStart: "!%),.:;?]}¢°’”‰′″℃、。々〉》」』】〕゛゜ゝゞ・ヽヾ！％），．：；？］｝｡｣､･ﾞﾟ￠",
        noLineEnd: "$([\\{£¥‘“〈《「『【〔＄（［｛｢￡￥",
    },
    simplifiedChinese: {
        noLineStart: "!%),.:;?]}¢°·ˇˉ―‖’”…‰′″›℃∶、。〃〉》」』】〕〗〞︶︺︾﹀﹄﹚﹜﹞！＂％＇），．：；？］｀｜｝～￠",
        noLineEnd: "$([{£¥·‘“〈《「『【〔〖〝﹙﹛﹝＄（．［｛￡￥",
    },
    traditionalChinese: {
        noLineStart: "!),.:;?]}¢·’”•‥…‧′﹏﹐﹑﹒﹔﹕﹖﹗﹚﹜﹞！），．：；？］｝｜、。〉》」』】〕〞︰︱︳︴︶︸︺︼︾﹀﹂﹄､",
        noLineEnd: "([{£¥‘“‵〈《「『【〔〝﹙﹛﹝（｛",
    },
    korean: { noLineStart: "", noLineEnd: "" },
};
/* cspell:enable */

// Chinese, Japanese and Korean characters: Pretext's ranges, with the compatibility forms and enclosed letters and numbers
// of CJK, and the scripts of Han, kana and Hangul outside them
const EAST_ASIAN =
    /[\u1100-\u11ff\u2e80-\u2fff\u3000-\u30ff\u3130-\u318f\u31c0-\u33ff\u3400-\u4dbf\u4e00-\u9fff\ua960-\ua97f\uac00-\ud7ff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
// Korean, whose words Word keeps together, breaking lines at the spaces between them, as it does Latin words
const HANGUL = /\p{Script=Hangul}/u;
// Dashes a line can break after, as after a hyphen
const DASHES = new Set(["-", "\u2010", "\u2013", "\u2014"]);
// What joins the characters on either side of it: no-break spaces and the word joiner
const GLUE = new Set(["\u00a0", "\u202f", "\u2007", "\u2060", "\ufeff"]);
// What belongs to the character before it: marks, the zero-width joiner, variation selectors, skin tones and tags
const isExtender = (character: string): boolean => {
    const code = character.codePointAt(0)!;
    return (
        /\p{M}/u.test(character) ||
        code === 0x200d ||
        (code >= 0xfe00 && code <= 0xfe0f) ||
        (code >= 0x1f3fb && code <= 0x1f3ff) ||
        (code >= 0xe0020 && code <= 0xe007f)
    );
};
const ZERO_WIDTH_SPACE = "\u200b";

/** Whether a character is Chinese, Japanese or Korean, or East Asian punctuation, which Word draws in a run's East Asian font */
export const isEastAsian = (character: string): boolean => EAST_ASIAN.test(character);

/** Whether a line can break before and after a character: Chinese and Japanese characters, but not Korean */
const breaksAround = (character: string): boolean => EAST_ASIAN.test(character) && !HANGUL.test(character);

/** Whether a character belongs to the one before it, so a line never breaks between them */
export const extendsCharacter = isExtender;

/**
 * The list of Word's for a language, by its tag, such as `"zh-TW"`. Text in another language, or with none, has none: Word
 * lets any character start or end its lines.
 */
export const kinsokuLanguageOf = (language: string | undefined): KinsokuLanguage | undefined => {
    const tag = (language ?? "").toLowerCase();
    if (tag.startsWith("zh")) {
        return /^zh-(tw|hk|mo|hant)/.test(tag) ? "traditionalChinese" : "simplifiedChinese";
    }
    if (tag.startsWith("ja")) {
        return "japanese";
    }
    return tag.startsWith("ko") ? "korean" : undefined;
};

type Kinsoku = { readonly noLineStart: ReadonlySet<string>; readonly noLineEnd: ReadonlySet<string> };

const NO_KINSOKU: Kinsoku = { noLineStart: new Set(), noLineEnd: new Set() };

const listOf = (language: KinsokuLanguage, { lists = {} }: LineBreakRules): Kinsoku => {
    const { noLineStart = WORD_LISTS[language].noLineStart, noLineEnd = WORD_LISTS[language].noLineEnd } = lists[language] ?? {};
    return { noLineStart: new Set(noLineStart), noLineEnd: new Set(noLineEnd) };
};

/**
 * Where a line can break inside text that has no spaces in it: before which of its characters, by their index, counted
 * in characters rather than UTF-16 code units. A line can always break after spaces, which aren't in it.
 *
 * @param pieces - The text's pieces, with the language of their runs
 */
export const findLineBreaks = (pieces: readonly LanguagePiece[], rules: LineBreakRules = {}): ReadonlySet<number> => {
    const anywhere = rules.wordWrap === false && pieces.some(({ eastAsian }) => eastAsian);
    const text = pieces.map((piece) => piece.text).join("");
    if (!anywhere && ![...text].some((character) => character.codePointAt(0)! > 0x2ff) && !text.includes("-")) {
        // Latin text breaks only at its spaces and hyphens
        return new Set();
    }
    const characters = pieces.flatMap(({ text: piece }) => [...piece]);
    const runs = pieces.flatMap(({ text: piece, language, eastAsian }) =>
        [...piece].map(() => ({ language: kinsokuLanguageOf(language), anywhere: rules.wordWrap === false && eastAsian === true })),
    );
    const kinsoku = rules.kinsoku ?? true;
    const lists = new Map<KinsokuLanguage | undefined, Kinsoku>([[undefined, NO_KINSOKU]]);
    const listAt = (index: number): Kinsoku => {
        const { language } = runs[index];
        if (!lists.has(language)) {
            // eslint-disable-next-line functional/immutable-data
            lists.set(language, listOf(language!, rules));
        }
        return lists.get(language)!;
    };

    const breaks = new Set<number>();
    for (let index = 1; index < characters.length; index++) {
        const before = characters[index - 1];
        const after = characters[index];
        if (isExtender(after) || before === "\u200d" || GLUE.has(before) || GLUE.has(after)) {
            continue;
        }
        const opportunity =
            before === ZERO_WIDTH_SPACE ||
            (DASHES.has(before) && !/[\d-]/.test(after)) ||
            breaksAround(before) ||
            breaksAround(after) ||
            (runs[index - 1].anywhere && runs[index].anywhere);
        if (opportunity && !(kinsoku && (listAt(index).noLineStart.has(after) || listAt(index - 1).noLineEnd.has(before)))) {
            // eslint-disable-next-line functional/immutable-data
            breaks.add(index);
        }
    }
    return breaks;
};
