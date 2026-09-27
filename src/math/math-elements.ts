/**
 * What docx/math's components share: the checks on their arguments, and the elements they are made of. Nothing here is
 * exported from docx/math.
 *
 * @module
 */
import { BuilderElement, type MathComponent, MathRun, Math as OfficeMath, Paragraph, Run, type XmlComponent, createMathBase } from "docx";

/** The options of a {@link BuilderElement}, to build an element before its class calls `super` */
export type ElementOptions = {
    readonly name: string;
    readonly children: readonly XmlComponent[];
};

// Word's limits ([MS-OE376] 7.1.2.34 and 7.1.2.60, [MS-OI29500] 22.1.2.69). The schema has none
export const MAX_MATRIX_ROWS = 256;
export const MAX_MATRIX_COLUMNS = 64;
export const MAX_EQUATION_ARRAY_ROWS = 64;

/**
 * A count of things, such as "1 column" or "3 columns".
 */
export const plural = (count: number, thing: string): string => `${count} ${thing}${count === 1 ? "" : "s"}`;

/**
 * An element whose value is its `m:val`, such as `<m:begChr m:val="("/>`.
 */
export const createValueElement = (name: string, value: string | number): XmlComponent =>
    new BuilderElement<{ readonly value: string | number }>({ name, attributes: { value: { key: "m:val", value } } });

/**
 * Throws for what can't go in an argument: a `Math`, which Word won't open inside math, and a paragraph or a run of
 * document text, which the schema doesn't allow there. Only an argument's own children can be checked.
 */
export const checkArgument = (owner: string, where: string, children: readonly MathComponent[]): void => {
    for (const child of children) {
        if (child instanceof OfficeMath) {
            throw new Error(`${owner}: ${where} holds a Math. Word won't open math inside math, so give the Math's children instead`);
        }
        if (child instanceof Paragraph) {
            throw new Error(`${owner}: ${where} holds a Paragraph. Math goes in a paragraph, not a paragraph in math`);
        }
        if (child instanceof Run) {
            throw new Error(`${owner}: ${where} holds a TextRun or another run of document text, which can't go in math. Use a MathRun`);
        }
    }
};

/**
 * Throws unless a bracket or separator is one character, or none. Characters are counted as code points, so `𝒜` is one.
 */
export const checkCharacter = (owner: string, option: string, value: string): void => {
    if ([...value].length > 1) {
        throw new Error(`${owner}: ${option} is "${value}", which is more than one character. Give one character, or "" for none`);
    }
};

/**
 * Throws unless a value is one of those allowed, for code that isn't type checked.
 */
export const checkOneOf = (owner: string, option: string, value: string, allowed: readonly string[]): void => {
    if (!allowed.includes(value)) {
        throw new Error(`${owner}: ${option} is "${value}", which isn't one of ${allowed.map((one) => `"${one}"`).join(", ")}`);
    }
};

/**
 * An argument (`m:e`). An empty one gets a zero-width space, as LibreOffice can't read an equation with an empty
 * argument, and draws "¿" in its place.
 */
export const createArgument = (children: readonly MathComponent[]): XmlComponent =>
    createMathBase({ children: children.length === 0 ? [new MathRun("​")] : children });

/**
 * Brackets (`m:d`) around arguments, with a separator between them. They grow with their content unless `grow` is
 * false, as Word's do when `m:grow` isn't written.
 */
export const bracketsElement = (
    {
        open,
        close,
        separator,
        grow,
    }: { readonly open: string; readonly close: string; readonly separator?: string; readonly grow?: boolean },
    args: readonly XmlComponent[],
): ElementOptions => ({
    name: "m:d",
    children: [
        new BuilderElement({
            name: "m:dPr",
            children: [
                createValueElement("m:begChr", open),
                ...(separator === undefined ? [] : [createValueElement("m:sepChr", separator)]),
                createValueElement("m:endChr", close),
                ...(grow === false ? [createValueElement("m:grow", 0)] : []),
            ],
        }),
        ...args,
    ],
});
