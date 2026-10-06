/**
 * Lays out equations (`m:oMath`) as Word does, in Cambria Math, by the rules of the font's OpenType MATH table, which
 * Word's maths layout follows: letters in italic, digits and operators upright, each as wide as Cambria Math draws it,
 * with its italic correction after it and the spaces TeX puts between atoms; and fractions, scripts, roots, sums,
 * brackets, matrices, accents, bars, functions, limits, braces, boxes, equation arrays and phantoms built up by the
 * table's constants, each part as tall as its ink. Word's PDFs of scripts/layout-probes/word-equations.ts,
 * word-equations2.ts, word-stops-equations.ts, word-stops-equations2.ts and word-stops-equations3.ts showed where Word
 * draws each glyph, to within its grid of 1/300 inch, and how tall it makes the line: as tall as the ink of the equation,
 * with Cambria Math's line gap (300 of its 2048 units) above it, or as a line of Cambria Math, whichever is the taller.
 *
 * Where Word's PDFs haven't shown how it builds up a part, the layout stops at it, for why.
 *
 * @module
 */
// cspell:ignore oMath fName funcPr nabla limLoc subHide supHide degHide begChr endChr sepChr mcJc baseJc plcHide noBar ssty
// cspell:ignore limLow limUpp groupChr borderBox eqArr sPre undOvr subSup mcPr mPr dPr naryPr accPr barPr radPr fPr strikeBLTR strikeTLBR
// cspell:ignore phant transp aln hideTop hideBot hideLeft hideRight zeroWid zeroAsc zeroDesc
import { type XmlObject, attributesOf, childrenOf, find, isOff, pointsOf } from "../text-layout";
import {
    CHARACTER_RUNS,
    EXTENDED_SHAPES,
    FLATTENED_ACCENTS,
    GLYPH_METRICS,
    HORIZONTAL_ASSEMBLIES,
    HORIZONTAL_VARIANTS,
    ITALIC_CORRECTIONS,
    MATH_CONSTANTS,
    MATH_KERNS,
    MIN_CONNECTOR_OVERLAP,
    SCRIPT_GLYPHS,
    TOP_ACCENT_ATTACHMENTS,
    VERTICAL_VARIANTS,
} from "./cambria-math";

/** An equation laid out in its line: how wide it is, and how far it goes above its baseline and below it, in points */
export type EquationBox = { readonly width: number; readonly ascent: number; readonly descent: number };

/**
 * Where a displayed sum's and integral's limits go, under and over it (`undOvr`) or beside it (`subSup`), when its own
 * properties don't say (`m:limLoc`): as the document's maths settings say (`m:naryLim`, `m:intLim`), sums' under and over
 * them and integrals' beside them unless they say otherwise
 */
export type LimitPlaces = { readonly sums: "undOvr" | "subSup"; readonly integrals: "undOvr" | "subSup" };

// Cambria Math's units to the em
const UNITS = 2048;
// Cambria Math's line, as Word lays out a line of an equation, in its units: 1946 above the baseline and 455 below, with
// the text's (`word-equations.docx` EQ2, `word-equations2.docx` EQ9)
const ASCENT = 1946;
const DESCENT = 455;

/** Why the layout stops at an equation */
class Stop extends Error {}

const stop = (reason: string): never => {
    throw new Stop(reason);
};

const BUILT_UP = "an equation with a part Word builds up in a way not yet followed";

// ---- The font

/** The glyph Cambria Math draws for each character */
const GLYPHS: ReadonlyMap<number, number> = new Map(
    CHARACTER_RUNS.flatMap(([code, glyph, count]) => Array.from({ length: count }, (_, index) => [code + index, glyph + index] as const)),
);

const glyphOf = (character: string): number =>
    GLYPHS.get(character.codePointAt(0)!) ?? stop("a character in an equation Cambria Math doesn't have");

/** A glyph at a size, in points */
type Glyph = { readonly glyph: number; readonly size: number };

/** A glyph's width, and the bottom, top, left and right of its ink, in Cambria Math's units */
const metricsOf = (glyph: number): readonly [number, number, number, number, number] => GLYPH_METRICS.get(glyph)!;

/**
 * A glyph's kerning at a corner, beside a script, at a height, in its units: corners 0 to 3 are its top right, top left,
 * bottom right and bottom left
 */
const kernAt = (glyph: number, corner: number, height: number): number => {
    const kern = MATH_KERNS.get(glyph)?.[corner];
    if (!kern) {
        return 0;
    }
    const [heights, values] = kern;
    const index = heights.findIndex((above) => height < above);
    return values[index === -1 ? heights.length : index];
};

// ---- Styles and sizes

/**
 * How a part of an equation is laid out, as TeX's styles are: its level, 0 for a displayed equation, 1 for one in a line
 * of text, 2 for a script and 3 for a script's script; whether it is cramped, as a denominator or a lower limit is, with
 * its superscripts lower; whether the equation is displayed; and the equation's size, in points
 */
type Style = {
    readonly level: 0 | 1 | 2 | 3;
    readonly cramped: boolean;
    readonly display: boolean;
    readonly size: number;
    /** Where the document puts the limits of sums and integrals that don't say where theirs go */
    readonly limits: LimitPlaces;
};

/**
 * The size of a script, or a script's script, in points: 73% and 60% of the equation's, rounded down to the half point,
 * as Word draws them: 8 and 6.5 points at 11, 6.5 and 5 at 9, 7.5 and 6 at 10.5, and 8.5 and 7 at 12
 * (`word-stops-equations.docx` EQ10, EQ11, `word-stops-equations2.docx` EQ30, where where Word puts each glyph shows the
 * size it lays it out in)
 */
const scriptSize = (size: number, percent: number): number => Math.floor((size * percent) / 50) / 2;

const sizeOf = (style: Style): number =>
    style.level < 2
        ? style.size
        : scriptSize(style.size, style.level === 2 ? MATH_CONSTANTS.scriptPercentScaleDown : MATH_CONSTANTS.scriptScriptPercentScaleDown);

/** A length of Cambria Math's units in points at a style's size */
const inPoints = (units: number, style: Style): number => (units * sizeOf(style)) / UNITS;

/** A constant of the MATH table in points at a style's size */
const constantOf = (name: keyof typeof MATH_CONSTANTS, style: Style): number => inPoints(MATH_CONSTANTS[name], style);

/**
 * The style of a script: a script's, or a script's script's, cramped when its base is, or when it is a lower limit, as
 * TeX's are, but not for being a subscript (`word-stops-equations2.docx` EQ31c, `word-stops-equations3.docx` EQ50)
 */
const scriptStyle = (style: Style, lower = false): Style => ({
    ...style,
    level: style.level < 2 ? 2 : 3,
    ...(lower ? { cramped: true } : {}),
});

const cramp = (style: Style): Style => ({ ...style, cramped: true });

// ---- Boxes

/**
 * What an atom is to the spaces between it and the ones next to it, as TeX names them, with the bars and slashes, which
 * Word puts no space beside, as `fence`
 */
type AtomClass = "ordinary" | "operator" | "binary" | "relation" | "open" | "close" | "punctuation" | "inner" | "fence";

/**
 * A part of an equation laid out, in points: how wide it is, without its italic correction, how far its ink goes above
 * and below its baseline, its italic correction, its first and last glyphs, which scripts are kerned with, and where an
 * accent goes over it
 */
type Box = {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
    readonly italic: number;
    /** Whether it is characters only, which scripts are put beside as beside a glyph, but for a shape grown to a size */
    readonly characters: boolean;
    /** Whether it is one glyph that is a shape grown to a size, such as a tall integral */
    readonly extended?: boolean;
    readonly first?: Glyph;
    readonly last?: Glyph;
};

/** A part of a row of an equation: an atom of a run, or a part Word builds up, and what it is to the spaces beside it */
type Part = {
    readonly box: Box;
    readonly kind: AtomClass;
    /** What it is to the spaces after it, where that isn't its kind, as for a sum, an operator before its argument */
    readonly after?: AtomClass;
    /** The character, for an atom of a run */
    readonly character?: string;
    /** Whether it is a space typed in the equation, which Word draws as wide as Cambria Math's, and spaces the atoms either side of as if it weren't */
    readonly space?: boolean;
    /** Whether it is an operator that isn't binary where it is: before a relation, after another operator, or at the start */
    readonly unary?: boolean;
    /** Whether it is the part of a transparent phantom, which Word hasn't been seen to space as it is or as an ordinary atom */
    readonly transparent?: boolean;
};

const glyphBox = (glyph: number, size: number): Box => {
    const [width, bottom, top] = metricsOf(glyph);
    const scale = size / UNITS;
    return {
        width: width * scale,
        height: top * scale,
        depth: -bottom * scale,
        italic: (ITALIC_CORRECTIONS.get(glyph) ?? 0) * scale,
        characters: true,
        ...(EXTENDED_SHAPES.has(glyph) ? { extended: true } : {}),
        first: { glyph, size },
        last: { glyph, size },
    };
};

// ---- Characters

// The binary operators, relations, brackets, punctuation, bars and slashes Word has been seen to space, set operators,
// logic and arrows among them, and the dots, which it spaces as TeX's inner atom (`word-equations2.docx` EQ7,
// `word-stops-equations.docx` EQ20, `word-stops-equations2.docx` EQ39, `word-stops-equations3.docx` EQ52)
const CLASSES: ReadonlyMap<string, AtomClass> = new Map([
    ...[..."+−±∓×÷⋅∗∘∪∩∧∨⊕⊗∖"].map((character) => [character, "binary"] as const),
    ...[..."=<>≤≥≠≈≡∼→←⇒⇔⟹∈∉⊂⊃⊆↦∝"].map((character) => [character, "relation"] as const),
    ...[..."([{⌊"].map((character) => [character, "open"] as const),
    ...[...")]}⌋"].map((character) => [character, "close"] as const),
    ...[...",;:!?."].map((character) => [character, "punctuation"] as const),
    ...[..."|/"].map((character) => [character, "fence"] as const),
    ["⋯", "inner"],
]);

// The signs Word's PDFs showed as ordinary atoms beside letters and operators: the prime, infinity, the partial
// differential sign and nabla, the zero-width space LaTeX's empty base is written as, "for all", "not" and "there exists"
// (`word-equations2.docx` EQ7, `word-stops-equations.docx` EQ11e, `word-stops-equations2.docx` EQ39h, EQ39o,
// `word-stops-equations3.docx` EQ52f)
const SIGNS = new Set([..."'\u2032\u221e\u2202\u2207\u200b\u2200\u00ac\u2203"]);

// Large operators written as text rather than as n-ary operators (`m:nary`), which Word's PDFs showed only next to
// themselves, with no space between them and an integral's italic correction after it (`word-stops-equations.docx` EQ27k)
const LARGE_OPERATORS = new Set([..."\u2211\u220f\u2210\u222b\u222c\u222d\u222e\u222f\u2230\u22c2\u22c3\u2a00\u2a01\u2a02"]);

// Spaces typed in an equation, which Word draws as wide as Cambria Math's, and spaces the atoms either side of as if they
// weren't there (`word-equations.docx` EQ1s, `word-stops-equations.docx` EQ13b, EQ21c)
const SPACES = new Set([..." \u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u205f"]);

// The alphabets of Unicode's mathematical alphanumerics Word draws a run's letters in, by the run's alphabet (`m:scr`) and
// style (`m:sty`): the first capital and small letter of each. A letter an alphabet doesn't have is in Unicode's
// letterlike symbols (`word-stops-equations.docx` EQ19)
type Alphabet = { readonly capital: number; readonly small?: number; readonly greek?: readonly [number, number] };
const ALPHABETS: ReadonlyMap<string, Alphabet> = new Map([
    ["roman b", { capital: 0x1d400, small: 0x1d41a, greek: [0x1d6a8, 0x1d6c2] }],
    ["roman i", { capital: 0x1d434, small: 0x1d44e, greek: [0x1d6e2, 0x1d6fc] }],
    ["roman bi", { capital: 0x1d468, small: 0x1d482, greek: [0x1d71c, 0x1d736] }],
    ["script p", { capital: 0x1d49c, small: 0x1d4b6 }],
    ["fraktur p", { capital: 0x1d504, small: 0x1d51e }],
    ["double-struck p", { capital: 0x1d538, small: 0x1d552 }],
]);
// The digits Word draws a run's digits as, by its alphabet and style: as they are, upright, in a plain or italic run, and
// Unicode's mathematical bold digits in a bold or bold italic one, and its double-struck ones (`word-stops-equations2.docx`
// EQ45): the first of each. Digits in other alphabets haven't been seen
const DIGITS: ReadonlyMap<string, number> = new Map([
    ["roman i", 0x30],
    ["roman b", 0x1d7ce],
    ["roman bi", 0x1d7ce],
    ["double-struck p", 0x1d7d8],
]);
// The letters Unicode puts among its letterlike symbols rather than the mathematical alphabets
const LETTERLIKE: ReadonlyMap<number, number> = new Map([
    [0x1d455, 0x210e],
    [0x1d49d, 0x212c],
    [0x1d4a0, 0x2130],
    [0x1d4a1, 0x2131],
    [0x1d4a3, 0x210b],
    [0x1d4a4, 0x2110],
    [0x1d4a7, 0x2112],
    [0x1d4a8, 0x2133],
    [0x1d4ad, 0x211b],
    [0x1d4ba, 0x212f],
    [0x1d4bc, 0x210a],
    [0x1d4c4, 0x2134],
    [0x1d506, 0x212d],
    [0x1d50b, 0x210c],
    [0x1d50c, 0x2111],
    [0x1d515, 0x211c],
    [0x1d51d, 0x2128],
    [0x1d53a, 0x2102],
    [0x1d53f, 0x210d],
    [0x1d545, 0x2115],
    [0x1d547, 0x2119],
    [0x1d548, 0x211a],
    [0x1d549, 0x211d],
    [0x1d551, 0x2124],
]);
// The Greek symbols Word draws in italic, as Unicode's mathematical italic ones: ϵ, ϑ, ϰ, ϕ, ϱ and ϖ, and ∂ and ∇, which it
// draws in italic in any run (`word-equations2.docx` EQ7g, `word-stops-equations.docx` EQ14e, EQ27j)
const ITALIC_SYMBOLS: ReadonlyMap<string, number> = new Map([
    ["ϵ", 0x1d716],
    ["ϑ", 0x1d717],
    ["ϰ", 0x1d718],
    ["ϕ", 0x1d719],
    ["ϱ", 0x1d71a],
    ["ϖ", 0x1d71b],
]);
// What Word draws in place of an apostrophe, the partial differential sign and nabla: a prime, and the italic signs
const DRAWN_AS: ReadonlyMap<string, string> = new Map([
    ["'", "′"],
    ["∂", "\u{1d715}"],
    ["∇", "\u{1d6fb}"],
]);

/**
 * The character Word draws for one of a run's text, in the run's alphabet and style: Latin and Greek letters in italic,
 * unless the run is plain (`m:sty` "p"), and in a mathematical alphabet where the run gives one. Or why it can't be laid
 * out: an alphabet or style Word hasn't been seen drawing
 */
const drawnAs = (character: string, alphabet: string, style: string | undefined): string => {
    const code = character.codePointAt(0)!;
    const latin = /^[A-Za-z]$/.test(character);
    const greek = (code >= 0x391 && code <= 0x3a9) || (code >= 0x3b1 && code <= 0x3c9);
    if (alphabet === "roman" && style === "p") {
        return DRAWN_AS.get(character) ?? character;
    }
    if (!latin && !greek) {
        if (alphabet === "roman" && (style === undefined || style === "i") && ITALIC_SYMBOLS.has(character)) {
            return String.fromCodePoint(ITALIC_SYMBOLS.get(character)!);
        }
        if (/^\d$/.test(character)) {
            const digits = DIGITS.get(`${alphabet} ${style ?? (alphabet === "roman" ? "i" : "p")}`);
            return digits === undefined
                ? stop("an equation in an alphabet or style Word hasn't been seen drawing")
                : String.fromCodePoint(digits + code - 0x30);
        }
        return DRAWN_AS.get(character) ?? character;
    }
    const found = ALPHABETS.get(`${alphabet} ${style ?? (alphabet === "roman" ? "i" : "p")}`);
    if (found === undefined || (greek && found.greek === undefined)) {
        return stop("an equation in an alphabet or style Word hasn't been seen drawing");
    }
    const lettered = greek
        ? code >= 0x3b1
            ? found.greek![1] + code - 0x3b1
            : found.greek![0] + code - 0x391
        : /[A-Z]/.test(character)
          ? found.capital + code - 0x41
          : found.small! + code - 0x61;
    return String.fromCodePoint(LETTERLIKE.get(lettered) ?? lettered);
};

// ---- Runs

/** The text in an element, such as `m:t`'s */
const textOf = (element: unknown): string =>
    (Array.isArray(element) ? element : [element]).filter((part): part is string => typeof part === "string").join("");

// What of a run's own formatting (`w:rPr`) Word has been seen to follow in an equation, its size (`word-equations2.docx`
// EQ9e), or to leave as it is: bold, and the spacing of its characters (`word-stops-equations.docx` EQ28)
const RUN_SIZES = new Set(["w:sz", "w:szCs"]);
const RUN_IGNORED = new Set(["w:b", "w:bCs", "w:spacing"]);

/** The size a run's own formatting gives its text, in points, if any */
const runSizeOf = (run: unknown): number | undefined => {
    const formatting = childrenOf(find(childrenOf(run), "w:rPr"));
    return pointsOf(attributesOf(find(formatting, "w:sz"))["w:val"], 2);
};

/** Lays out the atoms of a run (`m:r`) in a style */
const atomsOfRun = (run: unknown, style: Style): readonly Part[] => {
    const children = childrenOf(run);
    const properties = childrenOf(find(children, "m:rPr"));
    const formatting = childrenOf(find(children, "w:rPr"));
    if (formatting.some((child) => !RUN_SIZES.has(Object.keys(child)[0]) && !RUN_IGNORED.has(Object.keys(child)[0]))) {
        stop("an equation whose text has formatting of its own");
    }
    const text = children
        .filter((child) => "m:t" in child)
        .map((child) => textOf(child["m:t"]))
        .join("");
    // Normal text, which Word draws in the paragraph's font (`word-stops-equations.docx` EQ19a), isn't measured with the
    // equation
    if (find(properties, "m:nor") !== undefined && !isOff(attributesOf(find(properties, "m:nor"))["m:val"])) {
        stop("an equation with normal text (`m:nor`)");
    }
    const alphabet = String(attributesOf(find(properties, "m:scr"))["m:val"] ?? "roman");
    const sty = attributesOf(find(properties, "m:sty"))["m:val"] as string | undefined;
    const size = runSizeOf(run);
    const runStyle: Style = size === undefined || style.level > 1 ? style : { ...style, size };
    if (size !== undefined && style.level > 1) {
        stop("an equation whose script's run has a size of its own");
    }
    const characters = [...text];
    return characters.map((character, at) => {
        if (SPACES.has(character)) {
            return { box: glyphBox(glyphOf(character), sizeOf(runStyle)), kind: "ordinary", character, space: true };
        }
        const drawn = drawnAs(character, alphabet, sty);
        const plain = glyphOf(drawn);
        const alternates = runStyle.level > 1 ? SCRIPT_GLYPHS.get(plain) : undefined;
        const glyph = alternates === undefined ? plain : alternates[Math.min(runStyle.level - 2, alternates.length - 1)];
        // A full stop between digits is a decimal point, and punctuation elsewhere (`word-equations.docx` EQ1i,
        // `word-stops-equations.docx` EQ21)
        const decimal = character === "." && /^\d$/.test(characters[at - 1] ?? "") && /^\d$/.test(characters[at + 1] ?? "");
        return { box: glyphBox(glyph, sizeOf(runStyle)), kind: decimal ? "ordinary" : (CLASSES.get(character) ?? "ordinary"), character };
    });
};

// ---- Rows

// The space TeX puts between two atoms, in eighteenths of an em, by their classes: ordinary, operator (a sum's or a
// function's), binary, relation, opening, closing, punctuation and inner (a fraction's, or the dots'), as Word has been
// seen to: none between ordinary atoms, 4 either side of a binary operator, 5 either side of a relation, 3 after
// punctuation and after a function's name or a sum, 3 beside a fraction or the dots next to an ordinary atom, a bracket,
// a bar, punctuation after it or another fraction, and 3 before a function or a sum, after a letter, a digit, a fraction
// or a closing bracket, and none beside a bracket, a bar or a slash otherwise (`word-equations.docx` EQ1,
// `word-equations2.docx` EQ7, EQ8, `word-stops-equations.docx` EQ13, EQ17, EQ20, `word-stops-equations2.docx` EQ32,
// `word-stops-equations3.docx` EQ51, EQ52j). A negative space is one TeX leaves out in a script
const TEX_CLASSES: readonly AtomClass[] = ["ordinary", "operator", "binary", "relation", "open", "close", "punctuation", "inner"];
const TEX_SPACES: readonly (readonly number[])[] = [
    [0, 3, -4, -5, 0, 0, 0, -3],
    [3, 3, 0, -5, 0, 0, 0, -3],
    [-4, -4, 0, 0, -4, 0, 0, -4],
    [-5, -5, 0, 0, -5, 0, 0, -5],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, -4, -5, 0, 0, 0, -3],
    [-3, -3, 0, -3, -3, -3, -3, -3],
    [-3, 3, -4, -5, -3, 0, -3, -3],
];

/** TeX's space between atoms of two classes, in eighteenths of an em, in a style */
const texSpace = (before: AtomClass, after: AtomClass, style: Style): number => {
    const of = (kind: AtomClass): number => TEX_CLASSES.indexOf(kind === "fence" ? "ordinary" : kind);
    const space = TEX_SPACES[of(before)][of(after)];
    return space < 0 ? (style.level > 1 ? 0 : -space) : space;
};

/**
 * The space between two parts of a row, in eighteenths of an em: TeX's, but none between an operator that isn't binary
 * and a relation after it (`word-stops-equations.docx` EQ20a)
 */
const spaceBetween = (previous: Part, next: Part, style: Style): number => {
    const before = previous.unary ? "ordinary" : (previous.after ?? previous.kind);
    return previous.unary && next.kind === "relation" ? 0 : texSpace(before, next.kind, style);
};

// The atoms after which a binary operator is binary, rather than unary, as Word has been seen to space them
const OPERANDS = new Set<AtomClass>(["ordinary", "close", "fence", "inner"]);
// The atoms before which an operator isn't binary: a relation, a closing bracket, punctuation and the end of its row
// (`word-stops-equations.docx` EQ20a, EQ27f)
const ENDS = new Set<AtomClass | undefined>(["relation", "close", "punctuation", undefined]);

/**
 * The classes of a row's atoms, past its spaces, as Word spaces them: a binary operator between operands, an operator
 * that isn't binary among them, is binary, and one at the start, or after another operator, a relation, an opening
 * bracket or punctuation, or before a relation, bracket, punctuation or the end, is unary, an ordinary atom with no space
 * either side (`word-equations.docx` EQ1n, `word-equations2.docx` EQ8c, `word-stops-equations.docx` EQ20, EQ27,
 * `word-stops-equations2.docx` EQ39j, EQ39k)
 */
const classesOf = (parts: readonly Part[]): readonly Part[] =>
    parts.reduce<readonly Part[]>((resolved, part, index) => {
        if (part.kind !== "binary") {
            return [...resolved, part];
        }
        const previous = resolved.at(-1);
        const next = parts[index + 1]?.kind;
        const binary =
            previous !== undefined && (previous.unary === true || OPERANDS.has(previous.after ?? previous.kind)) && !ENDS.has(next);
        return [...resolved, binary ? part : { ...part, kind: "ordinary", unary: true }];
    }, []);

/**
 * Whether Word has been seen to space a character beside other atoms: a letter or digit, an operator, bracket or
 * punctuation of {@link CLASSES}, and the signs of {@link SIGNS}. Word's PDFs showed other symbols, such as arrows, set
 * operators and large operators written as text, only next to themselves, with no space between them
 * (`word-stops-equations.docx` EQ27)
 */
const isSpaced = (character: string): boolean => CLASSES.has(character) || SIGNS.has(character) || /^[\p{L}\p{N}]$/u.test(character);

/** Why a row can't be laid out for a character Word hasn't been seen to space, beside an atom other than itself */
const checkSeen = (parts: readonly Part[]): void => {
    parts.forEach((part, index) => {
        const others = [parts[index - 1], parts[index + 1]].filter((other) => other !== undefined && other.character !== part.character);
        if (part.character !== undefined && !isSpaced(part.character) && others.length > 0) {
            stop("an equation with a symbol Word hasn't been seen to space");
        }
    });
};

/** The space between each two atoms of a row, in turn, in eighteenths of an em, by their classes (see {@link classesOf}) */
const spacesOf = (atoms: readonly Part[], style: Style): readonly number[] => {
    const classes = classesOf(atoms);
    return classes.slice(1).map((part, index) => spaceBetween(classes[index], part, style));
};

/**
 * Why a row with the parts of a transparent phantom (`m:transp`) can't be laid out: where seeing through it makes a
 * difference to the spaces of the row. Word has been seen to space one only where it doesn't, a plus at the start of its
 * row, unary either way (`word-stops-equations3.docx` EQ55f)
 */
const checkTransparent = (atoms: readonly Part[], style: Style): void => {
    if (!atoms.some((part) => part.transparent)) {
        return;
    }
    const plain = atoms.map((part): Part => (part.transparent ? { box: part.box, kind: "ordinary" } : part));
    const seenThrough = spacesOf(atoms, style);
    if (spacesOf(plain, style).some((space, index) => space !== seenThrough[index])) {
        stop("a transparent phantom whose part the atoms beside it would space otherwise than an ordinary atom");
    }
};

/**
 * Lays out the parts of a row in turn: the atoms of its runs and the parts Word builds up, with the spaces between them
 * (see {@link spaceBetween}) and each italic correction Word adds: after a glyph that has one, unless an ordinary
 * character follows it in its run, as before an operator, a bracket, punctuation, a space, a part Word builds up and the
 * row's end (`word-equations.docx` EQ1, `word-equations2.docx` EQ7, `word-stops-equations.docx` EQ13b, EQ18c, EQ24), but
 * not before a run of another size (EQ22), and after scripts whose last glyph has one, whatever follows, as TeX adds it
 * (`word-stops-equations.docx` EQ11b, EQ17d, `word-stops-equations3.docx` EQ51f). The italic correction at its end is
 * kept apart, for scripts
 */
const rowOf = (given: readonly Part[], style: Style): Box => {
    const atoms = given.filter((part) => !part.space);
    const classes = classesOf(atoms);
    checkSeen(classes);
    checkTransparent(atoms, style);
    const resolved = new Map(atoms.map((part, index) => [part, classes[index]] as const));
    const em = inPoints(UNITS, style);
    let width = 0;
    let italic = 0;
    let previous: Part | undefined;
    given.forEach((original, index) => {
        width += italic;
        italic = 0;
        if (original.space) {
            width += original.box.width;
            return;
        }
        const part = resolved.get(original)!;
        width += previous === undefined ? 0 : (spaceBetween(previous, part, style) * em) / 18;
        width += part.box.width;
        const next = given.at(index + 1);
        const ordinaryNext =
            next !== undefined &&
            !next.space &&
            next.character !== undefined &&
            next.kind === "ordinary" &&
            !LARGE_OPERATORS.has(next.character);
        const otherSize =
            next?.box.first !== undefined && original.box.last !== undefined && next.box.first.size !== original.box.last.size;
        italic = (ordinaryNext && part.character !== undefined) || otherSize ? 0 : part.box.italic;
        previous = part;
    });
    const first = atoms.at(0)?.box.first;
    const last = atoms.at(-1)?.box.last;
    const only = atoms.length === 1 ? atoms[0].box : undefined;
    return {
        width,
        height: Math.max(0, ...atoms.map((part) => part.box.height)),
        depth: Math.max(0, ...atoms.map((part) => part.box.depth)),
        italic,
        characters: atoms.every((part) => part.box.characters),
        ...(only?.extended ? { extended: true } : {}),
        ...(first === undefined ? {} : { first }),
        ...(last === undefined ? {} : { last }),
    };
};

/** A box with its italic correction in its width, for a part whose width takes it in, such as a numerator */
const settled = (box: Box): Box => ({ ...box, width: box.width + box.italic, italic: 0 });

// ---- Parts Word builds up

// What an equation may have in it that takes no room: its properties, bookmarks, and proofing marks
const IGNORED = new Set(["m:oMathPr", "m:ctrlPr", "w:bookmarkStart", "w:bookmarkEnd", "w:proofErr", "_attr"]);
// The properties of parts Word builds up, which are read by them
const PROPERTIES = new Set([
    "m:fPr",
    "m:sSupPr",
    "m:sSubPr",
    "m:sSubSupPr",
    "m:radPr",
    "m:naryPr",
    "m:dPr",
    "m:mPr",
    "m:accPr",
    "m:barPr",
    "m:funcPr",
    "m:limLowPr",
    "m:limUppPr",
    "m:groupChrPr",
    "m:borderBoxPr",
    "m:eqArrPr",
    "m:phantPr",
]);

/** The parts of an argument, such as a fraction's numerator (`m:num`), in turn */
const partsOf = (elements: readonly XmlObject[], style: Style): readonly Part[] =>
    elements.flatMap((element): readonly Part[] => {
        const [name] = Object.keys(element);
        if (IGNORED.has(name) || PROPERTIES.has(name)) {
            return [];
        }
        if (name === "m:r") {
            return atomsOfRun(element[name], style);
        }
        return name === "m:phant" ? phantom(childrenOf(element[name]), style) : [built(name, element[name], style)];
    });

/**
 * An argument laid out as a row, in a style. Or why it can't be laid out: one with nothing in it, where Word shows a
 * placeholder
 */
const argument = (element: unknown, style: Style): Box => {
    const parts = partsOf(childrenOf(element), style);
    return parts.length === 0 ? stop("a part of an equation with nothing in it") : rowOf(parts, style);
};

/** The value of a property of a part (`m:val`), such as a fraction's type */
const propertyOf = (properties: readonly XmlObject[], name: string): string | undefined => {
    const value = attributesOf(find(properties, name))["m:val"];
    return value === undefined ? (find(properties, name) === undefined ? undefined : "1") : String(value);
};

const isOn = (properties: readonly XmlObject[], name: string): boolean => {
    const value = propertyOf(properties, name);
    return value !== undefined && !isOff(value);
};

/** Lays out a part Word builds up, as what it is to the spaces beside it */
const built = (name: string, element: unknown, style: Style): Part => {
    const children = childrenOf(element);
    switch (name) {
        case "m:f":
            return { box: fraction(children, style), kind: "inner" };
        case "m:sSup":
        case "m:sSub":
        case "m:sSubSup":
            return scripts(children, style);
        case "m:rad":
            return { box: radical(children, style), kind: "ordinary" };
        case "m:nary":
            return { box: nary(children, style), kind: "operator", after: "ordinary" };
        case "m:d":
            // Brackets are spaced as the brackets they are, as an ordinary atom, rather than as TeX's inner atom
            // (`word-stops-equations2.docx` EQ32c to EQ32e)
            return { box: delimited(children, style), kind: "ordinary" };
        case "m:m":
            return { box: matrix(children, style), kind: "ordinary" };
        case "m:acc":
            return { box: accented(children, style), kind: "ordinary" };
        case "m:bar":
            return { box: barred(children, style), kind: "ordinary" };
        case "m:func":
            return { box: functionOf(children, style), kind: "operator", after: "ordinary" };
        case "m:limLow":
        case "m:limUpp":
            return { box: limit(children, style, name === "m:limUpp"), kind: "ordinary" };
        case "m:groupChr":
            return { box: grouped(children, style), kind: "ordinary" };
        case "m:borderBox":
            return { box: bordered(children, style), kind: "ordinary" };
        case "m:eqArr":
            return { box: equationArray(children, style), kind: "ordinary" };
        case "m:sPre":
            return { box: prescripts(children, style), kind: "ordinary" };
        default:
            return stop(BUILT_UP);
    }
};

/**
 * A fraction (`m:f`): its numerator above its denominator, each centred on a rule on the maths axis, by the MATH table's
 * shifts and gaps, as Word builds it up (`word-stops-equations.docx` EQ10). In a line of text, its numerator and
 * denominator are in a script's size, and their own fractions in a script's script's; displayed, they and their own are
 * in the fraction's size, the equation's or a script's (`word-stops-equations2.docx` EQ37b), and only the outer fraction
 * is spaced as a displayed one. One whose numerator or denominator is a fraction alone is a fifth of an em wider, half
 * each side. One without a rule (`noBar`) is a stack, as for a binomial (EQ10e). Skewed and linear fractions haven't been
 * seen
 */
const fraction = (children: readonly XmlObject[], style: Style): Box => {
    const type = propertyOf(childrenOf(find(children, "m:fPr")), "m:type") ?? "bar";
    if (type !== "bar" && type !== "noBar") {
        stop("a skewed or linear fraction");
    }
    const inner: Style["level"] = style.display ? (style.level < 2 ? 1 : style.level) : style.level < 2 ? 2 : 3;
    const numerator = settled(argument(find(children, "m:num"), { ...style, level: inner }));
    const denominator = settled(argument(find(children, "m:den"), { ...style, level: inner, cramped: true }));
    const nested = ["m:num", "m:den"].map((part) =>
        childrenOf(find(children, part)).filter((child) => !IGNORED.has(Object.keys(child)[0])),
    );
    // A fraction of fractions is wider, but not one with a fraction beside other parts (`word-stops-equations.docx` EQ10c,
    // EQ10d, EQ10cd, EQ10dd, `word-stops-equations2.docx` EQ37a)
    const padding = nested.some((parts) => parts.length === 1 && "m:f" in parts[0]) ? inPoints(UNITS, { ...style, level: 1 }) / 5 : 0;
    const width = Math.max(numerator.width, denominator.width) + padding;
    const axis = constantOf("axisHeight", style);
    const shown = style.level === 0;
    let up: number;
    let down: number;
    let top: number;
    let bottom: number;
    if (type === "noBar") {
        up = constantOf(shown ? "stackTopDisplayStyleShiftUp" : "stackTopShiftUp", style);
        down = constantOf(shown ? "stackBottomDisplayStyleShiftDown" : "stackBottomShiftDown", style);
        const least = constantOf(shown ? "stackDisplayStyleGapMin" : "stackGapMin", style);
        const gap = up - numerator.depth - (denominator.height - down);
        if (gap < least) {
            up += (least - gap) / 2;
            down += (least - gap) / 2;
        }
        top = up + numerator.height;
        bottom = down + denominator.depth;
    } else {
        const rule = constantOf("fractionRuleThickness", style);
        up = Math.max(
            constantOf(shown ? "fractionNumeratorDisplayStyleShiftUp" : "fractionNumeratorShiftUp", style),
            axis + rule / 2 + constantOf(shown ? "fractionNumDisplayStyleGapMin" : "fractionNumeratorGapMin", style) + numerator.depth,
        );
        down = Math.max(
            constantOf(shown ? "fractionDenominatorDisplayStyleShiftDown" : "fractionDenominatorShiftDown", style),
            denominator.height -
                axis +
                rule / 2 +
                constantOf(shown ? "fractionDenomDisplayStyleGapMin" : "fractionDenominatorGapMin", style),
        );
        top = Math.max(up + numerator.height, axis + rule / 2);
        bottom = Math.max(down + denominator.depth, rule / 2 - axis);
    }
    return { width, height: top, depth: bottom, italic: 0, characters: false };
};

/**
 * A glyph's kerning beside its script, at a corner, as the MATH table gives it at the two heights the script and its base
 * meet at, the larger of them: for a superscript, at its bottom and at its base's top, and for a subscript, at its top and
 * its base's bottom (`word-stops-equations.docx` EQ11a, EQ11b, EQ11f, EQ17b)
 */
const kerningOf = (base: Box, script: Box, shift: number, superscript: boolean): number => {
    if (base.last === undefined) {
        return 0;
    }
    const heights = superscript ? [shift - script.depth, base.height] : [script.height - shift, -base.depth];
    const corners = superscript ? [0, 3] : [2, 1];
    const kerns = heights.map((height) => {
        const baseScale = base.last!.size / UNITS;
        const own = kernAt(base.last!.glyph, corners[0], height / baseScale) * baseScale;
        if (script.first === undefined) {
            return own;
        }
        const scale = script.first.size / UNITS;
        const fromScript = superscript ? height - shift : height + shift;
        return own + kernAt(script.first.glyph, corners[1], fromScript / scale) * scale;
    });
    return Math.max(...kerns);
};

/**
 * Scripts on a base: a superscript raised by the MATH table's shift, and further where its base is a box, such as a
 * fraction, or a shape grown to a size, whose top it goes no lower than a little below; a subscript lowered likewise; and
 * both moved apart, half each, to leave the table's gap between them, as Word does (`word-stops-equations.docx` EQ11,
 * EQ13). The superscript goes after its base's italic correction, both are kerned with their base by the MATH table, and
 * Word puts the table's space after them. Beside a sum or integral (`operator`), they aren't kerned, and an integral's
 * subscript goes back by its italic correction (EQ13b, EQ13d). A superscript in a cramped part, such as a denominator, a
 * radicand, what is under a bar or an accent, or a lower limit, is raised by the table's shift for cramped ones
 * (`word-stops-equations2.docx` EQ31, `word-stops-equations3.docx` EQ50). The italic correction of the script that reaches
 * furthest is the box's own, as a glyph's is, which an accent over the scripts leaves out (EQ48k)
 */
const attachScripts = (
    base: Box,
    subscript: Box | undefined,
    superscript: Box | undefined,
    style: Style,
    operator?: { readonly integral: boolean },
): Box => {
    const boxed = !base.characters || base.extended === true;
    let up = 0;
    let down = 0;
    if (superscript !== undefined) {
        up = constantOf(style.cramped ? "superscriptShiftUpCramped" : "superscriptShiftUp", style);
        if (boxed) {
            up = Math.max(up, base.height - constantOf("superscriptBaselineDropMax", style));
        }
        up = Math.max(up, constantOf("superscriptBottomMin", style) + superscript.depth);
    }
    if (subscript !== undefined) {
        down = constantOf("subscriptShiftDown", style);
        if (boxed) {
            down = Math.max(down, base.depth + constantOf("subscriptBaselineDropMin", style));
        }
        down = Math.max(down, subscript.height - constantOf("subscriptTopMax", style));
    }
    if (subscript !== undefined && superscript !== undefined) {
        const gap = up - superscript.depth - (subscript.height - down);
        const least = constantOf("subSuperscriptGapMin", style);
        if (gap < least) {
            up += (least - gap) / 2;
            down += (least - gap) / 2;
        }
    }
    let end = base.width;
    let reach = base.width;
    let { height, depth } = base;
    if (superscript !== undefined) {
        const x = base.width + (operator?.integral ? 0 : base.italic) + (operator ? 0 : kerningOf(base, superscript, up, true));
        end = Math.max(end, x + superscript.width + superscript.italic);
        reach = Math.max(reach, x + superscript.width);
        height = Math.max(height, up + superscript.height);
    }
    if (subscript !== undefined) {
        const x = base.width - (operator?.integral ? base.italic : 0) + (operator ? 0 : kerningOf(base, subscript, down, false));
        end = Math.max(end, x + subscript.width + subscript.italic);
        reach = Math.max(reach, x + subscript.width);
        depth = Math.max(depth, down + subscript.depth);
    }
    return { width: reach + (operator ? 0 : constantOf("spaceAfterScript", style)), height, depth, italic: end - reach, characters: false };
};

/** A superscript (`m:sSup`), subscript (`m:sSub`) or both (`m:sSubSup`) on its base, as an atom of its base's kind */
const scripts = (children: readonly XmlObject[], style: Style): Part => {
    const baseParts = partsOf(childrenOf(find(children, "m:e")), style);
    const base = baseParts.length === 0 ? stop("a part of an equation with nothing in it") : rowOf(baseParts, style);
    const subscript = find(children, "m:sub") === undefined ? undefined : argument(find(children, "m:sub"), scriptStyle(style));
    const superscript = find(children, "m:sup") === undefined ? undefined : argument(find(children, "m:sup"), scriptStyle(style));
    const real = baseParts.filter((part) => !part.space);
    return {
        // Its first glyph is its base's, which a base before it is kerned with (`word-stops-equations3.docx` EQ53)
        box: { ...attachScripts(base, subscript, superscript, style), ...(base.first === undefined ? {} : { first: base.first }) },
        kind: real.length === 1 ? (CLASSES.get(real[0].character ?? "") ?? "ordinary") : "ordinary",
    };
};

// The least height Word takes a radicand to have, in Cambria Math's units, choosing the size of its sign: 1250, which
// Word's PDFs put above 1242 and no higher than 1261, as `word-stops-equations2.docx` EQ35b and EQ35c show (√A's smallest
// sign, √𝑥ᵢ's next), EQ35d (√𝑎ᵢⱼ's next in a line of text, though its sign goes as far below its baseline as the
// radicand) and `word-stops-equations3.docx` EQ46 (√𝑝's, √𝑞's, √𝜌's, √𝜂's and √𝑦's next in a line of text, √𝜇's, √𝜒's
// and √𝛾's smallest), so a radicand whose sign would be another size between 1243 and 1260 stops the layout
const ROOT_LEAST = [1243, 1250, 1260];
// How far above the radicand's ink, in Cambria Math's units, Word centres the root's sign over it: 250, which Word's PDFs
// put between 240 and 260 (`word-stops-equations2.docx` EQ35)
const ROOT_ABOVE = 250;

/**
 * A root (`m:rad`): Cambria Math's root sign, the first of its sizes whose ink is as tall as the radicand's, taken as at
 * least 1250 units tall (see {@link ROOT_LEAST}), with the MATH table's gap and rule above it (the displayed gap only when
 * the equation is displayed); centred on the radicand's ink, as tall, with 250 units above it (see {@link ROOT_ABOVE}),
 * unless that leaves less than the gap above the radicand, with the rule over the radicand, and its degree, in a script's
 * script's size, raised and kerned by the table (`word-stops-equations.docx` EQ12, EQ10f, `word-stops-equations2.docx`
 * EQ35). Its ink, and the room reserved above its rule, are its height. Or why it can't be laid out: a radicand whose
 * sign's size Word's PDFs leave between two, as within the range they leave its least height
 */
const radical = (children: readonly XmlObject[], style: Style): Box => {
    const properties = childrenOf(find(children, "m:radPr"));
    const content = settled(argument(find(children, "m:e"), cramp(style)));
    const rule = constantOf("radicalRuleThickness", style);
    const extra = constantOf("radicalExtraAscender", style);
    const gap = constantOf(style.level > 0 ? "radicalVerticalGap" : "radicalDisplayStyleVerticalGap", style);
    const tall = (least: number): number => Math.max(content.height, inPoints(least, style));
    const [lower, height, higher] = ROOT_LEAST.map((least) =>
        grownGlyph(glyphOf("√"), tall(least) + content.depth + gap + rule, style, "a root taller than Cambria Math's tallest root sign"),
    );
    if (lower !== higher) {
        stop("a root whose sign's size Word's PDFs leave between two");
    }
    const box = glyphBox(height, sizeOf(style));
    const centred = (tall(ROOT_LEAST[1]) - content.depth + inPoints(ROOT_ABOVE, style) + box.height + box.depth) / 2;
    const top = Math.max(centred, content.height + gap + rule);
    const shift = top - box.height;
    let x = 0;
    let reach = top + extra;
    if (!isOn(properties, "m:degHide")) {
        const degree = settled(argument(find(children, "m:deg"), { ...style, level: 3, cramped: false }));
        const raise = ((box.height + box.depth) * MATH_CONSTANTS.radicalDegreeBottomRaisePercent) / 100 - box.depth + shift + degree.depth;
        x = Math.max(0, constantOf("radicalKernBeforeDegree", style) + degree.width + constantOf("radicalKernAfterDegree", style));
        reach = Math.max(reach, raise + degree.height);
    }
    return {
        width: x + box.width + content.width,
        height: reach,
        depth: Math.max(content.depth, box.depth - shift),
        italic: 0,
        characters: false,
    };
};

/**
 * The first of a glyph's taller variants, smallest first, whose ink is as tall as a height, in points, or why it can't be
 * laid out where none is
 */
const grownGlyph = (glyph: number, height: number, style: Style, tooTall: string): number => {
    const variants = VERTICAL_VARIANTS.get(glyph) ?? [[glyph, 0] as const];
    const found = variants.find(([variant]) => {
        const [, bottom, top] = metricsOf(variant);
        return inPoints(top - bottom, style) >= height;
    });
    return found === undefined ? stop(tooTall) : found[0];
};

// The sums and integrals Word draws with their limits beside them unless told otherwise (`m:limLoc`)
const INTEGRALS = new Set([..."∫∬∭∮∯∰∱∲∳"]);

/**
 * A sum, integral or other n-ary operator (`m:nary`), with its limits and argument: the operator centred on the maths
 * axis, in a line of text Cambria Math's glyph and displayed its third size, as Word draws ∑, ∏, ∫ and ∮
 * (`word-stops-equations.docx` EQ13); its limits under and over it when displayed (`m:limLoc` "undOvr", a sum's unless
 * told otherwise), and beside it as scripts otherwise, with no kerning, an integral's subscript back by its italic correction,
 * and with no space after them; and a thin space before its argument, but after limits beside it when displayed. In a
 * script, or a script's script, it is as in a line of text, in the script's size (`word-stops-equations2.docx` EQ37c,
 * `word-stops-equations3.docx` EQ53a). One that grows with its argument (`m:grow`) hasn't been seen
 */
const nary = (children: readonly XmlObject[], style: Style): Box => {
    const properties = childrenOf(find(children, "m:naryPr"));
    const character = propertyOf(properties, "m:chr") ?? "∫";
    const integral = INTEGRALS.has(character);
    const location = propertyOf(properties, "m:limLoc") ?? (integral ? style.limits.integrals : style.limits.sums);
    if (isOn(properties, "m:grow") || (location !== "subSup" && location !== "undOvr")) {
        stop(BUILT_UP);
    }
    const plain = glyphOf(character);
    const variants = VERTICAL_VARIANTS.get(plain);
    const glyph = style.level === 0 ? (variants?.[2]?.[0] ?? stop(BUILT_UP)) : plain;
    const own = glyphBox(glyph, sizeOf(style));
    const shift = constantOf("axisHeight", style) - (own.height - own.depth) / 2;
    const operator: Box = { ...own, height: own.height + shift, depth: own.depth - shift, last: undefined, first: undefined };
    const subscript = isOn(properties, "m:subHide") ? undefined : argument(find(children, "m:sub"), scriptStyle(style, true));
    const superscript = isOn(properties, "m:supHide") ? undefined : argument(find(children, "m:sup"), scriptStyle(style));
    let limits: Box;
    if (location === "undOvr" && style.level === 0) {
        limits = limitsOf(operator, subscript, superscript, style);
    } else {
        limits =
            subscript || superscript ? attachScripts(operator, subscript, superscript, style, { integral }) : { ...operator, italic: 0 };
    }
    const content = settled(argument(find(children, "m:e"), style));
    const beside = style.level === 0 && location === "subSup" && (subscript !== undefined || superscript !== undefined);
    const space = beside ? 0 : inPoints((UNITS * 3) / 18, style);
    return {
        width: limits.width + limits.italic + space + content.width,
        height: Math.max(limits.height, content.height),
        depth: Math.max(limits.depth, content.depth),
        italic: 0,
        characters: false,
    };
};

/**
 * Limits under and over a base, each centred on it: the lower one dropped and the upper one raised from its base's ink by
 * the MATH table's least drop and rise, or its gap from it where that is more, as for a displayed sum's limits and a
 * function's (`word-stops-equations.docx` EQ13ad, EQ17c, EQ18)
 */
const limitsOf = (base: Box, lower: Box | undefined, upper: Box | undefined, style: Style): Box => {
    const width = Math.max(base.width, ...[lower, upper].filter((box) => box !== undefined).map((box) => box.width + box.italic));
    let { height, depth } = base;
    if (upper !== undefined) {
        const rise = Math.max(constantOf("upperLimitBaselineRiseMin", style), constantOf("upperLimitGapMin", style) + upper.depth);
        height = base.height + rise + upper.height;
    }
    if (lower !== undefined) {
        const drop = Math.max(constantOf("lowerLimitBaselineDropMin", style), constantOf("lowerLimitGapMin", style) + lower.height);
        depth = base.depth + drop + lower.depth;
    }
    return { width, height, depth, italic: 0, characters: false };
};

// The brackets Word draws as other characters: the angle brackets as Cambria Math's older ones (`word-stops-equations.docx` EQ14e)
const BRACKETS: ReadonlyMap<string, string> = new Map([
    ["⟨", "〈"],
    ["⟩", "〉"],
]);
// How tall Word makes a bracket around a part, as a share of twice the part's ink's furthest reach from the maths axis:
// its PDFs show a share of 0.816 to 0.835 (`word-stops-equations.docx` EQ10e, EQ14, EQ15, `word-stops-equations2.docx`
// EQ33, EQ34, `word-stops-equations3.docx` EQ47), so a part whose bracket would be another size between them stops the
// layout
const BRACKET_SHARES = [0.816, 0.835];

/**
 * Brackets around parts (`m:d`), with separators between them (`m:sepChr`): each bracket the first of its sizes as tall
 * as the parts need (see {@link BRACKET_SHARES}), centred on the maths axis, with no space beside it
 * (`word-stops-equations.docx` EQ14, EQ15). Brackets that don't grow (`m:grow` off), or match their parts' shape
 * (`m:shp`), haven't been seen
 */
const delimited = (children: readonly XmlObject[], style: Style): Box => {
    const properties = childrenOf(find(children, "m:dPr"));
    const characterOf = (name: string, otherwise: string): string => propertyOf(properties, name) ?? otherwise;
    if (find(properties, "m:grow") !== undefined && !isOn(properties, "m:grow")) {
        stop("brackets that don't grow with what is in them");
    }
    if ((propertyOf(properties, "m:shp") ?? "centered") !== "centered") {
        stop("brackets that match the shape of what is in them");
    }
    const parts = children.filter((child) => "m:e" in child).map((child) => settled(argument(child["m:e"], style)));
    const axis = constantOf("axisHeight", style);
    const reach = Math.max(0, ...parts.map((part) => Math.max(part.height - axis, part.depth + axis)));
    const bracket = (shown: string): Box | undefined => {
        if (shown === "") {
            return undefined;
        }
        // Word draws angle brackets as Cambria Math's older ones, whose larger sizes it hasn't been seen to draw
        const character = BRACKETS.get(shown) ?? shown;
        const tooTall = BRACKETS.has(shown) ? "angle brackets that grow" : "brackets taller than Cambria Math's tallest";
        const [lower, higher] = BRACKET_SHARES.map((share) => grownGlyph(glyphOf(character), 2 * reach * share, style, tooTall));
        if (lower !== higher) {
            stop("brackets whose size Word's PDFs leave between two");
        }
        const box = glyphBox(lower, sizeOf(style));
        const shift = axis - (box.height - box.depth) / 2;
        return { ...box, height: box.height + shift, depth: box.depth - shift };
    };
    const boxes = [
        bracket(characterOf("m:begChr", "(")),
        ...parts.flatMap((part, index) => (index === 0 ? [part] : [bracket(characterOf("m:sepChr", "|")), part])),
        bracket(characterOf("m:endChr", ")")),
    ].filter((box): box is Box => box !== undefined);
    return {
        width: boxes.reduce((total, box) => total + box.width, 0),
        height: Math.max(...boxes.map((box) => box.height)),
        depth: Math.max(...boxes.map((box) => box.depth)),
        italic: 0,
        characters: false,
    };
};

// The least gap Word leaves between the ink of a matrix's rows, in Cambria Math's units: 653, which its PDFs put between
// 636 and 670 (`word-stops-equations.docx` EQ15b, `word-stops-equations2.docx` EQ33)
const ROW_GAP = 653;

/**
 * A matrix (`m:m`): each row a line of Cambria Math below the one before, as single spaced, or further, where its ink
 * would come nearer the row before's than a gap (see {@link ROW_GAP}), its columns an em apart, each as wide as its widest
 * cell, with its cells lined up in them as its columns' properties say (`m:mcJc`), centred unless they say otherwise, and
 * the whole centred on the maths axis (`word-stops-equations.docx` EQ15, `word-stops-equations2.docx` EQ33). Empty
 * cells, and other spacing and lining up, haven't been seen
 */
const matrix = (children: readonly XmlObject[], style: Style): Box => {
    const properties = childrenOf(find(children, "m:mPr"));
    const unseen = ["m:rSp", "m:rSpRule", "m:cGp", "m:cGpRule", "m:cSp"].some(
        (name) => (Number(propertyOf(properties, name) ?? 0) || 0) !== 0,
    );
    if (unseen || (propertyOf(properties, "m:baseJc") ?? "center") !== "center") {
        stop("a matrix spaced or lined up in a way not yet followed");
    }
    const rows = children
        .filter((child) => "m:mr" in child)
        .map((row) =>
            childrenOf(row["m:mr"])
                .filter((child) => "m:e" in child)
                .map((cell) => settled(argument(cell["m:e"], style))),
        );
    if (rows.length === 0 || rows.some((row) => row.length === 0)) {
        stop("a part of an equation with nothing in it");
    }
    const columns = Math.max(...rows.map((row) => row.length));
    const widths = Array.from({ length: columns }, (_, column) => Math.max(0, ...rows.map((row) => row[column]?.width ?? 0)));
    return {
        ...rowsBox(
            rows.map((row) => Math.max(...row.map((cell) => cell.height))),
            rows.map((row) => Math.max(...row.map((cell) => cell.depth))),
            style,
        ),
        width: widths.reduce((total, width) => total + width, 0) + inPoints(UNITS, style) * (columns - 1),
    };
};

/**
 * Rows of a matrix or an equation array, by how far each one's ink goes above and below its baseline: each row a line of
 * Cambria Math below the one before, or further, where their ink would come nearer than a gap (see {@link ROW_GAP}), and
 * the whole centred on the maths axis. Its width is left to its caller
 */
const rowsBox = (heights: readonly number[], depths: readonly number[], style: Style): Box => {
    const single = inPoints(ASCENT + DESCENT, style);
    const drops = heights.slice(1).map((height, index) => Math.max(single, depths[index] + height + inPoints(ROW_GAP, style)));
    const [top] = heights;
    const bottom = drops.reduce((total, drop) => total + drop, 0) + depths.at(-1)!;
    const shift = constantOf("axisHeight", style) - (top - bottom) / 2;
    return { width: 0, height: top + shift, depth: bottom - shift, italic: 0, characters: false };
};

// How wide an accent over a part of more than one glyph may be, at most, as a share of the part, with its italic
// correction: Word's PDFs show a share of 0.979 to 1 (`word-stops-equations2.docx` EQ31e, `word-stops-equations3.docx`
// EQ48j, EQ48k), so a part whose accent would be another size between them stops the layout
const ACCENT_SHARES = [0.979, 1];

/**
 * The size of an accent over one glyph: the widest of the accent's sizes whose ink, centred where the MATH table attaches
 * accents to the glyph, or on the glyph where it doesn't say, stays within the glyph's width, without its italic
 * correction, or its smallest, as Word draws it over 𝑥, 𝑛, 𝑔, 𝑢, 𝑇, 𝑊, 𝑍, 𝑑, 𝑡 and 𝐼 (`word-stops-equations.docx` EQ16,
 * `word-stops-equations3.docx` EQ48): the second size over 𝑇, where it fits, and the smallest over 𝑍, nearly as wide,
 * where the second would reach past its right
 */
const accentOver = (glyph: number, variants: readonly (readonly [number, number])[]): number => {
    const [width] = metricsOf(glyph);
    const centre = TOP_ACCENT_ATTACHMENTS.get(glyph) ?? width / 2;
    const fits = ([variant]: readonly [number, number]): boolean => {
        const [, , , left, right] = metricsOf(variant);
        const half = (right - left) / 2;
        return centre - half >= 0 && centre + half <= width;
    };
    return (variants.filter(fits).at(-1) ?? variants[0])[0];
};

/**
 * An accent over a part (`m:acc`): over one glyph, the widest of its sizes that fits the glyph (see {@link accentOver}),
 * and over more, the widest no wider than its share of the part (see {@link ACCENT_SHARES}), raised by as far as the
 * part's ink goes above the MATH table's base height for accents, and drawn flatter over a part taller than its height
 * for flatter accents (`word-stops-equations.docx` EQ16, `word-stops-equations2.docx` EQ31e, `word-stops-equations3.docx`
 * EQ48). It takes the part's width, with its italic correction where the part ends with a glyph (EQ16, EQ48h), but
 * without a script's (EQ48k), even where it is wider than the part, as over 𝐼 (EQ48i)
 */
const accented = (children: readonly XmlObject[], style: Style): Box => {
    const character = propertyOf(childrenOf(find(children, "m:accPr")), "m:chr") ?? "\u0302";
    const parts = partsOf(childrenOf(find(children, "m:e")), cramp(style));
    const base = parts.length === 0 ? stop("a part of an equation with nothing in it") : rowOf(parts, cramp(style));
    const width = base.width + (base.last === undefined ? 0 : base.italic);
    const plain = glyphOf(character);
    const variants = HORIZONTAL_VARIANTS.get(plain) ?? [[plain, 0] as const];
    const atoms = parts.filter((part) => !part.space);
    const only = atoms.length === 1 && atoms[0].character !== undefined ? atoms[0].box.first : undefined;
    const widest = (): number => {
        const [narrower, wider] = ACCENT_SHARES.map(
            (share) => variants.filter(([, wide], index) => index === 0 || inPoints(wide, style) <= width * share).at(-1)![0],
        );
        return narrower === wider ? narrower : stop("an accent whose size Word's PDFs leave between two");
    };
    const chosen = only === undefined ? widest() : accentOver(only.glyph, variants);
    const flat = base.height > constantOf("flattenedAccentBaseHeight", style) ? FLATTENED_ACCENTS.get(chosen) : undefined;
    const accent = glyphBox(flat ?? chosen, sizeOf(style));
    const raise = Math.max(0, base.height - constantOf("accentBaseHeight", style));
    return { width, height: Math.max(base.height, raise + accent.height), depth: base.depth, italic: 0, characters: false };
};

/**
 * A bar over or under a part (`m:bar`): a rule the MATH table's gap from the part's ink, with the room the table reserves
 * beyond it, as wide as the part with its italic correction (`word-stops-equations.docx` EQ16d, EQ16e)
 */
const barred = (children: readonly XmlObject[], style: Style): Box => {
    const over = (propertyOf(childrenOf(find(children, "m:barPr")), "m:pos") ?? "bot") === "top";
    const base = settled(argument(find(children, "m:e"), over ? cramp(style) : style));
    if (over) {
        const top = base.height + constantOf("overbarVerticalGap", style) + constantOf("overbarRuleThickness", style);
        return { ...base, height: top + constantOf("overbarExtraAscender", style), characters: false };
    }
    const bottom = base.depth + constantOf("underbarVerticalGap", style) + constantOf("underbarRuleThickness", style);
    return { ...base, depth: bottom + constantOf("underbarExtraDescender", style), characters: false };
};

/**
 * A box around a part (`m:borderBox`): its border as far from the part's ink on every side as a bar over or under it,
 * the MATH table's gap and rule (`word-stops-equations.docx` EQ18c, `word-stops-equations2.docx` EQ36), struck through
 * or not (`m:strikeH`, `word-stops-equations3.docx` EQ55b). One with its top hidden takes the same room, as far as Word
 * has shown: around 𝑥, whose line is the font's with or without the room above the box (EQ55a). Or why it can't be laid
 * out: one with its left or right side hidden, whose room there would show in its width, or with its top or bottom
 * hidden over a part so tall that the room there would show in its line, which Word hasn't been seen to keep or not
 */
const bordered = (children: readonly XmlObject[], style: Style): Box => {
    const properties = childrenOf(find(children, "m:borderBoxPr"));
    if (isOn(properties, "m:hideLeft") || isOn(properties, "m:hideRight")) {
        stop("a box with its left or right side hidden");
    }
    const base = settled(argument(find(children, "m:e"), style));
    const room = constantOf("overbarVerticalGap", style) + constantOf("overbarRuleThickness", style);
    const box: Box = { width: base.width + 2 * room, height: base.height + room, depth: base.depth + room, italic: 0, characters: false };
    const line: Style = { ...style, level: style.level < 2 ? style.level : 1 };
    if (
        (isOn(properties, "m:hideTop") && box.height + constantOf("mathLeading", line) > inPoints(ASCENT, line)) ||
        (isOn(properties, "m:hideBot") && box.depth > inPoints(DESCENT, line))
    ) {
        stop("a box with its top or bottom hidden, where the room there would show in its line");
    }
    return box;
};

/**
 * An equation array (`m:eqArr`): its rows spaced as a matrix's (see {@link matrix}), each lined up at the ampersand in it,
 * which isn't drawn, what is before it right-aligned and what is after it left-aligned, with the space between the atoms
 * either side of it after it, or, where no row has an ampersand, each centred, and the whole centred on the maths axis
 * (`word-stops-equations2.docx` EQ37d, `word-stops-equations3.docx` EQ54a). An alignment mark (`m:aln`) on a run leaves
 * the rows as they are without it (EQ54c). Rows with more than one ampersand, which Word lines up at the first and
 * spaces at the second in a way not yet known (EQ54b), rows with an ampersand beside rows without, rows spaced
 * otherwise, and arrays lined up otherwise with the line, haven't been seen
 */
const equationArray = (children: readonly XmlObject[], style: Style): Box => {
    const properties = childrenOf(find(children, "m:eqArrPr"));
    const unseen =
        ["m:maxDist", "m:objDist"].some((name) => isOn(properties, name)) ||
        ["m:rSp", "m:rSpRule"].some((name) => (Number(propertyOf(properties, name) ?? 0) || 0) !== 0);
    if (unseen || (propertyOf(properties, "m:baseJc") ?? "center") !== "center") {
        stop("an equation array spaced or lined up in a way not yet followed");
    }
    const rows = children
        .filter((child) => "m:e" in child)
        .map((row) => {
            const parts = partsOf(childrenOf(row["m:e"]), style);
            const at = parts.findIndex((part) => part.character === "&");
            if (parts.some((part, index) => index !== at && part.character === "&")) {
                stop("an equation array with more than one ampersand in a row, which Word spaces in a way not yet followed");
            }
            const before = at === -1 ? [] : parts.slice(0, at);
            const whole = rowOf([...before, ...parts.slice(at + 1)], style);
            const left = before.length === 0 ? 0 : settled(rowOf(before, style)).width;
            return { aligned: at !== -1, left, right: whole.width + whole.italic - left, height: whole.height, depth: whole.depth };
        });
    if (rows.length === 0) {
        stop("a part of an equation with nothing in it");
    }
    if (rows.some(({ aligned }) => aligned) && !rows.every(({ aligned }) => aligned)) {
        stop("an equation array with an ampersand in some rows and none in others");
    }
    return {
        ...rowsBox(
            rows.map(({ height }) => height),
            rows.map(({ depth }) => depth),
            style,
        ),
        width: Math.max(...rows.map(({ left }) => left)) + Math.max(...rows.map(({ right }) => right)),
    };
};

/**
 * A phantom (`m:phant`), as the parts of its row: its part, shown or not, taking its room, or none of its width
 * (`m:zeroWid`), its height (`m:zeroAsc`) or its depth (`m:zeroDesc`), as an ordinary atom (`word-stops-equations2.docx`
 * EQ37e, `word-stops-equations3.docx` EQ55c to EQ55e); or, where it is transparent (`m:transp`), its part's own atoms,
 * which the row lays out only where seeing through them makes no difference (see {@link checkSeen}, EQ55f)
 */
const phantom = (children: readonly XmlObject[], style: Style): readonly Part[] => {
    const properties = childrenOf(find(children, "m:phantPr"));
    const less = (box: Box): Box => ({
        ...box,
        ...(isOn(properties, "m:zeroWid") ? { width: 0, italic: 0 } : {}),
        ...(isOn(properties, "m:zeroAsc") ? { height: 0 } : {}),
        ...(isOn(properties, "m:zeroDesc") ? { depth: 0 } : {}),
    });
    return isOn(properties, "m:transp")
        ? partsOf(childrenOf(find(children, "m:e")), style).map((part) => ({ ...part, box: less(part.box), transparent: true }))
        : [{ box: { ...less(settled(argument(find(children, "m:e"), style))), characters: false }, kind: "ordinary" }];
};

/**
 * Pre-scripts (`m:sPre`): a subscript and a superscript before their base, lined up at their left, as far above and
 * below the baseline as scripts after it would be (see {@link attachScripts}), with the MATH table's space after
 * scripts before them instead of after, and the base straight after them, not kerned with them, though the table would
 * tuck 𝑥 under its subscript (`word-stops-equations3.docx` EQ55g)
 */
const prescripts = (children: readonly XmlObject[], style: Style): Box => {
    const base = argument(find(children, "m:e"), style);
    const subscript = argument(find(children, "m:sub"), scriptStyle(style));
    const superscript = argument(find(children, "m:sup"), scriptStyle(style));
    const attached = attachScripts({ ...base, width: 0, italic: 0, first: undefined, last: undefined }, subscript, superscript, style);
    return {
        ...attached,
        width: attached.width + attached.italic + base.width,
        italic: base.italic,
        ...(base.last === undefined ? {} : { last: base.last }),
    };
};

/**
 * A function (`m:func`): its name, a thin space, and its argument (`word-equations.docx` EQ1z, `word-stops-equations.docx`
 * EQ17)
 */
const functionOf = (children: readonly XmlObject[], style: Style): Box => {
    const name = settled(argument(find(children, "m:fName"), style));
    const content = settled(argument(find(children, "m:e"), style));
    return {
        width: name.width + inPoints((UNITS * 3) / 18, style) + content.width,
        height: Math.max(name.height, content.height),
        depth: Math.max(name.depth, content.depth),
        italic: 0,
        characters: false,
    };
};

/** A limit under (`m:limLow`) or over (`m:limUpp`) a part, as a displayed sum's (see {@link limitsOf}) */
const limit = (children: readonly XmlObject[], style: Style, upper: boolean): Box => {
    const base = settled(argument(find(children, "m:e"), style));
    const lim = argument(find(children, "m:lim"), scriptStyle(style, !upper));
    return limitsOf(base, upper ? undefined : lim, upper ? lim : undefined, style);
};

/**
 * The glyphs of a character made of its parts as wide as a part, in points: those that aren't repeated, joined by no less
 * than the least overlap, as Word drew a brace without repeats (`word-stops-equations.docx` EQ18a), and the repeated ones
 * too, where those are too narrow (`word-stops-equations2.docx` EQ37h). Or why it can't be laid out: a part narrower than
 * the parts not repeated can be joined to, each to the next by as much as both can, hasn't been seen
 */
const assembly = (
    parts: readonly (readonly [number, number, number, number, boolean])[],
    width: number,
    style: Style,
): readonly number[] => {
    const fixed = parts.filter(([, , , , repeated]) => !repeated);
    const total = fixed.reduce((sum, [, , , wide]) => sum + wide, 0);
    const joins = fixed.slice(1).reduce((sum, [, start], index) => sum + Math.min(fixed[index][2], start), 0);
    if (inPoints(total - joins, style) > width) {
        stop("a character grown over or under a part narrower than the character made of its parts");
    }
    const longest = total - MIN_CONNECTOR_OVERLAP * (fixed.length - 1);
    return (inPoints(longest, style) < width ? parts : fixed).map(([glyph]) => glyph);
};

// How wide a brace of one of its own sizes may be, at most, as a share of its part: Word's PDFs show a share of 0.981 to
// 1.021, the widest no wider than the part (`word-stops-equations2.docx` EQ37f, EQ37g, `word-stops-equations3.docx`
// EQ49), so a part whose brace would be another size between them stops the layout
const BRACE_SHARES = [0.981, 1.021];

/**
 * A brace or other character grown over or under a part (`m:groupChr`): the widest of the character's sizes no wider
 * than its share of the part (see {@link BRACE_SHARES}), or its smallest, centred on the part; or, for a part wider than
 * its widest size, Cambria Math's character made of its parts as wide as the part, with as many of its repeated parts as
 * it needs; where it stays unless it would be nearer the part's ink than the MATH table's gap (`word-stops-equations.docx`
 * EQ18a, EQ18b, `word-stops-equations2.docx` EQ37f to EQ37h). Or why it can't be laid out: a part narrower than the
 * character made of its parts, but wider than its widest size, hasn't been seen
 */
const grouped = (children: readonly XmlObject[], style: Style): Box => {
    const properties = childrenOf(find(children, "m:groupChrPr"));
    const character = propertyOf(properties, "m:chr") ?? "⏟";
    const over = (propertyOf(properties, "m:pos") ?? "bot") === "top";
    const base = settled(argument(find(children, "m:e"), style));
    const plain = glyphOf(character);
    const variants = HORIZONTAL_VARIANTS.get(plain) ?? stop("a character grown over or under a part that Cambria Math has no sizes of");
    const parts = HORIZONTAL_ASSEMBLIES.get(plain);
    const assembled = parts !== undefined && inPoints(variants.at(-1)![1], style) < base.width;
    const [lower, higher] = BRACE_SHARES.map(
        (share) => variants.filter(([, wide], index) => index === 0 || inPoints(wide, style) <= base.width * share).at(-1)![0],
    );
    if (!assembled && lower !== higher) {
        stop("a brace whose size Word's PDFs leave between two");
    }
    const glyphs = assembled ? assembly(parts, base.width, style) : [lower];
    const width = assembled ? base.width : Math.max(base.width, inPoints(metricsOf(lower)[0], style));
    const bottom = Math.min(...glyphs.map((glyph) => inPoints(metricsOf(glyph)[1], style)));
    const top = Math.max(...glyphs.map((glyph) => inPoints(metricsOf(glyph)[2], style)));
    const gap = constantOf(over ? "stretchStackGapAboveMin" : "stretchStackGapBelowMin", style);
    const shift = over ? Math.max(0, base.height + gap - bottom) : Math.min(0, -base.depth - gap - top);
    return {
        width,
        height: Math.max(base.height, top + shift),
        depth: Math.max(base.depth, -(bottom + shift)),
        italic: 0,
        characters: false,
    };
};

/**
 * Lays out equations (`m:oMath`) in a row, as Word puts those of one displayed paragraph (`m:oMathPara`) on one line
 * (`word-stops-equations.docx` EQ25c), at a size, in points, or the size all their runs give: how wide they are, and how
 * far their line goes above and below its baseline: as far as their ink, with Cambria Math's line gap above it, or as a
 * line of Cambria Math, whichever is further (`word-equations.docx` EQ2, `word-equations2.docx` EQ9,
 * `word-stops-equations.docx` EQ10 to EQ18, EQ22), with the limits of sums and integrals that don't say where theirs go
 * where the document's maths settings put them (see {@link LimitPlaces}). Or why they can't be laid out
 */
export const layOutEquations = (
    equations: readonly unknown[],
    size: number,
    display = false,
    limits: LimitPlaces = { sums: "undOvr", integrals: "subSup" },
): EquationBox | string => {
    const elements = equations.flatMap((equation) => childrenOf(equation));
    const sizes = elements.filter((element) => "m:r" in element).map((run) => runSizeOf(run["m:r"]));
    // An equation is in the size its runs give, when they all give one (`word-equations2.docx` EQ9e)
    const own = sizes.length > 0 && sizes.every((given) => given !== undefined && given === sizes[0]) ? sizes[0]! : size;
    const style: Style = { level: display ? 0 : 1, cramped: false, display, size: own, limits };
    try {
        const parts = partsOf(elements, style);
        if (parts.length === 0) {
            // Word shows nothing for an equation with nothing in it in a line of text (`word-stops-equations.docx` EQ23)
            return display ? "an empty equation on a line of its own" : { width: 0, ascent: 0, descent: 0 };
        }
        const box = rowOf(parts, style);
        return {
            width: box.width + box.italic,
            ascent: Math.max(inPoints(ASCENT, style), box.height + inPoints(MATH_CONSTANTS.mathLeading, style)),
            descent: Math.max(inPoints(DESCENT, style), box.depth),
        };
    } catch (error) {
        // Why it stops, but a mistake in the layout is thrown as it is
        if (error instanceof Stop) {
            return error.message;
        }
        throw error;
    }
};

/** Lays out an equation (`m:oMath`), as {@link layOutEquations} does */
export const layOutEquation = (equation: unknown, size: number, display = false): EquationBox | string =>
    layOutEquations([equation], size, display);
