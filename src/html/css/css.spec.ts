// cspell:ignore bgcolor
import { Element as DomElement, type Element } from "domhandler";
import { parse } from "parse5";
import { adapter } from "parse5-htmlparser2-tree-adapter";
import { describe, expect, it } from "vitest";

import { type ComputedStyle, ROOT_STYLE, computeStyle } from "./computed-style";
import { compileUserAgentStyleSheet, createCascade, substituteVariables } from "./css-cascade";
import { expandShorthand } from "./css-shorthands";
import { isForPrint, parseDeclarations, parseStyleSheet, splitTopLevel, withoutComments } from "./css-syntax";
import { isCssWideKeyword, listOf, parseLength, parseNumber, toPoints, unquote, wordsOf } from "./css-values";
import { presentationalHints } from "./presentational-hints";
import { descendantsOf } from "../dom";

/**
 * The style of an element with these declarations, such as `"color: red; font-size: 2em"`, in an element with the
 * parent's style. A property's later declarations are more important than its earlier ones, as in a `style` attribute.
 */
const style = (css: string, parent: ComputedStyle = ROOT_STYLE, language?: string): ComputedStyle => {
    const declarations = [...parseDeclarations(css)].reverse();
    const properties = [...new Set(declarations.map(({ property }) => property))];
    return computeStyle(
        {
            values: new Map(
                properties.map((property) => [
                    property,
                    declarations.filter((declaration) => declaration.property === property).map(({ value }) => value),
                ]),
            ),
            customProperties: new Map(),
        },
        parent,
        language,
    );
};

/** The elements of parsed HTML by their ids */
const elementsOf = (html: string): ((id: string) => Element) => {
    // The document's own node has no attributes
    const elements = descendantsOf(parse(html, { treeAdapter: adapter }) as unknown as Element).slice(1);
    return (id) => elements.find((element) => element.attribs.id === id)!;
};

describe("CSS", () => {
    describe("syntax", () => {
        it("leaves out comments, which separate what is either side of them, and one that isn't closed", () => {
            expect(withoutComments("a/* x */b 'c/*d*/' /* open")).toBe("a b 'c/*d*/'  ");
        });

        it("keeps strings, with their escapes, and strings that a new line ends", () => {
            expect(withoutComments('"a\\"/*b*/" \'c\nd')).toBe('"a\\"/*b*/" \'c\nd');
        });

        it("splits at separators that aren't in strings or brackets, or escaped", () => {
            expect(splitTopLevel('a;b(c;d);"e;f";g\\;h;[i;j]', ";")).toEqual(["a", "b(c;d)", '"e;f"', "g\\;h", "[i;j]"]);
            expect(splitTopLevel("a)b;c", ";")).toEqual(["a)b", "c"]);
        });

        it("reads declarations, with !important, custom properties' case, and properties in any case", () => {
            expect(parseDeclarations("COLOR: Red; --Accent: Blue ; font-weight: bold ! IMPORTANT")).toEqual([
                { property: "color", value: "Red", important: false },
                { property: "--Accent", value: "Blue", important: false },
                { property: "font-weight", value: "bold", important: true },
            ]);
        });

        it("leaves out declarations without a colon, a property, a value, or with a block in them", () => {
            expect(parseDeclarations("color; :red; 1x: y; color: ; & p { color: red }; a: b {c}")).toEqual([]);
        });

        it("keeps colons in values, such as in a URL", () => {
            expect(parseDeclarations("background: url(http://a.com/x.png)")).toEqual([
                { property: "background", value: "url(http://a.com/x.png)", important: false },
            ]);
        });

        it("reads a style sheet's rules, with a block that isn't closed at its end", () => {
            expect(parseStyleSheet("a { color: red } b { color: blue")).toEqual([
                { selectors: "a", declarations: [{ property: "color", value: "red", important: false }] },
                { selectors: "b", declarations: [{ property: "color", value: "blue", important: false }] },
            ]);
        });

        it("leaves out rules with no selector, and statements", () => {
            expect(parseStyleSheet("{ color: red } @charset 'x'; @namespace svg url(x); a { b: c }")).toEqual([
                { selectors: "a", declarations: [{ property: "b", value: "c", important: false }] },
            ]);
        });

        it("knows which media are print", () => {
            expect(isForPrint("")).toBe(true);
            expect(isForPrint("print")).toBe(true);
            expect(isForPrint("only print and (orientation: portrait)")).toBe(true);
            expect(isForPrint("ALL")).toBe(true);
            expect(isForPrint("screen, print")).toBe(true);
            expect(isForPrint("screen")).toBe(false);
            expect(isForPrint("all and (min-width: 600px)")).toBe(false);
            expect(isForPrint("not print")).toBe(false);
        });
    });

    describe("values", () => {
        it("splits a value into its words and its list's items", () => {
            expect(wordsOf(" 1px  solid rgb(0, 0, 0) ")).toEqual(["1px", "solid", "rgb(0, 0, 0)"]);
            expect(listOf("'a, b', c ,d")).toEqual(["'a, b'", "c", "d"]);
        });

        it("reads numbers", () => {
            expect(parseNumber("1.5")).toBe(1.5);
            expect(parseNumber("-.5e2")).toBe(-50);
            expect(parseNumber("1px")).toBeUndefined();
            expect(parseNumber("x")).toBeUndefined();
        });

        it.each([
            ["12pt", { unit: "pt", value: 12 }],
            ["16px", { unit: "pt", value: 12 }],
            ["1in", { unit: "pt", value: 72 }],
            ["1pc", { unit: "pt", value: 12 }],
            ["2.54cm", { unit: "pt", value: 72 }],
            ["25.4mm", { unit: "pt", value: 72 }],
            ["4Q", { unit: "pt", value: 72 / 25.4 }],
            ["2em", { unit: "em", value: 2 }],
            ["2ex", { unit: "em", value: 1 }],
            ["2ch", { unit: "em", value: 1 }],
            ["1rem", { unit: "rem", value: 1 }],
            ["50%", { unit: "%", value: 50 }],
            ["0", { unit: "pt", value: 0 }],
            ["2PX", { unit: "pt", value: 1.5 }],
        ])("reads %s", (value, length) => {
            expect(parseLength(value)).toEqual(length);
        });

        it.each(["1", "10vw", "5vh", "x", "", "1 px", "calc()"])("doesn't read %j as a length", (value) => {
            expect(parseLength(value)).toBeUndefined();
        });

        it.each([
            ["calc(10px + 5px)", { unit: "pt", value: 11.25 }],
            ["calc(1in - 36pt)", { unit: "pt", value: 36 }],
            ["calc(2 * 3em / 4)", { unit: "em", value: 1.5 }],
            ["calc((1pt + 2pt) * 2)", { unit: "pt", value: 6 }],
            ["calc(-2pt + 3pt)", { unit: "pt", value: 1 }],
            ["calc(50% - 10%)", { unit: "%", value: 40 }],
        ])("works out %s", (value, length) => {
            expect(parseLength(value)).toEqual(length);
        });

        it.each(["calc(100% - 2em)", "calc(1pt / 0)", "calc(2 / 1pt)", "calc(1pt * 2pt)", "calc(x)", "calc(1pt + y)"])(
            "doesn't work out %s",
            (value) => {
                expect(parseLength(value)).toBeUndefined();
            },
        );

        it("turns lengths into points", () => {
            expect(toPoints({ unit: "pt", value: 3 }, 10, 12)).toBe(3);
            expect(toPoints({ unit: "em", value: 2 }, 10, 12)).toBe(20);
            expect(toPoints({ unit: "rem", value: 2 }, 10, 12)).toBe(24);
            expect(toPoints({ unit: "%", value: 50 }, 10, 12, 30)).toBe(15);
            expect(toPoints({ unit: "%", value: 50 }, 10, 12)).toBeUndefined();
        });

        it("knows CSS's keywords for every property, and reads strings", () => {
            expect(["inherit", "INITIAL", " unset ", "revert", "revert-layer"].every(isCssWideKeyword)).toBe(true);
            expect(isCssWideKeyword("auto")).toBe(false);
            expect(unquote(' "a \\"b\\"" ')).toBe('a "b"');
            expect(unquote("'c'")).toBe("c");
            expect(unquote("d")).toBe("d");
        });
    });

    describe("shorthands", () => {
        it("expands margin and padding of one to four values", () => {
            expect(expandShorthand("margin", "1px")).toEqual([
                ["margin-top", "1px"],
                ["margin-right", "1px"],
                ["margin-bottom", "1px"],
                ["margin-left", "1px"],
            ]);
            expect(expandShorthand("padding", "1px 2px 3px")?.map(([, value]) => value)).toEqual(["1px", "2px", "3px", "2px"]);
            expect(expandShorthand("padding", "1px 2px 3px 4px 5px")).toBeUndefined();
            expect(expandShorthand("margin", "")).toBeUndefined();
        });

        it("gives a CSS-wide keyword to each property a shorthand sets", () => {
            expect(expandShorthand("font", "inherit")).toEqual([
                ["font-style", "inherit"],
                ["font-variant-caps", "inherit"],
                ["font-weight", "inherit"],
                ["font-size", "inherit"],
                ["line-height", "inherit"],
                ["font-family", "inherit"],
            ]);
            expect(expandShorthand("border", " INITIAL ")).toHaveLength(12);
            expect(new Set(expandShorthand("border", " INITIAL ")!.map(([, value]) => value))).toEqual(new Set(["INITIAL"]));
            expect(expandShorthand("background", "unset")).toEqual([["background-color", "unset"]]);
            expect(expandShorthand("text-decoration", "revert")).toEqual([
                ["text-decoration-line", "revert"],
                ["text-decoration-style", "revert"],
                ["text-decoration-color", "revert"],
            ]);
            expect(expandShorthand("margin-inline", "inherit")).toEqual([
                ["margin-left", "inherit"],
                ["margin-right", "inherit"],
            ]);
            expect(expandShorthand("page-break-before", "inherit")).toEqual([["break-before", "inherit"]]);
            expect(expandShorthand("color", "inherit")).toEqual([["color", "inherit"]]);
        });

        it("expands the logical margins and paddings as those of left-to-right text", () => {
            expect(expandShorthand("margin-inline", "1px 2px")).toEqual([
                ["margin-left", "1px"],
                ["margin-right", "2px"],
            ]);
            expect(expandShorthand("padding-block", "3px")).toEqual([
                ["padding-top", "3px"],
                ["padding-bottom", "3px"],
            ]);
            expect(expandShorthand("margin-block", "8px 9px")).toEqual([
                ["margin-top", "8px"],
                ["margin-bottom", "9px"],
            ]);
            expect(expandShorthand("padding-inline-start", "4px")).toEqual([["padding-left", "4px"]]);
            expect(expandShorthand("margin-inline-end", "5px")).toEqual([["margin-right", "5px"]]);
            expect(expandShorthand("margin-block-start", "6px")).toEqual([["margin-top", "6px"]]);
            expect(expandShorthand("padding-block-end", "7px")).toEqual([["padding-bottom", "7px"]]);
        });

        it("expands border in any order, with what it leaves out as its initial value", () => {
            expect(expandShorthand("border-top", "red 2px dashed")).toEqual([
                ["border-top-width", "2px"],
                ["border-top-style", "dashed"],
                ["border-top-color", "red"],
            ]);
            expect(expandShorthand("border-left", "solid")).toEqual([
                ["border-left-width", "medium"],
                ["border-left-style", "solid"],
                ["border-left-color", "currentcolor"],
            ]);
            expect(expandShorthand("border", "thick double")?.length).toBe(12);
        });

        it("doesn't expand a border with two of a part, or a part it can't read", () => {
            expect(expandShorthand("border", "1px 2px solid")).toBeUndefined();
            expect(expandShorthand("border", "solid dotted")).toBeUndefined();
            expect(expandShorthand("border", "red blue")).toBeUndefined();
            expect(expandShorthand("border", "1px solid nonsense")).toBeUndefined();
            expect(expandShorthand("border", "")).toBeUndefined();
        });

        it("expands the logical borders, and the borders' widths, styles and colours", () => {
            expect(expandShorthand("border-inline-start", "1px solid")?.[0]).toEqual(["border-left-width", "1px"]);
            expect(expandShorthand("border-inline-end", "1px solid")?.[0]).toEqual(["border-right-width", "1px"]);
            expect(expandShorthand("border-block-start", "1px solid")?.[0]).toEqual(["border-top-width", "1px"]);
            expect(expandShorthand("border-block-end", "1px solid")?.[0]).toEqual(["border-bottom-width", "1px"]);
            expect(expandShorthand("border-color", "red blue")).toEqual([
                ["border-top-color", "red"],
                ["border-right-color", "blue"],
                ["border-bottom-color", "red"],
                ["border-left-color", "blue"],
            ]);
            expect(expandShorthand("border-style", "solid")?.[3]).toEqual(["border-left-style", "solid"]);
            expect(expandShorthand("border-width", "1px 2px 3px 4px")?.[3]).toEqual(["border-left-width", "4px"]);
        });

        it("expands font, with its style, variant and weight in any order, its size and line height, and its families", () => {
            expect(expandShorthand("font", "italic small-caps 600 12px / 1.5 'Open Sans', sans-serif")).toEqual([
                ["font-style", "italic"],
                ["font-variant-caps", "small-caps"],
                ["font-weight", "600"],
                ["font-size", "12px"],
                ["line-height", "1.5"],
                ["font-family", "'Open Sans', sans-serif"],
            ]);
            expect(expandShorthand("font", "x-large Georgia")).toEqual([
                ["font-style", "normal"],
                ["font-variant-caps", "normal"],
                ["font-weight", "normal"],
                ["font-size", "x-large"],
                ["line-height", "normal"],
                ["font-family", "Georgia"],
            ]);
            expect(expandShorthand("font", "normal bolder 1em/2em a")?.[2]).toEqual(["font-weight", "bolder"]);
        });

        it("doesn't expand a font without a size and a family, or a system font", () => {
            expect(expandShorthand("font", "bold Arial")).toBeUndefined();
            expect(expandShorthand("font", "12px")).toBeUndefined();
            expect(expandShorthand("font", "caption")).toBeUndefined();
        });

        it("expands font-variant into small caps or not", () => {
            expect(expandShorthand("font-variant", "small-caps")).toEqual([["font-variant-caps", "small-caps"]]);
            expect(expandShorthand("font-variant", "all-small-caps oldstyle-nums")).toEqual([["font-variant-caps", "small-caps"]]);
            expect(expandShorthand("font-variant", "normal")).toEqual([["font-variant-caps", "normal"]]);
        });

        it("expands background into its last layer's colour, or transparent", () => {
            expect(expandShorthand("background", "url(a.png) no-repeat, #fff url(b.png)")).toEqual([["background-color", "#fff"]]);
            expect(expandShorthand("background", "url(a.png)")).toEqual([["background-color", "transparent"]]);
            expect(expandShorthand("background", "")).toEqual([["background-color", "transparent"]]);
        });

        it("expands text-decoration's lines, style and colour", () => {
            expect(expandShorthand("text-decoration", "underline line-through wavy red")).toEqual([
                ["text-decoration-line", "underline line-through"],
                ["text-decoration-style", "wavy"],
                ["text-decoration-color", "red"],
            ]);
            expect(expandShorthand("text-decoration", "none")).toEqual([
                ["text-decoration-line", "none"],
                ["text-decoration-style", "solid"],
                ["text-decoration-color", "currentcolor"],
            ]);
            expect(expandShorthand("text-decoration", "solid")?.[0]).toEqual(["text-decoration-line", "none"]);
        });

        it("expands list-style into its type", () => {
            expect(expandShorthand("list-style", "url(x.png) square inside")).toEqual([["list-style-type", "square"]]);
            expect(expandShorthand("list-style", "none outside")).toEqual([["list-style-type", "none"]]);
            expect(expandShorthand("list-style", "inside")).toEqual([["list-style-type", "none"]]);
        });

        it("expands the page-break properties into the break properties", () => {
            expect(expandShorthand("page-break-before", "always")).toEqual([["break-before", "page"]]);
            expect(expandShorthand("page-break-after", "Left")).toEqual([["break-after", "page"]]);
            expect(expandShorthand("page-break-inside", "avoid")).toEqual([["break-inside", "avoid"]]);
            expect(expandShorthand("page-break-after", "auto")).toEqual([["break-after", "auto"]]);
            expect(expandShorthand("page-break-after", "other")).toEqual([["break-after", "other"]]);
        });

        it("keeps a property that isn't a shorthand as it is", () => {
            expect(expandShorthand("color", "red")).toEqual([["color", "red"]]);
        });
    });

    describe("cascade", () => {
        const cascadeOf = (html: string, css: readonly string[] = []) => {
            const element = elementsOf(html);
            return {
                element,
                cascade: createCascade(compileUserAgentStyleSheet("b { font-weight: bold } p { color: gray }"), css, presentationalHints),
            };
        };

        it("gives a declaration's values in order of how important they are", () => {
            const { element, cascade } = cascadeOf('<p id="a" style="color: red; color: blue">x</p>', [
                "#a { color: green } p { color: yellow }",
            ]);
            expect(cascade(element("a"), new Map()).values.get("color")).toEqual(["blue", "red", "green", "yellow", "gray"]);
        });

        it("ranks :where() as not specific, and :is() and :not() as their most specific selector", () => {
            const { element, cascade } = cascadeOf('<p id="a" class="c">x</p>', [
                ":where(#a) { color: a } p { color: b } :is(.c, #a) { color: c } :not(.d) { color: d }",
            ]);
            expect(cascade(element("a"), new Map()).values.get("color")).toEqual(["c", "d", "b", "a", "gray"]);
        });

        it("works out custom properties, with those it inherits, and var() in their values", () => {
            const { element, cascade } = cascadeOf('<p id="a" style="--b: var(--a) 2px; color: var(--b)">x</p>');
            const { values, customProperties } = cascade(element("a"), new Map([["--a", "1px"]]));
            expect(customProperties).toEqual(
                new Map([
                    ["--a", "1px"],
                    ["--b", "1px 2px"],
                ]),
            );
            expect(values.get("color")).toEqual(["1px 2px", "gray"]);
        });

        it("expands shorthands with var() in them after working them out", () => {
            const { element, cascade } = cascadeOf('<p id="a" style="--w: 3px; border: var(--w) solid">x</p>');
            expect(cascade(element("a"), new Map()).values.get("border-top-width")).toEqual(["3px"]);
        });

        it("replaces each var() in a value, its fallbacks' too, and none it can't", () => {
            const variables = new Map([
                ["--a", "1"],
                ["--b", "2"],
            ]);
            const lookUp = (name: string): string | undefined => variables.get(name);
            expect(substituteVariables("var(--a) var( --b ) VAR(--c, var(--a))", lookUp)).toBe("1 2 1");
            expect(substituteVariables("var(--c, 3, 4)", lookUp)).toBe("3, 4");
            expect(substituteVariables("var(--c)", lookUp)).toBeUndefined();
            expect(substituteVariables("plain", lookUp)).toBe("plain");
            expect(substituteVariables("var(--a", lookUp)).toBe("1");
        });

        it("doesn't replace the var()s in what it puts in a value, as custom properties' values have theirs replaced", () => {
            expect(substituteVariables("var(--a) var(--b)", (name) => (name === "--a" ? "var(--b)" : "2"))).toBe("var(--b) 2");
        });

        it("replaces many var()s, and fallbacks in each other, without running out of stack, and leaves out ones too deep", () => {
            const lookUp = (name: string): string | undefined => (name === "--a" ? "1" : undefined);
            expect(substituteVariables(Array.from({ length: 50_000 }, () => "var(--a)").join(""), lookUp)).toBe("1".repeat(50_000));
            const nested = (depth: number): string => `${"var(--x, ".repeat(depth)}1${")".repeat(depth)}`;
            expect(substituteVariables(nested(32), lookUp)).toBe("1");
            expect(substituteVariables(nested(33), lookUp)).toBeUndefined();
            expect(substituteVariables(nested(5_000), lookUp)).toBeUndefined();
        });

        it("leaves out a value longer than browsers allow, as one that refers to custom properties many times would be", () => {
            const lookUp = (): string => "x".repeat(1_000);
            expect(substituteVariables(Array.from({ length: 65 }, () => "var(--a)").join(""), lookUp)).toHaveLength(65_000);
            expect(substituteVariables(Array.from({ length: 66 }, () => "var(--a)").join(""), lookUp)).toBeUndefined();
            expect(substituteVariables(`var(--a)${"y".repeat(65_000)}`, lookUp)).toBeUndefined();
        });

        it("works out custom properties that double each other once each, leaving out those that grow too long", () => {
            const declarations = Array.from({ length: 41 }, (_, index) =>
                index === 0 ? "--a0: x" : `--a${index}: var(--a${index - 1}) var(--a${index - 1})`,
            );
            const { element, cascade } = cascadeOf(`<p id="a" style="${declarations.join("; ")}; color: var(--a40, red)">x</p>`);
            // Worked out more than once each, they would take far longer than the test's time
            const { values, customProperties } = cascade(element("a"), new Map());
            expect(customProperties.get("--a10")).toHaveLength(2 ** 11 - 1);
            expect(customProperties.has("--a16")).toBe(false);
            expect(customProperties.has("--a40")).toBe(false);
            expect(values.get("color")).toEqual(["red", "gray"]);
        });

        it("leaves out a custom property that is initial, so a var() of it falls back, and inherits one that is inherit, unset or revert", () => {
            const { element, cascade } = cascadeOf(
                '<p id="a" style="--tone: initial; --a: inherit; --b: UNSET; --c: revert ; --d: inherit; color: var(--tone, blue)">x</p>',
            );
            const { values, customProperties } = cascade(
                element("a"),
                new Map([
                    ["--tone", "red"],
                    ["--a", "1"],
                    ["--b", "2"],
                    ["--c", "3"],
                ]),
            );
            expect(customProperties).toEqual(
                new Map([
                    ["--a", "1"],
                    ["--b", "2"],
                    ["--c", "3"],
                ]),
            );
            expect(values.get("color")).toEqual(["blue", "gray"]);
        });

        it("leaves out each custom property in a cycle, though it has a fallback, and keeps those that fall back past it", () => {
            const { element, cascade } = cascadeOf(
                '<p id="a" style="--a: var(--b, 1); --b: var(--c); --c: var(--a); --d: var(--a, 2); --e: 3">x</p>',
            );
            expect(cascade(element("a"), new Map()).customProperties).toEqual(
                new Map([
                    ["--d", "2"],
                    ["--e", "3"],
                ]),
            );
        });

        it("works out a long chain of custom properties without running out of stack, leaving out those too deep", () => {
            const declarations = Array.from({ length: 2_000 }, (_, index) =>
                index === 0 ? "--c0: 1" : `--c${index}: var(--c${index - 1})`,
            );
            const { element, cascade } = cascadeOf(`<p id="a" style="${declarations.join("; ")}">x</p>`);
            const { customProperties } = cascade(element("a"), new Map());
            expect(customProperties.get("--c0")).toBe("1");
            expect(customProperties.get("--c1999")).toBeUndefined();
        });
    });

    describe("presentational hints", () => {
        it("reads font sizes of 1 to 7, relative ones, and none that aren't numbers", () => {
            const element = elementsOf('<font id="a" size="9">x</font><font id="b" size="-9">y</font><font id="c" size="big">z</font>');
            expect(presentationalHints(element("a"))).toEqual([{ property: "font-size", value: "xxx-large", important: false }]);
            expect(presentationalHints(element("b"))).toEqual([{ property: "font-size", value: "x-small", important: false }]);
            expect(presentationalHints(element("c"))).toEqual([]);
        });

        it("gives cells their table's borders and padding, and none to a cell that isn't in a table", () => {
            const element = elementsOf('<table border="3" cellpadding="4"><tr><td id="a">x</td></tr></table>');
            expect(presentationalHints(element("a"))).toEqual([
                { property: "border", value: "1px solid", important: false },
                { property: "padding", value: "4px", important: false },
            ]);
        });

        it("reads widths and heights as pixels or percentages, and leaves out those that aren't numbers", () => {
            const element = elementsOf('<img id="a" width="50%" height="20.5"><img id="b" width="wide">');
            expect(presentationalHints(element("a"))).toEqual([
                { property: "width", value: "50%", important: false },
                { property: "height", value: "20.5px", important: false },
            ]);
            expect(presentationalHints(element("b"))).toEqual([]);
        });

        it("gives a cell that isn't in a table no borders or padding", () => {
            expect(presentationalHints(new DomElement("td", {}))).toEqual([]);
        });

        it("leaves out align values it doesn't know, and attributes on elements they aren't for", () => {
            const element = elementsOf('<p id="a" align="middle" bgcolor="red" valign="top">x</p><span id="b" width="10">y</span>');
            expect(presentationalHints(element("a"))).toEqual([]);
            expect(presentationalHints(element("b"))).toEqual([]);
        });
    });

    describe("computed style", () => {
        it("has nothing the HTML doesn't say, so the document's styles decide it", () => {
            expect(style("")).toEqual({
                ...ROOT_STYLE,
                display: "inline",
                margin: {},
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                border: {},
            });
        });

        it.each([
            ["bolder", 300, 400],
            ["bolder", 500, 700],
            ["bolder", 700, 900],
            ["lighter", 300, 100],
            ["lighter", 600, 400],
            ["lighter", 800, 700],
            ["0", 400, 400],
            ["1001", 400, 400],
        ])("works out font-weight: %s of a parent's %i as %i", (weight, parent, expected) => {
            expect(style(`font-weight: ${weight}`, { ...ROOT_STYLE, fontWeight: parent }).fontWeight).toBe(expected);
        });

        it("leaves out negative font sizes, and keeps sizes within Word's", () => {
            expect(style("font-size: -2px").fontSize).toBeUndefined();
            expect(style("font-size: 5000pt").fontSize).toBe(1638);
            expect(style("font-size: 0.1pt").fontSize).toBe(1);
        });

        it("reads border widths' keywords, and leaves out a border of a transparent colour", () => {
            expect(style("border-top-style: solid; border-top-width: thick").border.top).toEqual({
                style: "solid",
                width: 3.75,
                color: "000000",
            });
            expect(style("border-top-style: solid; border-top-width: medium").border.top?.width).toBe(2.25);
            expect(style("border-top-style: solid").border.top?.width).toBe(2.25);
            expect(style("border-top-style: solid; border-top-color: transparent").border.top).toBeUndefined();
            expect(style("border-top-style: hidden").border.top).toBeUndefined();
        });

        it("reads text decoration lines, and leaves out those it doesn't know", () => {
            expect(style("text-decoration-line: overline").decorations).toEqual({ overline: { style: "solid" } });
            expect(style("text-decoration-line: underline sideways").decorations).toEqual({});
            expect(style("text-decoration-line: underline; text-decoration-color: transparent").decorations).toEqual({
                underline: { style: "solid" },
            });
        });

        it("reads breaks before and after columns and pages, and passes over those it doesn't know", () => {
            expect(style("break-before: column; break-after: recto")).toMatchObject({ breakBefore: "column", breakAfter: "page" });
            expect(style("break-before: avoid-column; break-before: sideways").breakBefore).toBeUndefined();
            expect(style("break-inside: avoid-column").breakInside).toBe("avoid");
            expect(style("break-inside: auto").breakInside).toBeUndefined();
        });

        it("reads float's logical values", () => {
            expect(style("float: inline-start").float).toBe("left");
            expect(style("float: inline-end").float).toBe("right");
            expect(style("float: none").float).toBeUndefined();
        });

        it("reads vertical-align's keywords for text, and raises by percentages of the line", () => {
            expect(style("vertical-align: text-top").verticalAlign).toBe("top");
            expect(style("vertical-align: text-bottom").verticalAlign).toBe("bottom");
            expect(style("vertical-align: baseline").verticalAlign).toBeUndefined();
            expect(style("vertical-align: 50%; font-size: 10pt").verticalAlign).toEqual({ raise: 5 });
            expect(style("vertical-align: sideways").verticalAlign).toBeUndefined();
        });

        it("leaves out a negative line height, and inherits a multiple", () => {
            expect(style("line-height: -1").lineHeight).toBeUndefined();
            expect(style("line-height: -1px").lineHeight).toBeUndefined();
            expect(style("", style("line-height: 2")).lineHeight).toEqual({ multiple: 2 });
        });

        it("reads text-align: match-parent as its parent's", () => {
            expect(style("text-align: match-parent", style("text-align: right")).textAlign).toBe("right");
            expect(style("text-align: -moz-center").textAlign).toBe("center");
        });

        it("reads letter-spacing: normal as none, and a text indent's length", () => {
            expect(style("letter-spacing: normal").letterSpacing).toBe(0);
            expect(style("text-indent: 1em hanging; font-size: 10pt").textIndent).toBe(10);
            expect(style("text-indent: ").textIndent).toBeUndefined();
        });

        it("reads list-style-type's keywords and strings, and passes over other values", () => {
            expect(style("list-style-type: Lower-Roman").listStyleType).toBe("lower-roman");
            expect(style("list-style-type: '-'").listStyleType).toBe("'-'");
            expect(style("list-style-type: symbols(cyclic '*')").listStyleType).toBeUndefined();
        });

        it("reads sizes, and leaves out negative ones", () => {
            expect(style("width: 50%; height: 2em; max-width: none; min-height: -1px")).toMatchObject({
                width: { percent: 50 },
                height: { points: 24 },
                maxWidth: undefined,
                minHeight: undefined,
            });
        });

        it("inherits non-inherited properties with inherit, and gives them their initial values with initial", () => {
            const parent = style("background-color: red; margin-left: 1pt");
            expect(style("background-color: inherit; margin-left: inherit", parent)).toMatchObject({
                backgroundColor: "FF0000",
                margin: { left: 1 },
            });
            expect(style("font-weight: initial; white-space: initial", style("font-weight: bold; white-space: pre"))).toMatchObject({
                fontWeight: 400,
                whiteSpace: "normal",
            });
            expect(style("font-style: initial", style("font-style: italic")).italic).toBe(false);
        });

        it("keeps the text's language from lang, or its parent's", () => {
            expect(style("", style("", ROOT_STYLE, "fr"), undefined).language).toBe("fr");
        });

        it("writes a background of currentcolor in the text's colour, or black", () => {
            expect(style("background-color: currentcolor; color: red").backgroundColor).toBe("FF0000");
            expect(style("background-color: currentcolor").backgroundColor).toBe("000000");
            expect(style("color: currentcolor").color).toBeUndefined();
            expect(style("color: transparent").color).toBeUndefined();
        });

        it("reads a margin of auto, and leaves out a padding it can't read", () => {
            expect(style("margin-left: AUTO; padding-left: x")).toMatchObject({ margin: { left: "auto" }, padding: { left: 0 } });
        });

        it("reads table-layout", () => {
            expect(style("table-layout: fixed").tableLayout).toBe("fixed");
            expect(style("table-layout: auto").tableLayout).toBeUndefined();
        });

        it("reads font families, passing over empty ones and those a system has, and generic ones Word has none for", () => {
            expect(style("font-family: '', system-ui, fangsong, Georgia").fontFamily).toBe("Georgia");
            expect(style("font-family: system-ui").fontFamily).toBeUndefined();
            expect(style('font-family: "serif"').fontFamily).toBe("serif");
            expect(style("font-family: cursive").fontFamily).toBe("Comic Sans MS");
            expect(style("font-family: fantasy").fontFamily).toBe("Impact");
            expect(style("font-family: ui-monospace").fontFamily).toBe("Courier New");
        });
    });
});
