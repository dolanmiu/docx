/**
 * Reads CSS: the declarations of a `style` attribute, and the rules of a style sheet.
 *
 * It follows CSS's syntax as far as docx/html needs it: comments are left out, strings and brackets are skipped over
 * where they can't end a declaration or a rule, and what it can't read is left out, as a browser leaves it out.
 *
 * @module
 */

/** A declaration, such as `color: red !important` */
export type Declaration = {
    /** The property, lower-cased, except a custom property, such as `--main-color`, which keeps its case */
    readonly property: string;
    /** The value, without `!important` and the space around it */
    readonly value: string;
    readonly important: boolean;
};

/** A style rule: its selectors, as written, and its declarations */
export type StyleRule = {
    readonly selectors: string;
    readonly declarations: readonly Declaration[];
};

/** The closing bracket of each opening one */
const OPENING: ReadonlyMap<string, string> = new Map([
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
]);

/**
 * The CSS without its comments, each of which is a space, as it separates what is on either side of it. A comment
 * that isn't closed runs to the end. Comments in strings are part of the strings.
 */
export const withoutComments = (css: string): string => {
    let result = "";
    let index = 0;
    while (index < css.length) {
        const character = css[index];
        if (character === "/" && css[index + 1] === "*") {
            const end = css.indexOf("*/", index + 2);
            result += " ";
            index = end === -1 ? css.length : end + 2;
        } else if (character === '"' || character === "'") {
            const end = endOfString(css, index);
            result += css.slice(index, end);
            index = end;
        } else {
            result += character;
            index++;
        }
    }
    return result;
};

/** The index after the string that starts at `start`, after its closing quote, or at the end of a line it doesn't close */
const endOfString = (css: string, start: number): number => {
    const quote = css[start];
    let index = start + 1;
    while (index < css.length && css[index] !== quote && css[index] !== "\n") {
        index += css[index] === "\\" ? 2 : 1;
    }
    return Math.min(index + 1, css.length);
};

/**
 * Splits CSS without comments at each of the characters given that isn't in a string or in brackets. A closing
 * bracket without an opening one is skipped over, as is anything after a backslash.
 */
export const splitTopLevel = (css: string, separators: string): readonly string[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const parts: string[] = [];
    let closing: readonly string[] = [];
    let start = 0;
    let index = 0;
    while (index < css.length) {
        const character = css[index];
        if (character === "\\") {
            index += 2;
            continue;
        }
        if (character === '"' || character === "'") {
            index = endOfString(css, index);
            continue;
        }
        const closer = OPENING.get(character);
        if (closing.length === 0 && separators.includes(character)) {
            // eslint-disable-next-line functional/immutable-data
            parts.push(css.slice(start, index));
            start = index + 1;
        } else if (closer !== undefined) {
            closing = [closer, ...closing];
        } else if (character === closing[0]) {
            closing = closing.slice(1);
        }
        index++;
    }
    // eslint-disable-next-line functional/immutable-data
    parts.push(css.slice(start));
    return parts;
};

const PROPERTY = /^(?:--[^\s:]+|-?[a-z_][a-z0-9_-]*)$/i;
const IMPORTANT = /!\s*important\s*$/i;

/**
 * Reads the declarations of a `style` attribute, or of a rule's block. A declaration without a property, a colon or
 * a value is left out, as is one with a block in it, such as a nested rule.
 */
export const parseDeclarations = (css: string): readonly Declaration[] =>
    splitTopLevel(withoutComments(css), ";").flatMap((text): readonly Declaration[] => {
        const colon = splitTopLevel(text, ":")[0].length;
        const property = text.slice(0, colon).trim();
        const written = text.slice(colon + 1).trim();
        const important = IMPORTANT.test(written);
        const value = important ? written.replace(IMPORTANT, "").trim() : written;
        if (colon === text.length || !PROPERTY.test(property) || value === "" || value.includes("{")) {
            return [];
        }
        return [{ property: property.startsWith("--") ? property : property.toLowerCase(), value, important }];
    });

/**
 * Whether a media query list, such as that of `@media` or of a `<style media>`, is for print: a list is when one of
 * its queries is for print, or for all media without conditions, as docx/html writes a document to be printed. A
 * query that only holds on screens of some width can't be known, and isn't.
 */
export const isForPrint = (media: string): boolean =>
    media.trim() === "" ||
    splitTopLevel(media.toLowerCase(), ",").some((query) => {
        const words = query
            .trim()
            .replace(/^only\s+/, "")
            .split(/\s+/);
        return words[0] === "print" || (words.length === 1 && words[0] === "all");
    });

// The rules in these at-rules' blocks are used: @media's when it is for print (see isForPrint), and @supports' and
// @layer's, as the features docx/html reads are supported, and layers only change the order of the rules
const GROUPING_RULES: ReadonlySet<string> = new Set(["media", "supports", "layer"]);

/**
 * Reads the style rules of a style sheet, in order, with those in `@media` blocks for print, and in `@supports` and
 * `@layer` blocks. Other at-rules, such as `@import`, `@font-face` and `@page`, are left out, as are rules whose
 * selectors are empty and the HTML comment marks a style sheet in a `<style>` can have.
 */
export const parseStyleSheet = (css: string): readonly StyleRule[] => rulesOf(withoutComments(css));

const rulesOf = (css: string): readonly StyleRule[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const rules: StyleRule[] = [];
    let index = 0;
    while (index < css.length) {
        const blockStart = indexOfTopLevel(css, index, "{;");
        // CSS's CDO and CDC tokens, which a style sheet in an old <style> has around it, separate what is either side
        const prelude = css.slice(index, blockStart).split("<!--").join(" ").split("-->").join(" ").trim();
        if (css[blockStart] !== "{") {
            // A statement at-rule, such as @import, or what is left at the end
            index = blockStart + 1;
            continue;
        }
        const blockEnd = indexOfTopLevel(css, blockStart + 1, "}");
        const block = css.slice(blockStart + 1, blockEnd);
        index = blockEnd + 1;

        const atRule = /^@([a-z-]+)\s*([^]*)$/i.exec(prelude);
        if (atRule) {
            const [, name, condition] = atRule;
            if (GROUPING_RULES.has(name.toLowerCase()) && (name.toLowerCase() !== "media" || isForPrint(condition))) {
                // eslint-disable-next-line functional/immutable-data
                rules.push(...rulesOf(block));
            }
        } else if (prelude !== "") {
            // eslint-disable-next-line functional/immutable-data
            rules.push({ selectors: prelude, declarations: parseDeclarations(block) });
        }
    }
    return rules;
};

/** The index of the first of the characters given, from `start`, that isn't in a string or brackets, or the length */
const indexOfTopLevel = (css: string, start: number, characters: string): number =>
    start + splitTopLevel(css.slice(start), characters)[0].length;
