/**
 * Lays out equations (`m:oMath`) of text, as Word lays them out in Cambria Math: letters in italic, digits and operators
 * upright, each as wide as Cambria Math draws it, with Word's italic correction after an italic letter and the spaces
 * TeX puts between atoms, as scripts/layout-probes/word-equations.ts and word-equations2.ts showed. An equation of more
 * than text, such as one with a fraction, a script or a root, which Word builds up, stops the layout.
 *
 * @module
 */
// cspell:ignore oMath fName funcPr nabla
import { type XmlObject, attributesOf, childrenOf, find, isObject, pointsOf } from "../text-layout";
import { CAMBRIA_MATH_WIDTHS, EQUATION_WIDTHS } from "./equation-widths";

/** An equation laid out in its line: how wide it is, and how far it goes above its baseline and below it, in points */
export type EquationBox = { readonly width: number; readonly ascent: number; readonly descent: number };

// Cambria Math's line, as Word lays out a line of an equation, in its 2048 units: 1946 above the baseline and 455 below,
// with the text's (`word-equations.docx` EQ2, `word-equations2.docx` EQ9)
const ASCENT = 1946 / 2048;
const DESCENT = 455 / 2048;

/**
 * What an atom of an equation is to the spaces between it and the ones next to it, as TeX names them, and the bars and
 * slashes, which Word puts no space beside, but adds an italic letter's italic correction before. A symbol Word hasn't
 * been seen to space, such as an arrow, a set operator or a sign of logic, is unseen: TeX spaces them by what they are,
 * which Word may not
 */
type AtomClass = "ordinary" | "binary" | "relation" | "open" | "close" | "punctuation" | "fence" | "unseen";

// The binary operators, relations, brackets, punctuation, bars and slashes Word has been seen to space
// (`word-equations2.docx` EQ7)
const CLASSES: ReadonlyMap<string, AtomClass> = new Map([
    ...[..."+−±∓×÷⋅∗∘"].map((character) => [character, "binary"] as const),
    ...[..."=<>≤≥≠≈≡∼→←"].map((character) => [character, "relation"] as const),
    ...[..."([{"].map((character) => [character, "open"] as const),
    ...[...")]}"].map((character) => [character, "close"] as const),
    ...[...",;:!?"].map((character) => [character, "punctuation"] as const),
    ...[..."|/"].map((character) => [character, "fence"] as const),
]);

/**
 * The space between two atoms, in eighteenths of an em, as TeX puts it and Word's PDFs showed: 4 either side of a binary
 * operator, 5 either side of a relation, 3 after punctuation, and none between ordinary atoms, two relations, or beside a
 * bracket, a bar or a slash (`word-equations.docx` EQ1, `word-equations2.docx` EQ7, EQ8). Pairs not here, such as a
 * bracket after an operator, Word hasn't been seen to space
 */
const SPACES: ReadonlyMap<string, number> = new Map([
    ["ordinary ordinary", 0],
    ["ordinary binary", 4],
    ["binary ordinary", 4],
    ["ordinary relation", 5],
    ["relation ordinary", 5],
    ["close relation", 5],
    ["relation relation", 0],
    ["ordinary punctuation", 0],
    ["punctuation ordinary", 3],
    ["ordinary open", 0],
    ["open ordinary", 0],
    ["ordinary close", 0],
    ["close open", 0],
    ["ordinary fence", 0],
    ["fence ordinary", 0],
    ["close fence", 0],
]);

/** A character of an equation, as Word draws it: its width and its italic correction, in ems, and what it is */
type Atom = {
    /** The character of the equation's text */
    readonly character: string;
    readonly width: number;
    readonly italicCorrection: number;
    readonly kind: AtomClass;
    /** Whether it is an italic letter, after which Word adds its italic correction unless an ordinary atom follows */
    readonly italic: boolean;
    /** Whether it is a space, which Word draws as wide as Cambria Math's, and spaces the atoms either side of as if it weren't */
    readonly space?: boolean;
    /** Whether Word draws it in italic, but how it adds its italic correction before what isn't ordinary hasn't been seen */
    readonly unknownCorrection?: boolean;
    /** The size its run's own formatting gives it, in points, if any */
    readonly size?: number;
};

// The first of Unicode's mathematical italic alphabets. Its small h is Planck's constant, U+210E, which the block leaves
// out. Word draws Greek capitals in italic too (`word-equations2.docx` EQ6G)
const ITALIC_CAPITAL = 0x1d434;
const ITALIC_SMALL = 0x1d44e;
const ITALIC_GREEK_CAPITAL = 0x1d6e2;
const ITALIC_GREEK_SMALL = 0x1d6fc;
const PLANCK = 0x210e;
// What Word draws in place of an apostrophe, the partial differential sign and nabla: a prime, and the italic signs,
// which are as wide as Word drew them before a letter (`word-equations2.docx` EQ7g)
const DRAWN_AS: ReadonlyMap<string, string> = new Map([
    ["'", "′"],
    ["∂", "\u{1d715}"],
    ["∇", "\u{1d6fb}"],
]);
const ITALIC_SIGNS = new Set(["∂", "∇"]);
// The Greek variants, and the italic letters Word draws for them (`word-stops-equations.docx` EQ27j)
const GREEK_VARIANTS: ReadonlyMap<string, number> = new Map([
    ["ϵ", 0x1d716],
    ["ϑ", 0x1d717],
    ["ϰ", 0x1d718],
    ["ϕ", 0x1d719],
    ["ϱ", 0x1d71a],
    ["ϖ", 0x1d71b],
]);

// Cambria Math's own widths, by character, in thousandths of an em, read from CAMBRIA_MATH_WIDTHS the first time one is
// needed
let cambriaMath: ReadonlyMap<string, number> | undefined;
/** How wide Cambria Math has a character Word draws as it is, in thousandths of an em, when it has it */
const cambriaMathWidth = (character: string): number | undefined => {
    cambriaMath ??= new Map(
        CAMBRIA_MATH_WIDTHS.split(";").flatMap((run) => {
            const [first, widths] = run.split(":");
            return widths
                .split(",")
                .map((width, offset) => [String.fromCodePoint(parseInt(first, 36) + offset), (parseInt(width, 36) / 2048) * 1000] as const);
        }),
    );
    return cambriaMath.get(character);
};

/** The character Word draws for one of an equation's text, and whether it is an italic letter, in italic unless plain */
const drawnAs = (character: string, plain: boolean): { readonly drawn: string; readonly italic: boolean } => {
    const code = character.codePointAt(0)!;
    const letter = (first: number, offset: number): { readonly drawn: string; readonly italic: boolean } =>
        plain ? { drawn: character, italic: false } : { drawn: String.fromCodePoint(first + offset), italic: true };
    if (character === "h") {
        return letter(PLANCK, 0);
    }
    if (/^[a-z]$/.test(character)) {
        return letter(ITALIC_SMALL, code - 0x61);
    }
    if (/^[A-Z]$/.test(character)) {
        return letter(ITALIC_CAPITAL, code - 0x41);
    }
    if (code >= 0x3b1 && code <= 0x3c9) {
        return letter(ITALIC_GREEK_SMALL, code - 0x3b1);
    }
    if (GREEK_VARIANTS.has(character)) {
        return letter(GREEK_VARIANTS.get(character)!, 0);
    }
    return code >= 0x391 && code <= 0x3a9
        ? letter(ITALIC_GREEK_CAPITAL, code - 0x391)
        : { drawn: DRAWN_AS.get(character) ?? character, italic: false };
};

/** The text in an element, such as `m:t`'s */
const textOf = (element: unknown): string =>
    (Array.isArray(element) ? element : [element]).filter((part): part is string => typeof part === "string").join("");

// What of a run's own formatting (`w:rPr`) Word has been seen to follow in an equation: its size (EQ9e)
const RUN_SIZES = new Set(["w:sz", "w:szCs"]);

/** The atoms of a run of an equation (`m:r`), or why it can't be laid out */
const atomsOfRun = (run: unknown): readonly Atom[] | string => {
    const children = childrenOf(run);
    const properties = childrenOf(find(children, "m:rPr"));
    const style = attributesOf(find(properties, "m:sty"))["m:val"];
    const formatting = childrenOf(find(children, "w:rPr"));
    if (formatting.some((child) => !RUN_SIZES.has(Object.keys(child)[0]))) {
        return "an equation whose text has formatting of its own";
    }
    if (
        find(properties, "m:nor") !== undefined ||
        find(properties, "m:scr") !== undefined ||
        (style !== undefined && style !== "p" && style !== "i")
    ) {
        return "an equation in normal text, another alphabet or bold";
    }
    const text = children
        .filter((child) => "m:t" in child)
        .map((child) => textOf(child["m:t"]))
        .join("");
    const drawn = [...text].map((character) => ({ character, ...drawnAs(character, style === "p") }));
    // Those Word's PDFs measured, and the others Cambria Math has that Word draws as they are, as wide as it has them, with
    // no italic correction (`word-stops-equations.docx` EQ27)
    const widthOf = (shown: string): readonly [number, number] | undefined => {
        const own = cambriaMathWidth(shown);
        return EQUATION_WIDTHS.get(shown) ?? (own === undefined ? undefined : [own, 0]);
    };
    if (drawn.some(({ drawn: shown }) => widthOf(shown) === undefined)) {
        return "a character in an equation whose width isn't known";
    }
    // Its size, in half-points, as a run's text is, which Word draws its equation in (EQ9e)
    const size = pointsOf(attributesOf(find(formatting, "w:sz"))["w:val"], 2);
    return drawn.map(({ character, drawn: shown, italic }) => {
        const [width, italicCorrection] = widthOf(shown)!;
        // A symbol of Cambria Math's own that isn't a letter or digit, which Word hasn't been seen to space
        const unseen = !EQUATION_WIDTHS.has(shown) && !/^[\p{L}\p{N}]$/u.test(shown);
        return {
            character,
            width: width / 1000,
            italicCorrection: italicCorrection / 1000,
            italic,
            kind: CLASSES.get(character) ?? (unseen ? "unseen" : "ordinary"),
            ...(character === " " ? { space: true } : {}),
            ...(ITALIC_SIGNS.has(character) ? { unknownCorrection: true } : {}),
            ...(size === undefined ? {} : { size }),
        };
    });
};

// The space after a function's name, in eighteenths of an em
const THIN_SPACE = 3;
// What an equation may have in it that takes no room: its properties, bookmarks, and proofing marks
const IGNORED = new Set(["m:oMathPr", "m:ctrlPr", "m:funcPr", "w:bookmarkStart", "w:bookmarkEnd", "w:proofErr", "_attr"]);
const BUILT_UP = "an equation with a fraction, a script, a root or another part Word builds up";

/**
 * The atoms of the parts of an equation in turn: its runs, and a function (`m:func`), as its name, a space of 3
 * eighteenths, and its argument, as Word puts them (`word-equations.docx` EQ1z, `word-equations2.docx` EQ8e), when it is
 * all of the equation. Why it can't be laid out, for anything else, such as a fraction or a script, which Word builds up
 * in ways not yet followed
 */
const atomsOf = (parts: readonly XmlObject[], alone: boolean): readonly (Atom | number)[] | string =>
    parts.reduce<readonly (Atom | number)[] | string>((atoms, part) => {
        const [name] = Object.keys(part);
        if (typeof atoms === "string" || IGNORED.has(name)) {
            return atoms;
        }
        if (name === "m:r") {
            const run = atomsOfRun(part[name]);
            return typeof run === "string" ? run : [...atoms, ...run];
        }
        if (name !== "m:func" || !alone) {
            return BUILT_UP;
        }
        const children = childrenOf(part[name]);
        const functionName = atomsOf(childrenOf(find(children, "m:fName")), false);
        const argument = atomsOf(childrenOf(find(children, "m:e")), false);
        if (typeof functionName === "string" || typeof argument === "string") {
            return typeof functionName === "string" ? functionName : (argument as string);
        }
        return [...atoms, ...functionName, THIN_SPACE, ...argument];
    }, []);

const OPERATORS_TOGETHER = "an equation with operators next to each other, which Word spaces in a way not yet followed";

/**
 * The classes of an equation's atoms, past its spaces, as Word spaces them: a binary operator at the start, or after
 * another operator, a relation, an opening bracket or punctuation, is an ordinary atom, as in TeX (`word-equations.docx`
 * EQ1n, `word-equations2.docx` EQ8c), and a full stop between digits is a decimal point (EQ1i). Or why Word's spacing
 * isn't known: an operator before a relation, a bracket, punctuation or the end, which Word spaces unlike TeX
 * (`word-equations.docx` EQ1x), and a full stop elsewhere
 */
const classesOf = (atoms: readonly Atom[]): readonly AtomClass[] | string =>
    atoms.reduce<readonly AtomClass[] | string>((classes, atom, index) => {
        if (typeof classes === "string") {
            return classes;
        }
        const digit = (other: Atom | undefined): boolean => /^\d$/.test(other?.character ?? "");
        if (atom.character === "." && (!digit(atoms[index - 1]) || !digit(atoms[index + 1]))) {
            return "a full stop in an equation other than a decimal point";
        }
        const previous = classes[index - 1];
        const unary = atom.kind === "binary" && (previous === undefined || !["ordinary", "close", "fence"].includes(previous));
        const next = atoms[index + 1]?.kind;
        if (atom.kind === "binary" && (next === undefined || (next !== "ordinary" && (unary || next !== "binary")))) {
            return OPERATORS_TOGETHER;
        }
        return [...classes, unary ? "ordinary" : atom.kind];
    }, []);

/**
 * Lays out an equation (`m:oMath`) of text at a size, in points, or the size its runs give: how wide it is, and how far it
 * goes above and below its baseline, as a line of Cambria Math (`word-equations.docx` EQ2, `word-equations2.docx` EQ9). It
 * is as wide as its characters, the spaces between its atoms, and each italic letter's italic correction, which Word adds
 * unless an ordinary atom, such as a letter, a digit or a prime, follows it (EQ1d, EQ1t, EQ7g, EQ8a, EQ8b), as before an
 * operator, a bracket, punctuation, a bar, a slash, a space and its end (EQ1, EQ7). Or why it can't be laid out: atoms
 * Word hasn't been seen to space, runs of different sizes, and an italic sign whose italic correction Word hasn't shown
 */
export const layOutEquation = (equation: unknown, size: number): EquationBox | string => {
    const parts = childrenOf(equation).filter(isObject);
    const all = atomsOf(parts, parts.filter((part) => !IGNORED.has(Object.keys(part)[0])).length === 1);
    if (typeof all === "string") {
        return all;
    }
    const atoms = all.filter((atom): atom is Atom => typeof atom !== "number" && !atom.space);
    if (atoms.length === 0) {
        // Word shows a placeholder for an equation with nothing in it
        return "an empty equation";
    }
    const sizes = new Set(all.flatMap((atom) => (typeof atom === "number" ? [] : [atom.size ?? size])));
    if (sizes.size > 1) {
        return "an equation whose runs are of different sizes";
    }
    if (atoms.length > 1 && atoms.some(({ kind }) => kind === "unseen")) {
        return "a symbol in an equation beside another, where Word hasn't been seen to space it";
    }
    const classes = classesOf(atoms);
    if (typeof classes === "string") {
        return classes;
    }
    let width = 0;
    let previous: AtomClass | undefined;
    // The spaces between atoms, such as a function's, added to the space between them
    let between = 0;
    for (const [position, atom] of all.entries()) {
        if (typeof atom === "number" || atom.space) {
            between += typeof atom === "number" ? atom : 0;
            width += typeof atom === "number" ? 0 : atom.width;
            continue;
        }
        const index = atoms.indexOf(atom);
        const kind = classes[index];
        if (previous !== undefined) {
            const space = SPACES.get(`${previous} ${kind}`);
            if (space === undefined) {
                return OPERATORS_TOGETHER;
            }
            width += (space + between) / 18;
        }
        between = 0;
        width += atom.width;
        const following = all[position + 1];
        const beforeOrdinary = typeof following === "object" && !following.space && classes[index + 1] === "ordinary";
        if (atom.unknownCorrection && !beforeOrdinary) {
            return "an italic sign in an equation before what isn't ordinary, such as a letter or digit";
        }
        width += atom.italic && !beforeOrdinary ? atom.italicCorrection : 0;
        previous = kind;
    }
    const [drawnSize] = sizes;
    return { width: width * drawnSize, ascent: ASCENT * drawnSize, descent: DESCENT * drawnSize };
};
