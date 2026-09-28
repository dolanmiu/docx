/**
 * Reads LaTeX math into atoms: rows of cells, as a matrix or aligned equations have them, or one row of one cell.
 *
 * @module
 */
// cspell:ignore alignedat brack emph eqnarray flalign hdashline hline mathbb mathbf mathfrak mathrm mathsf mathtt multline nolimits notag textbf textmd textrm textsf textsl texttt
import { type MathComponent, MathFraction, type MathFractionType, MathLimitLower, MathLimitUpper, MathRadical, MathRun } from "docx";

import { MathAccent } from "../math-accent";
import { MathBar } from "../math-bar";
import { MathBox, type MathBoxStrike } from "../math-box";
import { MathBrace } from "../math-brace";
import { MathBrackets } from "../math-brackets";
import { MathCases } from "../math-cases";
import { MathEquationArray } from "../math-equation-array";
import { type MathColumnAlignment, MathMatrix, type MathMatrixBrackets } from "../math-matrix";
import { MathPhantom, type MathPhantomOptions } from "../math-phantom";
import { type Atom, type AtomWithLimits, type Font, atomsToMath, orSpace } from "./latex-atoms";
import {
    ACCENT_COMMANDS,
    BRACE_COMMANDS,
    CHARACTERS,
    DELIMITER_CHARACTERS,
    DELIMITER_COMMANDS,
    EXTENSIBLE_ARROWS,
    FUNCTIONS,
    FUNCTIONS_WITH_LIMITS,
    ITALIC_GREEK,
    LARGE_OPERATOR_COMMANDS,
    NEGATIONS,
    QUAD,
    SPACES,
    SYMBOLS,
    type SymbolRole,
    THICK_SPACE,
    UPRIGHT_GREEK,
    hasEntry,
    roleOf,
} from "./latex-symbols";

/** A row of a matrix or of aligned equations: its cells, and its equation number from `\tag` */
export type Row = {
    readonly cells: readonly (readonly Atom[])[];
    readonly tag?: string;
};

type Token =
    | { readonly type: "command"; readonly name: string; readonly start: number }
    | { readonly type: "character"; readonly value: string; readonly start: number };

/** The commands that end a list of atoms, for what comes before it to take */
const LIST_ENDS: ReadonlySet<string> = new Set(["right", "middle", "end", "\\"]);

const TEXT_COMMANDS: ReadonlySet<string> = new Set([
    "text",
    "textrm",
    "textnormal",
    "textup",
    "textmd",
    "textbf",
    "textit",
    "textsl",
    "textsf",
    "texttt",
    "emph",
    "mbox",
    "hbox",
]);

const plainOrBold = (font: Font): Font["style"] => (font.style === "bold" || font.style === "boldItalic" ? "bold" : "plain");

/** Commands that write their argument in a font, and what each does to the font around it */
const FONT_COMMANDS: Readonly<Record<string, (font: Font) => Font>> = {
    mathrm: () => ({ style: "plain" }),
    mathup: () => ({ style: "plain" }),
    mathnormal: () => ({}),
    mathit: () => ({ style: "italic" }),
    mathbf: (font) => ({ script: font.script, style: "bold" }),
    bold: (font) => ({ script: font.script, style: "bold" }),
    boldsymbol: (font) => ({ script: font.script, style: "boldItalic" }),
    bm: (font) => ({ script: font.script, style: "boldItalic" }),
    pmb: (font) => ({ script: font.script, style: "boldItalic" }),
    mathbb: (font) => ({ script: "doubleStruck", style: plainOrBold(font) }),
    Bbb: (font) => ({ script: "doubleStruck", style: plainOrBold(font) }),
    mathcal: (font) => ({ script: "script", style: plainOrBold(font) }),
    mathscr: (font) => ({ script: "script", style: plainOrBold(font) }),
    mathfrak: (font) => ({ script: "fraktur", style: plainOrBold(font) }),
    mathsf: (font) => ({ script: "sansSerif", style: plainOrBold(font) }),
    mathtt: (font) => ({ script: "monospace", style: plainOrBold(font) }),
};

/** The old commands that change the font for the rest of their group, such as `{\bf x}` */
const FONT_SWITCHES: Readonly<Record<string, string>> = {
    rm: "mathrm",
    bf: "mathbf",
    it: "mathit",
    sf: "mathsf",
    tt: "mathtt",
    cal: "mathcal",
};

/** Commands written between a numerator and a denominator, such as `{a \over b}` */
const INFIX_FRACTIONS: Readonly<Record<string, { readonly type?: MathFractionType; readonly brackets?: readonly [string, string] }>> = {
    over: {},
    atop: { type: "noBar" },
    choose: { type: "noBar", brackets: ["(", ")"] },
    brace: { type: "noBar", brackets: ["{", "}"] },
    brack: { type: "noBar", brackets: ["[", "]"] },
};

/** Commands that are nothing to Word: sizes, spacing it works out itself, and labels */
const IGNORED: ReadonlySet<string> = new Set([
    "displaystyle",
    "textstyle",
    "scriptstyle",
    "scriptscriptstyle",
    "nonumber",
    "notag",
    "limits",
    "nolimits",
    "allowbreak",
    "nobreak",
    "hline",
    "hdashline",
    "/",
]);

/** Commands that are nothing to Word and take an argument, which is left out */
const IGNORED_WITH_ARGUMENT: ReadonlySet<string> = new Set(["label", "cline", "color"]);

const MATRIX_BRACKETS: Readonly<Record<string, MathMatrixBrackets>> = {
    matrix: "none",
    smallmatrix: "none",
    pmatrix: "round",
    bmatrix: "square",
    Bmatrix: "curly",
    vmatrix: "verticalBars",
    Vmatrix: "doubleVerticalBars",
};

const ALIGNED_ENVIRONMENTS: ReadonlySet<string> = new Set([
    "align",
    "aligned",
    "alignat",
    "alignedat",
    "flalign",
    "eqnarray",
    "split",
    "gather",
    "gathered",
    "multline",
]);

/** Environments that hold one equation, and are only numbered with `\tag` */
const EQUATION_ENVIRONMENTS: ReadonlySet<string> = new Set(["equation", "displaymath", "math"]);

const COLUMN_ALIGNMENTS: Readonly<Record<string, MathColumnAlignment>> = { l: "left", c: "center", r: "right" };

const PRIMES = ["′", "″", "‴", "⁗"];

/** What LaTeX writes for some characters typed next to each other in text, such as an en dash for -- */
const LIGATURES: readonly (readonly [string, string])[] = [
    ["---", "—"],
    ["--", "–"],
    ["``", "“"],
    ["''", "”"],
    ["`", "‘"],
    ["'", "’"],
    ["~", "\u00A0"],
];

/**
 * Math of rows: aligned equations, each row's cells as the parts lined up at their `&`s, with its number.
 */
export const equationArrayOf = (rows: readonly Row[]): MathEquationArray =>
    new MathEquationArray({ rows: rows.map(({ cells, tag }) => ({ parts: cells.map(atomsToMath), equationNumber: tag })) });

/**
 * Reads the LaTeX from `from` to `to` in `source` into rows of cells.
 *
 * @throws If the LaTeX has a command, an environment or a character it doesn't know, or isn't well formed
 */
export const parseLatex = (source: string, from: number, to: number): readonly Row[] => {
    let index = from;

    const fail = (problem: string, at: number = index): never => {
        const start = Math.max(from, at - 30);
        const end = Math.min(to, at + 30);
        const excerpt = `${start > from ? "…" : ""}${source.slice(start, end)}${end < to ? "…" : ""}`;
        throw new Error(`latexToMath: ${problem}, at character ${at + 1} of "${excerpt}"`);
    };

    const skipSpace = (): void => {
        while (index < to) {
            if (source[index] === "%") {
                while (index < to && source[index] !== "\n") {
                    index++;
                }
            } else if (/\s/.test(source[index])) {
                index++;
            } else {
                return;
            }
        }
    };

    const tokenAt = (at: number): { readonly token: Token; readonly next: number } | undefined => {
        if (at >= to) {
            return undefined;
        }
        if (source[at] === "\\") {
            if (at + 1 >= to) {
                return fail("a backslash ends the LaTeX, with no command after it", at);
            }
            const letters = /^[a-zA-Z]+/.exec(source.slice(at + 1, to));
            if (letters) {
                return { token: { type: "command", name: letters[0], start: at }, next: at + 1 + letters[0].length };
            }
            const escaped = String.fromCodePoint(source.codePointAt(at + 1)!);
            return { token: { type: "command", name: /\s/.test(escaped) ? " " : escaped, start: at }, next: at + 1 + escaped.length };
        }
        const character = String.fromCodePoint(source.codePointAt(at)!);
        return { token: { type: "character", value: character, start: at }, next: at + character.length };
    };

    const peek = (): Token | undefined => {
        skipSpace();
        return tokenAt(index)?.token;
    };

    const next = (): Token | undefined => {
        skipSpace();
        const read = tokenAt(index);
        if (read !== undefined) {
            index = read.next;
        }
        return read?.token;
    };

    const isCharacter = (token: Token | undefined, value: string): boolean => token?.type === "character" && token.value === value;

    const isCommand = (token: Token | undefined, name: string): boolean => token?.type === "command" && token.name === name;

    /** Reads a star after a command, as in `\operatorname*` */
    const readStar = (): boolean => {
        if (isCharacter(peek(), "*")) {
            next();
            return true;
        }
        return false;
    };

    /** Reads what is between braces as it is, such as an environment's name */
    const readRawGroup = (what: string): string => {
        skipSpace();
        if (source[index] !== "{") {
            return fail(`${what} needs an argument in braces`);
        }
        const start = index;
        let depth = 0;
        for (; index < to; index++) {
            if (source[index] === "\\") {
                index++;
            } else if (source[index] === "{") {
                depth++;
            } else if (source[index] === "}" && --depth === 0) {
                index++;
                return source.slice(start + 1, index - 1).trim();
            }
        }
        return fail(`${what}'s argument has no closing }`, start);
    };

    /** Reads what is between square brackets as it is, such as `\smash[t]`'s option, if there are any */
    const readRawOption = (): string | undefined => {
        skipSpace();
        if (source[index] !== "[") {
            return undefined;
        }
        const end = source.indexOf("]", index);
        if (end === -1 || end >= to) {
            return fail("a [ has no closing ]");
        }
        const option = source.slice(index + 1, end).trim();
        index = end + 1;
        return option;
    };

    const text = (value: string, font: Font, role: SymbolRole = "ordinary"): Atom => ({ kind: "text", text: value, font, role });

    const isPlainFont = (font: Font): boolean => font.style === undefined && font.script === undefined && !font.normalText;

    /** Says what is wrong with a token that ends a list where it can't */
    const unexpected = (token: Token): never => {
        if (isCharacter(token, "&") || isCommand(token, "\\")) {
            return fail(
                `${token.type === "command" ? "a \\\\" : "an &"} can only go between the rows and cells of a matrix or of aligned equations, not inside braces, brackets or \\left and \\right`,
                token.start,
            );
        }
        if (isCharacter(token, "}")) {
            return fail("a } has no { before it", token.start);
        }
        return token.type === "command" && token.name !== "end"
            ? fail(`\\${token.name} has no \\left before it`, token.start)
            : fail("\\end has no \\begin before it", token.start);
    };

    /** Reads the closing character of what a list is in, or says what is wrong */
    const readClosing = (end: Token | undefined, closing: string, what: string, at: number): void => {
        if (isCharacter(end, closing)) {
            next();
            return;
        }
        if (end === undefined) {
            fail(`${what} has no closing ${closing}`, at);
        }
        unexpected(end!);
    };

    // The parser proper. Each reads from where the last left off

    /**
     * Reads atoms up to the end of their list: a closing brace, a `&` or `\\`, `\right`, `\middle` or `\end`, the
     * closing character given, or the end of the LaTeX. The token at the end isn't read.
     */
    const parseList = (outer: Font, closing?: string): { readonly atoms: readonly Atom[]; readonly end: Token | undefined } => {
        let atoms: readonly Atom[] = [];
        let font = outer;
        let infix: { readonly name: string; readonly numerator: readonly Atom[] } | undefined;

        for (let token = peek(); token !== undefined; token = peek()) {
            if (token.type === "character" && (token.value === "}" || token.value === "&" || token.value === closing)) {
                break;
            }
            if (token.type === "command" && LIST_ENDS.has(token.name)) {
                break;
            }
            if (token.type === "command" && hasEntry(FONT_SWITCHES, token.name)) {
                next();
                font = FONT_COMMANDS[FONT_SWITCHES[token.name]](font);
                continue;
            }
            if (token.type === "command" && hasEntry(INFIX_FRACTIONS, token.name)) {
                next();
                if (infix !== undefined) {
                    fail(`\\${token.name} follows \\${infix.name} in the same group. Put one of them in braces`, token.start);
                }
                infix = { name: token.name, numerator: atoms };
                atoms = [];
                continue;
            }
            atoms = [...atoms, ...parseAtom(font)];
        }

        if (infix === undefined) {
            return { atoms, end: peek() };
        }
        const { type, brackets } = INFIX_FRACTIONS[infix.name];
        const fraction = new MathFraction({
            numerator: orSpace(atomsToMath(infix.numerator)),
            denominator: orSpace(atomsToMath(atoms)),
            type,
        });
        return {
            atoms: [
                {
                    kind: "built",
                    component: brackets ? new MathBrackets({ open: brackets[0], close: brackets[1], children: [fraction] }) : fraction,
                },
            ],
            end: peek(),
        };
    };

    /**
     * Reads a command's argument: a group in braces, or one token, such as the 1 and 2 of `\frac12`.
     */
    const readArgument = (font: Font, what: string): readonly Atom[] => {
        const token = peek();
        if (
            token === undefined ||
            (token.type === "character" && ["}", "&", "^", "_"].includes(token.value)) ||
            (token.type === "command" && LIST_ENDS.has(token.name))
        ) {
            return fail(`${what} needs an argument`, token?.start ?? index);
        }
        if (isCharacter(token, "{")) {
            next();
            const { atoms, end } = parseList(font);
            readClosing(end, "}", `${what}'s argument`, token.start);
            return atoms;
        }
        const atom = parsePrimary(font, false);
        return atom === undefined ? [] : [atom];
    };

    /** Reads an argument in square brackets, as `\sqrt[3]{x}` has, if there is one */
    const readOptionalArgument = (font: Font, what: string): readonly Atom[] | undefined => {
        skipSpace();
        if (source[index] !== "[") {
            return undefined;
        }
        const start = index;
        index++;
        const { atoms, end } = parseList(font, "]");
        readClosing(end, "]", `${what}'s option`, start);
        return atoms;
    };

    const readMath = (font: Font, what: string): readonly MathComponent[] => atomsToMath(readArgument(font, what));

    /** Reads an atom, and the subscripts, superscripts and primes after it */
    const parseAtom = (font: Font): readonly Atom[] => {
        const base = parsePrimary(font, true);
        if (base === undefined) {
            return [];
        }

        let sub: readonly Atom[] | undefined;
        let sup: readonly Atom[] | undefined;
        let primes = 0;
        for (let token = peek(); token?.type === "character"; token = peek()) {
            if (token.value === "'") {
                if (sup !== undefined) {
                    fail("a prime follows a superscript. Put the prime first, as in f'^2", token.start);
                }
                next();
                primes++;
            } else if (token.value === "^") {
                if (sup !== undefined) {
                    fail("there are two superscripts in a row. Put them in braces, as in x^{ab}", token.start);
                }
                next();
                sup = readArgument(font, "^");
            } else if (token.value === "_") {
                if (sub !== undefined) {
                    fail("there are two subscripts in a row. Put them in braces, as in x_{ab}", token.start);
                }
                next();
                sub = readArgument(font, "_");
            } else {
                break;
            }
        }
        const superscript = primes === 0 ? sup : [text(PRIMES[primes - 1] ?? "′".repeat(primes), font), ...(sup ?? [])];

        if (sub === undefined && superscript === undefined) {
            return [base];
        }
        if (base.kind === "operator" || base.kind === "function") {
            return [{ ...base, sub, sup: superscript }];
        }
        return [{ kind: "scripts", base: base.kind === "group" ? base.atoms : [base], sub, sup: superscript }];
    };

    /**
     * Reads one atom, without its scripts, or nothing for a command that writes nothing. Digits are read as one number
     * when `numbers` is true, but not in an argument of one token, as the 1 and 2 of `\frac12`.
     */
    const parsePrimary = (font: Font, numbers: boolean): Atom | undefined => {
        const token = next()!;
        if (token.type === "command") {
            return parseCommand(token, font);
        }

        const { value } = token;
        switch (value) {
            case "{": {
                const { atoms, end } = parseList(font);
                readClosing(end, "}", "a {", token.start);
                return { kind: "group", atoms };
            }
            case "^":
            case "_":
            case "'":
                // Scripts with nothing before them, as in {}^{14}C, go on an empty base
                index = token.start;
                return { kind: "group", atoms: [] };
            case "~":
                return text("\u00A0", font);
            case "$":
                return fail("a $ can only end math that is in \\text", token.start);
            default:
                break;
        }
        if (numbers && /\d/.test(value)) {
            const [digits] = /^\d*(?:\.\d+)*/.exec(source.slice(index, to))!;
            index += digits.length;
            return text(value + digits, font);
        }
        const character = CHARACTERS.get(value);
        return character === undefined ? text(value, font, roleOf(value)) : text(character.text, font, character.role);
    };

    /** Reads `\limits` or `\nolimits` after a large operator or function, if there is one */
    const readLimits = (): "aboveBelow" | "side" | undefined => {
        const token = peek();
        if (isCommand(token, "limits")) {
            next();
            return "aboveBelow";
        }
        if (isCommand(token, "nolimits")) {
            next();
            return "side";
        }
        return undefined;
    };

    const functionAtom = (name: readonly Atom[], limitsBelow: boolean): AtomWithLimits => {
        const limits = readLimits();
        return { kind: "function", name, limitsBelow: limits === undefined ? limitsBelow : limits === "aboveBelow" };
    };

    /** Reads a delimiter, for `\left`, `\right`, `\middle` and `\big` */
    const readDelimiter = (what: string): string => {
        const token = next();
        if (token === undefined) {
            return fail(`${what} needs a delimiter after it, such as ( or \\langle`);
        }
        if (token.type === "command") {
            return DELIMITER_COMMANDS.get(token.name) ?? fail(`${what} can't take \\${token.name}, which isn't a delimiter`, token.start);
        }
        const role = roleOf(token.value);
        return (
            DELIMITER_CHARACTERS.get(token.value) ??
            (role === "open" || role === "close"
                ? token.value
                : fail(`${what} can't take "${token.value}", which isn't a delimiter`, token.start))
        );
    };

    const parseLeftRight = (font: Font, start: number): Atom => {
        const open = readDelimiter("\\left");
        let items: readonly (readonly Atom[])[] = [];
        let separators: readonly string[] = [];
        for (;;) {
            const { atoms, end } = parseList(font);
            items = [...items, atoms];
            if (isCommand(end, "middle")) {
                next();
                separators = [...separators, readDelimiter("\\middle")];
            } else if (isCommand(end, "right")) {
                next();
                break;
            } else if (end === undefined) {
                return fail("\\left has no \\right", start);
            } else {
                unexpected(end);
            }
        }
        const close = readDelimiter("\\right");
        const converted = items.map(atomsToMath);

        if (converted.length === 1) {
            return { kind: "built", component: new MathBrackets({ open, close, children: converted[0] }) };
        }
        if (separators.every((separator) => separator === separators[0])) {
            return { kind: "built", component: new MathBrackets({ open, close, separator: separators[0], items: converted }) };
        }
        // Word has one separator for each pair of brackets, so others are written as text
        return {
            kind: "built",
            component: new MathBrackets({
                open,
                close,
                children: converted.flatMap((item, itemIndex) =>
                    itemIndex === 0 ? item : [new MathRun(separators[itemIndex - 1]), ...item],
                ),
            }),
        };
    };

    /** Reads `\text` and its like: normal text, which can hold math between dollar signs */
    const parseText = (what: string): readonly Atom[] => {
        const font: Font = { normalText: true };
        skipSpace();
        if (source[index] !== "{") {
            const token = next();
            return token?.type === "character" ? [text(token.value, font)] : fail(`${what} needs an argument`);
        }
        const start = index;
        index++;

        let atoms: readonly Atom[] = [];
        let written = "";
        let depth = 0;
        const flush = (): void => {
            if (written !== "") {
                atoms = [...atoms, text(written, font)];
                written = "";
            }
        };

        for (;;) {
            if (index >= to) {
                return fail(`${what}'s argument has no closing }`, start);
            }
            const character = source[index];
            if (character === "}") {
                index++;
                if (depth === 0) {
                    break;
                }
                depth--;
            } else if (character === "{") {
                index++;
                depth++;
            } else if (character === "$") {
                flush();
                index++;
                const { atoms: math, end } = parseList({}, "$");
                readClosing(end, "$", "math in text", index);
                atoms = [...atoms, ...math];
            } else if (character === "\\") {
                // A backslash is always read as a command
                const { token, next: after } = tokenAt(index) as {
                    readonly token: Extract<Token, { readonly type: "command" }>;
                    readonly next: number;
                };
                const { name } = token;
                index = after;
                if (/^[a-zA-Z]+$/.test(name)) {
                    // A command's name ends at a space, which isn't written
                    while (index < to && /[ \t]/.test(source[index])) {
                        index++;
                    }
                }
                if (TEXT_COMMANDS.has(name)) {
                    flush();
                    atoms = [...atoms, ...parseText(`\\${name}`)];
                } else if (SPACES.has(name)) {
                    written += name === " " ? " " : SPACES.get(name);
                } else if (["&", "%", "$", "#", "_", "{", "}"].includes(name)) {
                    written += name;
                } else if (name === "textbackslash") {
                    written += "\\";
                } else if (name === "ldots" || name === "dots" || name === "textellipsis") {
                    written += "…";
                } else {
                    fail(`unknown command \\${name} in text`, token.start);
                }
            } else if (/\s/.test(character)) {
                // Spaces, including a line break, are one space, as in LaTeX
                written += written.endsWith(" ") ? "" : " ";
                index++;
            } else {
                const at = index;
                const ligature = LIGATURES.find(([characters]) => source.startsWith(characters, at));
                const typed = ligature ? ligature[0] : String.fromCodePoint(source.codePointAt(index)!);
                written += ligature ? ligature[1] : typed;
                index += typed.length;
            }
        }
        flush();
        return atoms;
    };

    /** Reads the rows and cells of an environment, or of the whole LaTeX when `environment` is undefined */
    const parseRows = (font: Font, environment: string | undefined, begin: number): readonly Row[] => {
        let rows: readonly Row[] = [];
        let cells: readonly (readonly Atom[])[] = [];

        const endRow = (): void => {
            const tags = cells.flatMap((cell) => cell.filter((atom) => atom.kind === "tag"));
            const row = { cells: cells.map((cell) => cell.filter((atom) => atom.kind !== "tag")) };
            rows = [...rows, tags.length === 0 ? row : { ...row, tag: (tags[tags.length - 1] as { readonly text: string }).text }];
            cells = [];
        };

        for (;;) {
            const { atoms, end } = parseList(font);
            cells = [...cells, atoms];
            if (isCharacter(end, "&")) {
                next();
            } else if (isCommand(end, "\\")) {
                next();
                readRawOption();
                endRow();
            } else {
                endRow();
                if (environment === undefined) {
                    if (end !== undefined) {
                        unexpected(end);
                    }
                } else if (isCommand(end, "end")) {
                    next();
                    const name = readRawGroup("\\end");
                    if (name !== environment) {
                        fail(`\\begin{${environment}} ends with \\end{${name}}`, end!.start);
                    }
                } else if (end === undefined) {
                    fail(`\\begin{${environment}} has no \\end{${environment}}`, begin);
                } else {
                    unexpected(end);
                }
                break;
            }
        }

        // A \\ at the end starts no row, as in LaTeX
        const last = rows[rows.length - 1];
        return rows.length > 1 && last.tag === undefined && last.cells.length === 1 && last.cells[0].length === 0
            ? rows.slice(0, -1)
            : rows;
    };

    const parseEnvironment = (font: Font, start: number): Atom | undefined => {
        const name = readRawGroup("\\begin");
        const base = name.replace(/\*$/, "");
        const cellsOf = (rows: readonly Row[]): readonly (readonly (readonly MathComponent[])[])[] =>
            rows.map(({ cells }) => cells.map(atomsToMath));

        if (hasEntry(MATRIX_BRACKETS, base)) {
            // mathtools' pmatrix* and the like take the columns' alignment
            const alignment = name.endsWith("*") ? readRawOption() : undefined;
            const rows = parseRows(font, name, start);
            return {
                kind: "built",
                component: new MathMatrix({
                    brackets: MATRIX_BRACKETS[base],
                    rows: cellsOf(rows),
                    columnAlignment: hasEntry(COLUMN_ALIGNMENTS, alignment ?? "c")
                        ? COLUMN_ALIGNMENTS[alignment ?? "c"]
                        : fail(`\\begin{${name}} can't line its columns up "${alignment}"`, start),
                }),
            };
        }
        if (base === "array" || base === "subarray") {
            readRawOption();
            const specification = [
                ...readRawGroup(`\\begin{${name}}`)
                    .replace(/[@!]\{[^}]*\}/g, "")
                    .replace(/[pmb]\{[^}]*\}/g, "l"),
            ]
                .map((letter) => COLUMN_ALIGNMENTS[letter])
                .filter((alignment) => alignment !== undefined);
            const rows = parseRows(font, name, start);
            const columns = Math.max(...rows.map(({ cells }) => cells.length));
            return {
                kind: "built",
                component: new MathMatrix({
                    rows: cellsOf(rows),
                    columnAlignment: Array.from({ length: columns }, (_, column) => specification[column] ?? "center"),
                }),
            };
        }
        if (base === "cases" || base === "dcases") {
            const rows = parseRows(font, name, start);
            return {
                kind: "built",
                component: new MathCases({
                    cases: rows.map(({ cells }, row) => {
                        if (cells.length > 2) {
                            fail(
                                `case ${row + 1} of \\begin{${name}} has ${cells.length} parts, but a case has at most two: its value & its condition`,
                                start,
                            );
                        }
                        const [value, condition] = cells.map(atomsToMath);
                        return condition === undefined ? { value } : { value, condition };
                    }),
                }),
            };
        }
        if (base === "rcases" || base === "drcases") {
            const rows = parseRows(font, name, start);
            return {
                kind: "built",
                component: new MathBrackets({
                    open: "",
                    close: "}",
                    children: [new MathMatrix({ rows: cellsOf(rows), columnAlignment: "left" })],
                }),
            };
        }
        if (ALIGNED_ENVIRONMENTS.has(base) || EQUATION_ENVIRONMENTS.has(base)) {
            if (base === "alignat" || base === "alignedat") {
                // The number of columns, which Word works out itself
                readRawGroup(`\\begin{${name}}`);
            }
            const rows = parseRows(font, name, start);
            return EQUATION_ENVIRONMENTS.has(base) && rows.length === 1 && rows[0].cells.length === 1 && rows[0].tag === undefined
                ? { kind: "group", atoms: rows[0].cells[0] }
                : { kind: "built", component: equationArrayOf(rows) };
        }
        return fail(`unknown environment ${name}`, start);
    };

    const parseCommand = (token: Extract<Token, { readonly type: "command" }>, font: Font): Atom | undefined => {
        const { name, start } = token;
        const what = `\\${name}`;

        if (name === "&" || name === "#") {
            // Taken as it is, not as a point equations line up at, or where their number goes
            return text(name, { ...font, literal: true });
        }
        if (hasEntry(UPRIGHT_GREEK, name)) {
            return text(UPRIGHT_GREEK[name], isPlainFont(font) ? { style: "plain" } : font);
        }
        if (hasEntry(ITALIC_GREEK, name)) {
            return text(ITALIC_GREEK[name], isPlainFont(font) ? { style: "italic" } : font);
        }
        const symbol = SYMBOLS.get(name);
        if (symbol !== undefined) {
            return text(symbol.text, font, symbol.role);
        }
        const width = SPACES.get(name);
        if (width !== undefined) {
            return width === "" ? undefined : text(width, font);
        }
        if (hasEntry(FUNCTIONS, name)) {
            return functionAtom([text(FUNCTIONS[name], { style: "plain" })], false);
        }
        if (hasEntry(FUNCTIONS_WITH_LIMITS, name)) {
            return functionAtom([text(FUNCTIONS_WITH_LIMITS[name], { style: "plain" })], true);
        }
        if (hasEntry(LARGE_OPERATOR_COMMANDS, name)) {
            return { kind: "operator", operator: LARGE_OPERATOR_COMMANDS[name], limits: readLimits() };
        }
        if (hasEntry(ACCENT_COMMANDS, name)) {
            return { kind: "built", component: new MathAccent({ accent: ACCENT_COMMANDS[name], children: readMath(font, what) }) };
        }
        if (hasEntry(FONT_COMMANDS, name)) {
            return { kind: "group", atoms: readArgument(FONT_COMMANDS[name](font), what) };
        }
        if (TEXT_COMMANDS.has(name)) {
            return { kind: "group", atoms: parseText(what) };
        }
        if (hasEntry(BRACE_COMMANDS, name)) {
            const { brace, position } = BRACE_COMMANDS[name];
            const children = readMath(font, what);
            // Its label is the script on its other side, as in \underbrace{x+y}_{n}
            const labelled = isCharacter(peek(), position === "above" ? "^" : "_");
            if (labelled) {
                next();
            }
            const label = labelled ? readMath(font, what) : undefined;
            return { kind: "built", component: new MathBrace({ brace, position, children, label }) };
        }
        if (hasEntry(EXTENSIBLE_ARROWS, name)) {
            const below = readOptionalArgument(font, what);
            const above = orSpace(readMath(font, what));
            const arrow = new MathLimitUpper({ children: [new MathRun(EXTENSIBLE_ARROWS[name])], limit: above });
            return {
                kind: "built",
                role: "relation",
                component: below === undefined ? arrow : new MathLimitLower({ children: [arrow], limit: orSpace(atomsToMath(below)) }),
            };
        }
        if (/^[Bb]igg?[lrm]?$/.test(name)) {
            const delimiter = readDelimiter(what);
            const roles: Readonly<Record<string, SymbolRole>> = { l: "open", r: "close", m: "relation" };
            return delimiter === "" ? undefined : text(delimiter, font, roles[name[name.length - 1]] ?? roleOf(delimiter));
        }
        if (IGNORED.has(name)) {
            return undefined;
        }
        if (IGNORED_WITH_ARGUMENT.has(name)) {
            readRawGroup(what);
            return undefined;
        }

        switch (name) {
            case "frac":
            case "dfrac":
            case "tfrac":
            case "cfrac":
            case "nicefrac":
            case "sfrac": {
                if (name === "cfrac") {
                    readRawOption();
                }
                const numerator = orSpace(readMath(font, what));
                const denominator = orSpace(readMath(font, what));
                return {
                    kind: "built",
                    component: new MathFraction({
                        numerator,
                        denominator,
                        type: name === "nicefrac" || name === "sfrac" ? "skewed" : undefined,
                    }),
                };
            }
            case "binom":
            case "dbinom":
            case "tbinom": {
                const numerator = orSpace(readMath(font, what));
                const denominator = orSpace(readMath(font, what));
                return {
                    kind: "built",
                    component: new MathBrackets({ children: [new MathFraction({ numerator, denominator, type: "noBar" })] }),
                };
            }
            case "sqrt": {
                const degree = readOptionalArgument(font, what);
                const children = orSpace(readMath(font, what));
                return {
                    kind: "built",
                    component: new MathRadical(
                        degree === undefined || degree.length === 0 ? { children } : { children, degree: atomsToMath(degree) },
                    ),
                };
            }
            case "left":
                return parseLeftRight(font, start);
            case "overline":
            case "underline":
                return {
                    kind: "built",
                    component: new MathBar({ position: name === "overline" ? "above" : "below", children: readMath(font, what) }),
                };
            case "overset":
            case "stackrel":
            case "underset": {
                const limit = orSpace(readMath(font, what));
                const base = readArgument(font, what);
                const children = orSpace(atomsToMath(base));
                return {
                    kind: "built",
                    role: name === "stackrel" ? "relation" : base.length === 1 && base[0].kind === "text" ? base[0].role : "ordinary",
                    component: name === "underset" ? new MathLimitLower({ children, limit }) : new MathLimitUpper({ children, limit }),
                };
            }
            case "operatorname": {
                const below = readStar();
                return functionAtom(readArgument({ style: "plain" }, what), below);
            }
            case "boxed":
                return { kind: "built", component: new MathBox({ children: readMath(font, what) }) };
            case "fbox":
                return { kind: "built", component: new MathBox({ children: atomsToMath(parseText(what)) }) };
            case "cancel":
            case "bcancel":
            case "xcancel": {
                const strikes: Readonly<Record<string, readonly MathBoxStrike[]>> = {
                    cancel: ["diagonalUp"],
                    bcancel: ["diagonalDown"],
                    xcancel: ["diagonalUp", "diagonalDown"],
                };
                return { kind: "built", component: new MathBox({ borders: [], strikes: strikes[name], children: readMath(font, what) }) };
            }
            case "phantom":
            case "hphantom":
            case "vphantom":
            case "smash": {
                const option = name === "smash" ? readRawOption() : undefined;
                const phantoms: Readonly<Record<string, Omit<MathPhantomOptions, "children">>> = {
                    phantom: {},
                    hphantom: { height: false, depth: false },
                    vphantom: { width: false },
                    smash: { visible: true, height: option === "b", depth: option === "t" },
                };
                return { kind: "built", component: new MathPhantom({ ...phantoms[name], children: readMath(font, what) }) };
            }
            case "mathstrut":
                return { kind: "built", component: new MathPhantom({ width: false, children: [new MathRun("(")] }) };
            case "textcolor":
                // Word's math has no colour of its own, so the text is written in the document's
                readRawGroup(what);
                return { kind: "group", atoms: readArgument(font, what) };
            case "mathop":
            case "mathbin":
            case "mathrel":
            case "mathord":
            case "mathopen":
            case "mathclose":
            case "mathpunct":
            case "mathinner":
                return { kind: "group", atoms: readArgument(font, what) };
            case "not": {
                const negation = (relation: string): Atom => text(NEGATIONS.get(relation) ?? `${relation}\u0338`, font, "relation");
                const negated = peek();
                if (negated?.type === "character" && !["{", "}", "^", "_", "&", "$"].includes(negated.value)) {
                    next();
                    return negation(CHARACTERS.get(negated.value)?.text ?? negated.value);
                }
                if (negated?.type === "command" && SYMBOLS.has(negated.name)) {
                    next();
                    return negation(SYMBOLS.get(negated.name)!.text);
                }
                return fail("\\not needs a symbol after it, such as \\not= or \\not\\in", start);
            }
            case "bmod":
            case "mod":
                return {
                    kind: "group",
                    atoms: [text(name === "mod" ? QUAD : THICK_SPACE, font), text("mod", { style: "plain" }), text(THICK_SPACE, font)],
                };
            case "pmod":
            case "pod": {
                const argument = readArgument(font, what);
                return {
                    kind: "group",
                    atoms: [
                        text(QUAD, font),
                        text("(", font, "open"),
                        ...(name === "pmod" ? [text("mod", { style: "plain" }), text(THICK_SPACE, font)] : []),
                        ...argument,
                        text(")", font, "close"),
                    ],
                };
            }
            case "hspace": {
                readStar();
                readRawGroup(what);
                return text(QUAD, font);
            }
            case "substack": {
                skipSpace();
                if (source[index] !== "{") {
                    return fail("\\substack needs an argument in braces");
                }
                const open = index;
                index++;
                let rows: readonly (readonly Atom[])[] = [];
                for (;;) {
                    const { atoms, end } = parseList(font);
                    rows = [...rows, atoms];
                    if (isCommand(end, "\\")) {
                        next();
                    } else {
                        readClosing(end, "}", "\\substack's argument", open);
                        break;
                    }
                }
                return { kind: "built", component: new MathMatrix({ rows: rows.map((row) => [atomsToMath(row)]) }) };
            }
            case "tag": {
                const star = readStar();
                const tag = readRawGroup(what).replace(/\$/g, "");
                return { kind: "tag", text: star ? tag : `(${tag})` };
            }
            case "begin":
                return parseEnvironment(font, start);
            default:
                return fail(`unknown command ${what}`, start);
        }
    };

    return parseRows({}, undefined, from);
};
