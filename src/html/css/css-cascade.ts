/**
 * CSS's cascade: the values each element's properties are given, by the style sheets' rules that match it, the styles
 * its attributes stand for, such as `align`, and its `style` attribute, with the most important first.
 *
 * Rules are matched with css-select. A rule whose selector it can't match, such as one with `::before` or `:hover`, is
 * left out, as it styles no element of the document.
 *
 * @module
 */
// cspell:ignore bgcolor
import { compile } from "css-select";
import { type Selector, parse as parseSelectors } from "css-what";
import type { Element } from "domhandler";

import { expandShorthand } from "./css-shorthands";
import { type Declaration, indexOfTopLevel, parseDeclarations, parseStyleSheet, splitTopLevel } from "./css-syntax";

/**
 * Where a declaration comes from, from the least important: a browser's own style sheet, the styles an element's
 * attributes stand for, such as `align` and `bgcolor`, the document's style sheets, and the element's `style`
 */
export const Origin = {
    UserAgent: 0,
    Presentational: 1,
    Author: 2,
    Inline: 3,
} as const;

/** How important an origin is: one of `Origin`'s values */
type OriginRank = (typeof Origin)[keyof typeof Origin];

/** An element's properties' values, before they are worked out */
export type CascadedStyle = {
    /** Each property's values, the one that wins first, then those it wins over, which are used if it isn't valid */
    readonly values: ReadonlyMap<string, readonly string[]>;
    /** The element's custom properties, such as `--accent`, its own and those it inherits, with `var()` worked out */
    readonly customProperties: ReadonlyMap<string, string>;
};

type CompiledRule = {
    readonly origin: OriginRank;
    readonly specificity: number;
    readonly order: number;
    readonly declarations: readonly Declaration[];
} & {
    /** Whether the rule's selector matches an element */
    readonly matches: (element: Element) => boolean;
};

/** A declaration with what decides how important it is */
type Candidate = {
    readonly declaration: Declaration;
    readonly origin: OriginRank;
    readonly specificity: number;
    readonly order: number;
};

const ID = 1_000_000;
const CLASS = 1_000;
const TYPE = 1;

/** A selector's specificity, as one number: its ids, then its classes, attributes and pseudo-classes, then its types */
const specificityOf = (selector: readonly Selector[]): number =>
    selector.reduce((total, token) => {
        switch (token.type) {
            case "attribute":
                return total + (token.name === "id" && token.action === "equals" ? ID : CLASS);
            case "pseudo":
                // :is(), :not() and :has() are as specific as their most specific selector, and :where() isn't at all
                if (token.name === "where") {
                    return total;
                }
                return total + (Array.isArray(token.data) ? Math.max(...token.data.map(specificityOf)) : CLASS);
            case "tag":
                return total + TYPE;
            default:
                return total;
        }
    }, 0);

/** Compiles the style rules of style sheets, in order, each selector of a rule on its own, as each has a specificity */
const compileRules = (
    styleSheets: readonly { readonly css: string; readonly origin: OriginRank }[],
    firstOrder: number,
): readonly CompiledRule[] => {
    let order = firstOrder;
    return styleSheets.flatMap(({ css, origin }) =>
        parseStyleSheet(css).flatMap(({ selectors, declarations }) => {
            order++;
            const ruleOrder = order;
            return splitTopLevel(selectors, ",").flatMap((text): readonly CompiledRule[] => {
                try {
                    const [selector] = parseSelectors(text);
                    if (selector.some((token) => token.type === "pseudo-element")) {
                        return [];
                    }
                    const matches = compile<Element, Element>([selector], { xmlMode: false });
                    return [{ matches, origin, specificity: specificityOf(selector), order: ruleOrder, declarations }];
                } catch {
                    return [];
                }
            });
        }),
    );
};

// More declarations than a rule has, so a rule's declarations' orders are between its order and the next rule's
const DECLARATIONS = 100_000;

/** Whether a candidate is more important than another: `!important`, then its origin, its specificity and its order */
const compareCandidates = (a: Candidate, b: Candidate): number =>
    Number(b.declaration.important) - Number(a.declaration.important) ||
    // Of important declarations, those of a browser's own style sheet are the most important, but it has none
    b.origin - a.origin ||
    b.specificity - a.specificity ||
    b.order - a.order;

// The longest a value can be with its var()s replaced. A longer one is invalid, as browsers limit them, so custom
// properties that refer to each other many times can't make a value grow without end
const LONGEST_VALUE = 65_536;
// How many var()s can be in each other's fallbacks, and how many custom properties can refer to each other in turn, so
// a long chain of them can't run out of stack. Deeper ones are invalid
const DEEPEST_REFERENCE = 256;

/**
 * A value with each `var()` replaced by the custom property's value, or its fallback when the element has no such
 * property, or undefined when it has neither, as the value is then invalid, as is one longer than browsers allow.
 *
 * @param value - The value, such as `1px solid var(--border-color, black)`
 * @param variableOf - The value of each of the element's custom properties, by its name, with its own `var()`s replaced
 * @param depth - How many fallbacks the value is in
 */
export const substituteVariables = (value: string, variableOf: (name: string) => string | undefined, depth = 0): string | undefined => {
    // Each var() is replaced in turn, without reading the values put in its place again, as theirs are replaced already
    const references = /var\(/gi;
    let substituted = "";
    let from = 0;
    for (let match = references.exec(value); match; match = references.exec(value)) {
        const start = match.index + match[0].length;
        const end = indexOfTopLevel(value, start, ")");
        const [name, ...fallback] = splitTopLevel(value.slice(start, end), ",");
        const replacement =
            variableOf(name.trim()) ??
            (fallback.length > 0 && depth < DEEPEST_REFERENCE
                ? substituteVariables(fallback.join(",").trim(), variableOf, depth + 1)
                : undefined);
        if (replacement === undefined) {
            return undefined;
        }
        substituted += value.slice(from, match.index) + replacement;
        if (substituted.length > LONGEST_VALUE) {
            return undefined;
        }
        from = end + 1;
        // eslint-disable-next-line functional/immutable-data
        references.lastIndex = from;
    }
    substituted += value.slice(from);
    return substituted.length > LONGEST_VALUE ? undefined : substituted;
};

/**
 * The custom properties an element has: those it inherits, and its own, whose `var()`s are worked out with each other,
 * each once. Those that refer to each other in a cycle are invalid, and left out, as are those more than 256 references
 * deep, and those longer than browsers allow.
 */
const customPropertiesOf = (own: ReadonlyMap<string, string>, inherited: ReadonlyMap<string, string>): ReadonlyMap<string, string> => {
    const resolved = new Map<string, string | undefined>();
    // The properties being worked out, each referring to the next, and those found to be in a cycle
    // eslint-disable-next-line functional/prefer-readonly-type
    const resolving: string[] = [];
    const cyclic = new Set<string>();
    const resolve = (name: string): string | undefined => {
        const value = own.get(name);
        if (value === undefined) {
            return inherited.get(name);
        }
        if (resolved.has(name)) {
            return resolved.get(name);
        }
        const index = resolving.indexOf(name);
        if (index !== -1) {
            for (const member of resolving.slice(index)) {
                // eslint-disable-next-line functional/immutable-data
                cyclic.add(member);
            }
            return undefined;
        }
        if (resolving.length >= DEEPEST_REFERENCE) {
            return undefined;
        }
        // eslint-disable-next-line functional/immutable-data
        resolving.push(name);
        const substituted = substituteVariables(value, resolve);
        // eslint-disable-next-line functional/immutable-data
        resolving.pop();
        const result = cyclic.has(name) ? undefined : substituted;
        // eslint-disable-next-line functional/immutable-data
        resolved.set(name, result);
        return result;
    };
    return new Map(
        [...new Set([...inherited.keys(), ...own.keys()])].flatMap((name): readonly (readonly [string, string])[] => {
            const value = resolve(name);
            return value === undefined ? [] : [[name, value]];
        }),
    );
};

/**
 * Creates the cascade of a document: its style sheets' rules, after a browser's own, are compiled once, and matched
 * against each element it is asked for.
 *
 * @param userAgentStyleSheet - The styles a browser gives elements of its own
 * @param styleSheets - The document's style sheets, in order
 * @param presentationalHints - The declarations an element's attributes stand for, such as `align="center"`
 */
export const createCascade = (
    userAgentStyleSheet: CompiledStyleSheet,
    styleSheets: readonly string[],
    presentationalHints: (element: Element) => readonly Declaration[],
): ((element: Element, inherited: ReadonlyMap<string, string>) => CascadedStyle) => {
    const rules = [
        ...userAgentStyleSheet,
        ...compileRules(
            styleSheets.map((css) => ({ css, origin: Origin.Author })),
            1_000_000,
        ),
    ];

    return (element, inherited) => {
        const candidates = [
            ...rules
                .filter((rule) => rule.matches(element))
                .flatMap(({ declarations, origin, specificity, order }) =>
                    // A rule's later declarations come after its earlier ones
                    declarations.map((declaration, index) => ({ declaration, origin, specificity, order: order + index / DECLARATIONS })),
                ),
            ...presentationalHints(element).map((declaration, order) => ({
                declaration,
                origin: Origin.Presentational,
                specificity: 0,
                order,
            })),
            ...parseDeclarations(element.attribs.style ?? "").map((declaration, order) => ({
                declaration,
                origin: Origin.Inline,
                specificity: 0,
                order,
            })),
        ].sort(compareCandidates);

        const custom = new Map<string, string>();
        for (const { declaration } of candidates) {
            if (declaration.property.startsWith("--") && !custom.has(declaration.property)) {
                // eslint-disable-next-line functional/immutable-data
                custom.set(declaration.property, declaration.value);
            }
        }
        const customProperties = customPropertiesOf(custom, inherited);

        const values = new Map<string, readonly string[]>();
        for (const { declaration } of candidates) {
            const value = declaration.property.startsWith("--")
                ? undefined
                : substituteVariables(declaration.value, (name) => customProperties.get(name));
            for (const [property, longhandValue] of (value === undefined ? undefined : expandShorthand(declaration.property, value)) ??
                []) {
                // eslint-disable-next-line functional/immutable-data
                values.set(property, [...(values.get(property) ?? []), longhandValue]);
            }
        }
        return { values, customProperties };
    };
};

/** A style sheet compiled for the cascade, such as a browser's own, which is compiled once for every document */
export type CompiledStyleSheet = readonly CompiledRule[];

/** Compiles a browser's own style sheet */
export const compileUserAgentStyleSheet = (css: string): CompiledStyleSheet => compileRules([{ css, origin: Origin.UserAgent }], 0);
