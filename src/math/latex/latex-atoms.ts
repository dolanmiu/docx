/**
 * What the LaTeX parser reads an equation into, and how that becomes docx's math: runs of text that share a font are
 * joined, scripts go on their bases, and large operators and functions take the math after them as their argument.
 *
 * @module
 */
import {
    type MathComponent,
    MathFunction,
    MathLimitLower,
    MathLimitUpper,
    type MathLimitsPosition,
    MathRun,
    type MathRunOptions,
    MathSubScript,
    MathSubSuperScript,
    MathSuperScript,
} from "docx";

import { MathLargeOperator, type MathLargeOperatorName } from "../math-large-operator";
import type { SymbolRole } from "./latex-symbols";

/** How text is written: its style and alphabet, or as normal text, and whether it is taken literally */
export type Font = Omit<MathRunOptions, "text">;

/** A piece of an equation, as the parser reads it */
export type Atom =
    /** A symbol or a run of text, which is joined to the text around it in the same font */
    | { readonly kind: "text"; readonly text: string; readonly font: Font; readonly role: SymbolRole }
    /** A group in braces, which scripts take as their base, and which is otherwise part of the math around it */
    | { readonly kind: "group"; readonly atoms: readonly Atom[] }
    /** Math already built, such as a fraction or a matrix */
    | { readonly kind: "built"; readonly component: MathComponent; readonly role?: SymbolRole }
    /** A base with a subscript, a superscript or both */
    | { readonly kind: "scripts"; readonly base: readonly Atom[]; readonly sub?: readonly Atom[]; readonly sup?: readonly Atom[] }
    /** A large operator, such as ∑, whose argument is the math after it */
    | {
          readonly kind: "operator";
          readonly operator: MathLargeOperatorName;
          readonly limits?: MathLimitsPosition;
          readonly sub?: readonly Atom[];
          readonly sup?: readonly Atom[];
      }
    /** A function, such as sin or lim, whose argument is the math after it */
    | {
          readonly kind: "function";
          readonly name: readonly Atom[];
          /** Whether its limits go below it, as lim's do, rather than to its right */
          readonly limitsBelow: boolean;
          readonly sub?: readonly Atom[];
          readonly sup?: readonly Atom[];
      }
    /** An equation number, from `\tag`, which the row it is in takes */
    | { readonly kind: "tag"; readonly text: string };

/** The atoms with a subscript or superscript of their own, rather than a base in a script */
export type AtomWithLimits = Extract<Atom, { readonly kind: "operator" | "function" }>;

const ZERO_WIDTH_SPACE = "\u200B";

/**
 * The part an atom plays, which says where an operator's argument ends. A script's is its base's, so the bracket in
 * `)^2` still closes.
 */
const roleOf = (atom: Atom): SymbolRole => {
    switch (atom.kind) {
        case "text":
            return atom.role;
        case "built":
            return atom.role ?? "ordinary";
        case "scripts":
            return atom.base.length === 1 ? roleOf(atom.base[0]) : "ordinary";
        default:
            return "ordinary";
    }
};

/**
 * Where the argument of the operator or function before `start` ends. LaTeX doesn't say, so it goes as far as TeX's
 * spacing suggests: to a relation, a + or −, or punctuation, or to another operator or function, outside brackets.
 * So ∑ᵢ aᵢ + b takes aᵢ, ∫ f(x) dx takes f(x) dx, and sin(x + y) takes (x + y). An operator that comes first is part
 * of the argument, as in ∑ᵢ ∑ⱼ aᵢⱼ, and so is a sign, as in sin −x.
 */
const argumentEnd = (atoms: readonly Atom[], start: number): number => {
    let depth = 0;
    for (let index = start; index < atoms.length; index++) {
        const atom = atoms[index];
        const role = roleOf(atom);
        if (depth === 0) {
            if (role === "relation" || role === "punctuation" || role === "close") {
                return index;
            }
            if (index > start && (role === "additive" || atom.kind === "operator" || atom.kind === "function")) {
                return index;
            }
        }
        if (role === "open") {
            depth++;
        } else if (role === "close") {
            depth--;
        }
    }
    return atoms.length;
};

/** An argument's math, with a zero-width space when it is empty, which LibreOffice needs to read the equation */
export const orSpace = (children: readonly MathComponent[]): readonly MathComponent[] =>
    children.length === 0 ? [new MathRun(ZERO_WIDTH_SPACE)] : children;

const isPlain = (font: Font): boolean => Object.values(font).every((value) => value === undefined || value === false);

const sameFont = (one: Font, other: Font): boolean =>
    one.style === other.style &&
    one.script === other.script &&
    !!one.normalText === !!other.normalText &&
    !!one.literal === !!other.literal;

const createRun = (text: string, font: Font): MathRun => new MathRun(isPlain(font) ? text : { text, ...font });

const withScripts = (base: readonly MathComponent[], sub: readonly Atom[] | undefined, sup: readonly Atom[] | undefined): MathComponent => {
    const children = orSpace(base);
    if (sub !== undefined && sup !== undefined) {
        return new MathSubSuperScript({ children, subScript: orSpace(atomsToMath(sub)), superScript: orSpace(atomsToMath(sup)) });
    }
    if (sub !== undefined) {
        return new MathSubScript({ children, subScript: orSpace(atomsToMath(sub)) });
    }
    // A script atom has a subscript, a superscript or both
    return new MathSuperScript({ children, superScript: orSpace(atomsToMath(sup!)) });
};

const createOperator = (atom: AtomWithLimits, argument: readonly MathComponent[]): MathComponent => {
    if (atom.kind === "operator") {
        return new MathLargeOperator({
            operator: atom.operator,
            limits: atom.limits,
            subScript: atom.sub && orSpace(atomsToMath(atom.sub)),
            superScript: atom.sup && orSpace(atomsToMath(atom.sup)),
            children: argument,
        });
    }

    const name = atomsToMath(atom.name);
    const hasScripts = atom.sub !== undefined || atom.sup !== undefined;
    const below = atom.sub === undefined ? name : [new MathLimitLower({ children: name, limit: orSpace(atomsToMath(atom.sub)) })];
    const limited = atom.sup === undefined ? below : [new MathLimitUpper({ children: below, limit: orSpace(atomsToMath(atom.sup)) })];
    const scripted = hasScripts ? [withScripts(name, atom.sub, atom.sup)] : name;

    return new MathFunction({ name: atom.limitsBelow ? limited : scripted, children: orSpace(argument) });
};

/** A piece of written math: text, which is joined to the text next to it in the same font, or a component */
type Piece =
    | { readonly kind: "text"; readonly text: string; readonly font: Font }
    | { readonly kind: "component"; readonly component: MathComponent };

/**
 * Turns atoms into pieces of math. A group's pieces are among those around it, so its text can join theirs, as in
 * `a{b}c`.
 */
const atomsToPieces = (atoms: readonly Atom[]): readonly Piece[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const pieces: Piece[] = [];

    for (let index = 0; index < atoms.length; index++) {
        const atom = atoms[index];
        switch (atom.kind) {
            case "text":
                // eslint-disable-next-line functional/immutable-data
                pieces.push({ kind: "text", text: atom.text, font: atom.font });
                break;
            case "group":
                // eslint-disable-next-line functional/immutable-data
                pieces.push(...atomsToPieces(atom.atoms));
                break;
            case "built":
                // eslint-disable-next-line functional/immutable-data
                pieces.push({ kind: "component", component: atom.component });
                break;
            case "scripts":
                // eslint-disable-next-line functional/immutable-data
                pieces.push({ kind: "component", component: withScripts(atomsToMath(atom.base), atom.sub, atom.sup) });
                break;
            case "operator":
            case "function": {
                const end = argumentEnd(atoms, index + 1);
                // eslint-disable-next-line functional/immutable-data
                pieces.push({ kind: "component", component: createOperator(atom, atomsToMath(atoms.slice(index + 1, end))) });
                index = end - 1;
                break;
            }
            default:
                // A tag is taken by its row, and written as the row's equation number
                break;
        }
    }

    return pieces;
};

/**
 * Turns atoms into docx's math, with text next to text in the same font joined in one run.
 */
export const atomsToMath = (atoms: readonly Atom[]): readonly MathComponent[] =>
    atomsToPieces(atoms)
        .reduce<readonly Piece[]>((joined, piece) => {
            const last = joined[joined.length - 1];
            return piece.kind === "text" && last?.kind === "text" && sameFont(last.font, piece.font)
                ? [...joined.slice(0, -1), { ...last, text: last.text + piece.text }]
                : [...joined, piece];
        }, [])
        .map((piece) => (piece.kind === "text" ? createRun(piece.text, piece.font) : piece.component));
