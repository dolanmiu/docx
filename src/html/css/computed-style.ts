/**
 * Works out an element's style from its cascaded values and its parent's style: each property that docx/html reads,
 * with relative lengths, such as `em`, in points, and inherited properties from the parent.
 *
 * A value a property doesn't take is passed over for the next most important one, as a browser leaves out declarations
 * it can't read, so `color: nonsense; color: red` is red.
 *
 * Formatting that comes from nothing in the HTML is left undefined, so that the Word document's styles decide it:
 * only what the HTML says, such as a colour or a font size, is written as direct formatting.
 *
 * @module
 */
import type { CascadedStyle } from "./css-cascade";
import { parseColor, toHex } from "./css-color";
import { isCssWideKeyword, listOf, parseLength, parseNumber, toPoints, unquote, wordsOf } from "./css-values";

/** A side of a box's border */
export type BorderSide = {
    /** The border's CSS style, such as `solid` or `double` */
    readonly style: string;
    /** The border's width, in points */
    readonly width: number;
    /** The border's colour, six hex digits */
    readonly color: string;
};

/** A length that is in points, or a percentage of what the property is relative to */
export type Size = { readonly points: number } | { readonly percent: number };

/** A line of text decoration, such as an underline: its CSS style, such as `wavy`, and its colour, if it has one */
export type Decoration = { readonly style: string; readonly color?: string };

/** The text decorations an element's text has, its own and those of the elements it is in */
export type Decorations = {
    readonly underline?: Decoration;
    readonly lineThrough?: Decoration;
    readonly overline?: Decoration;
};

/** An element's style, as docx/html reads it */
export type ComputedStyle = {
    // Inherited
    readonly color?: string;
    readonly fontFamily?: string;
    /** The font size the HTML gives the element's text, in points */
    readonly fontSize?: number;
    /** The font size relative lengths are relative to: the font size, or the default 12 points (16 pixels) */
    readonly baseFontSize: number;
    /** The root element's font size, which `rem`s are relative to */
    readonly rootFontSize: number;
    readonly fontWeight: number;
    /** True or false when the HTML makes the text bold or not, and undefined when it says nothing */
    readonly bold?: boolean;
    readonly italic?: boolean;
    readonly smallCaps?: boolean;
    readonly textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
    /** Extra space between letters, in points */
    readonly letterSpacing?: number;
    /**
     * The height of lines: a multiple of the font size, from a number; a number of Word's lines, from a percentage,
     * as Word writes its line spacing in HTML and reads it back; or a length in points
     */
    readonly lineHeight?: { readonly multiple: number } | { readonly lines: number } | { readonly points: number };
    readonly textAlign?: "left" | "right" | "center" | "justify" | "start" | "end";
    /** The first line's indent, in points */
    readonly textIndent?: number;
    readonly whiteSpace: "normal" | "pre" | "nowrap" | "pre-wrap" | "pre-line" | "break-spaces";
    readonly direction?: "ltr" | "rtl";
    readonly listStyleType?: string;
    readonly hidden: boolean;
    /** The text's language, from the `lang` attribute */
    readonly language?: string;
    readonly decorations: Decorations;
    readonly customProperties: ReadonlyMap<string, string>;
    // Not inherited
    readonly display: string;
    readonly margin: {
        readonly top?: number | "auto";
        readonly right?: number | "auto";
        readonly bottom?: number | "auto";
        readonly left?: number | "auto";
    };
    readonly padding: { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number };
    readonly border: {
        readonly top?: BorderSide;
        readonly right?: BorderSide;
        readonly bottom?: BorderSide;
        readonly left?: BorderSide;
    };
    /** The background colour, six hex digits, or undefined when the background is transparent */
    readonly backgroundColor?: string;
    readonly width?: Size;
    readonly height?: Size;
    readonly maxWidth?: Size;
    readonly maxHeight?: Size;
    readonly minWidth?: Size;
    readonly minHeight?: Size;
    readonly verticalAlign?: "super" | "sub" | "top" | "middle" | "bottom" | { readonly raise: number };
    readonly float?: "left" | "right";
    readonly breakBefore?: "page" | "column";
    readonly breakAfter?: "page" | "column";
    readonly breakInside?: "avoid";
    readonly tableLayout?: "fixed";
    /** The id of the Word style that the `styleMap` option gives the element */
    readonly wordStyle?: string;
};

/**
 * The property that the `styleMap` option's selectors give the elements they match, with the id of a Word style. It
 * can't be a property of CSS's, or a custom property, which is inherited
 */
export const WORD_STYLE = "-docx-word-style";

/** The default font size, 16 pixels, which is what relative sizes in HTML are relative to unless the HTML says */
export const DEFAULT_FONT_SIZE = 12;

/** The style of the root of a document, which every element's is worked out from */
export const ROOT_STYLE: ComputedStyle = {
    baseFontSize: DEFAULT_FONT_SIZE,
    rootFontSize: DEFAULT_FONT_SIZE,
    fontWeight: 400,
    whiteSpace: "normal",
    hidden: false,
    decorations: {},
    customProperties: new Map(),
    display: "block",
    margin: {},
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    border: {},
};

// The sizes of the font size keywords, in points
const FONT_SIZE_KEYWORDS: ReadonlyMap<string, number> = new Map([
    ["xx-small", 6.75],
    ["x-small", 7.5],
    ["small", 9.75],
    ["medium", 12],
    ["large", 13.5],
    ["x-large", 18],
    ["xx-large", 24],
    ["xxx-large", 36],
]);

// Fonts for CSS's generic families, which every computer with Word has. Families that are a system's own, such as
// system-ui, have none, and the next family is used
const GENERIC_FAMILIES: ReadonlyMap<string, string | undefined> = new Map([
    ["serif", "Times New Roman"],
    ["sans-serif", "Arial"],
    ["monospace", "Courier New"],
    ["ui-monospace", "Courier New"],
    ["cursive", "Comic Sans MS"],
    ["fantasy", "Impact"],
    ["system-ui", undefined],
    ["ui-serif", undefined],
    ["ui-sans-serif", undefined],
    ["ui-rounded", undefined],
    ["math", undefined],
    ["emoji", undefined],
    ["fangsong", undefined],
    ["-apple-system", undefined],
    ["blinkmacsystemfont", undefined],
]);

// Border widths' keywords, in points
const BORDER_WIDTHS: Readonly<Record<string, number>> = { thin: 0.75, medium: 2.25, thick: 3.75 };

/** A side of a box */
type Side = "top" | "right" | "bottom" | "left";

/** The value a property has in its first cascaded value that `read` reads, `inherit` for the parent's, or the default */
const valueOf = <T>(
    cascaded: CascadedStyle,
    property: string,
    read: (value: string) => T | undefined,
    { inherited, initial, inherits }: { readonly inherited: T; readonly initial: T; readonly inherits: boolean },
): T => {
    for (const value of cascaded.values.get(property) ?? []) {
        if (isCssWideKeyword(value)) {
            const keyword = value.trim().toLowerCase();
            return keyword === "inherit" || (keyword === "unset" && inherits) ? inherited : initial;
        }
        const parsed = read(value);
        if (parsed !== undefined) {
            return parsed;
        }
    }
    return inherits ? inherited : initial;
};

const keywordOf =
    <T extends string>(...keywords: readonly T[]): ((value: string) => T | undefined) =>
    (value: string): T | undefined => {
        const keyword = value.trim().toLowerCase();
        return keywords.find((candidate) => candidate === keyword);
    };

/**
 * A colour's hex digits, blended over white when it is partly transparent, "transparent" when it is all transparent,
 * and the text's colour for `currentcolor`, or the fallback when the HTML gives the text no colour
 */
const colorOf = (value: string, currentColor: string | undefined, fallback?: string): string | undefined => {
    const color = parseColor(value);
    return color === "currentcolor" ? (currentColor ?? fallback) : color && (toHex(color) ?? "transparent");
};

/** The first family of a `font-family` that Word can have, or a font for its generic family */
const fontFamilyOf = (value: string): string | undefined => {
    for (const family of listOf(value)) {
        const name = unquote(family);
        const generic = name === family.trim() ? name.toLowerCase() : "";
        if (GENERIC_FAMILIES.has(generic)) {
            const font = GENERIC_FAMILIES.get(generic);
            if (font) {
                return font;
            }
        } else if (name !== "") {
            return name;
        }
    }
    return undefined;
};

/** A font weight from 1 to 1000, of a number or keyword, with `bolder` and `lighter` relative to the parent's */
const fontWeightOf = (value: string, parent: number): number | undefined => {
    const keyword = value.trim().toLowerCase();
    switch (keyword) {
        case "normal":
            return 400;
        case "bold":
            return 700;
        case "bolder":
            return parent < 350 ? 400 : parent < 550 ? 700 : 900;
        case "lighter":
            return parent < 550 ? 100 : parent < 750 ? 400 : 700;
        default: {
            const weight = parseNumber(keyword);
            return weight !== undefined && weight >= 1 && weight <= 1000 ? weight : undefined;
        }
    }
};

/** A length, with `em`s of the font size, in points, or undefined for a percentage, which has nothing to be of */
const pointsOf = (value: string, fontSize: number, rootFontSize: number): number | undefined => {
    const length = parseLength(value);
    return length && toPoints(length, fontSize, rootFontSize);
};

const sizeOf =
    (fontSize: number, rootFontSize: number, keywords: readonly string[]): ((value: string) => Size | "none" | undefined) =>
    (value: string): Size | "none" | undefined => {
        if (keywords.includes(value.trim().toLowerCase())) {
            return "none";
        }
        const length = parseLength(value);
        if (length === undefined || length.value < 0) {
            return undefined;
        }
        return length.unit === "%" ? { percent: length.value } : { points: toPoints(length, fontSize, rootFontSize)! };
    };

/** Whether a property's own value turns something on, or off where it was on, and undefined if it says nothing */
const turnedOnOrOff = (on: boolean | undefined, parent: boolean | undefined): boolean | undefined =>
    on === true ? true : on === false && parent !== undefined ? false : parent;

/**
 * Works out an element's style.
 *
 * @param cascaded - The element's cascaded values
 * @param parent - Its parent's style
 * @param language - Its `lang` attribute, if it has one
 */
export const computeStyle = (cascaded: CascadedStyle, parent: ComputedStyle, language?: string): ComputedStyle => {
    const inheritedFrom = <T>(property: string, read: (value: string) => T | undefined, inherited: T, initial?: T): T =>
        valueOf(cascaded, property, read, { inherited, initial: initial as T, inherits: true });
    const own = <T>(property: string, read: (value: string) => T | undefined, inherited: T): T | undefined =>
        valueOf<T | undefined>(cascaded, property, read, { inherited, initial: undefined, inherits: false });

    const fontSize = inheritedFrom(
        "font-size",
        (value) => {
            const keyword = value.trim().toLowerCase();
            if (keyword === "smaller" || keyword === "larger") {
                return keyword === "smaller" ? parent.baseFontSize / 1.2 : parent.baseFontSize * 1.2;
            }
            const keywordSize = FONT_SIZE_KEYWORDS.get(keyword);
            if (keywordSize !== undefined) {
                return keywordSize;
            }
            const length = parseLength(value);
            return length && length.value >= 0
                ? toPoints(length, parent.baseFontSize, parent.rootFontSize, parent.baseFontSize)
                : undefined;
        },
        parent.fontSize,
    );
    const baseFontSize = fontSize ?? parent.baseFontSize;
    const color = inheritedFrom("color", (value) => colorOf(value, parent.color), parent.color);
    const currentColor = color === "transparent" ? undefined : color;
    const fontWeight = inheritedFrom("font-weight", (value) => fontWeightOf(value, parent.fontWeight), parent.fontWeight, 400);
    const ownWeight = cascaded.values.has("font-weight") ? fontWeight >= 600 : undefined;
    const italic = inheritedFrom("font-style", keywordOf("italic", "oblique", "normal"), undefined, "normal");
    const smallCaps = inheritedFrom("font-variant-caps", keywordOf("small-caps", "all-small-caps", "normal"), undefined, "normal");

    const borderOf = (side: Side): BorderSide | undefined => {
        const style = own(
            `border-${side}-style`,
            keywordOf("none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"),
            parent.border[side]?.style,
        );
        if (style === undefined || style === "none" || style === "hidden") {
            return undefined;
        }
        const width =
            own(
                `border-${side}-width`,
                (value) => BORDER_WIDTHS[value.trim().toLowerCase()] ?? pointsOf(value, baseFontSize, parent.rootFontSize),
                parent.border[side]?.width,
            ) ?? BORDER_WIDTHS.medium;
        const sideColor = own(`border-${side}-color`, (value) => colorOf(value, currentColor, "000000"), parent.border[side]?.color);
        return width <= 0 || sideColor === "transparent" ? undefined : { style, width, color: sideColor ?? currentColor ?? "000000" };
    };

    const lengthWithAuto = (property: string, inherited: number | "auto" | undefined): number | "auto" | undefined =>
        own(
            property,
            (value) => (value.trim().toLowerCase() === "auto" ? "auto" : pointsOf(value, baseFontSize, parent.rootFontSize)),
            inherited,
        );
    const size = (property: keyof ComputedStyle & string, cssProperty: string, keywords: readonly string[]): Size | undefined => {
        const value = own(cssProperty, sizeOf(baseFontSize, parent.rootFontSize, keywords), parent[property] as Size | undefined);
        return value === "none" ? undefined : value;
    };

    const decorationLines = own(
        "text-decoration-line",
        (value) => {
            const words = wordsOf(value.toLowerCase());
            return words.every((word) => ["underline", "line-through", "overline", "none", "blink"].includes(word)) ? words : undefined;
        },
        undefined,
    );
    const decorationStyle = own("text-decoration-style", keywordOf("solid", "double", "dotted", "dashed", "wavy"), undefined) ?? "solid";
    const decorationColor = own("text-decoration-color", (value) => colorOf(value, currentColor), undefined);
    const decoration: Decoration = {
        style: decorationStyle,
        ...(decorationColor && decorationColor !== "transparent" ? { color: decorationColor } : {}),
    };
    const decorations: Decorations = {
        ...parent.decorations,
        ...(decorationLines?.includes("underline") ? { underline: decoration } : {}),
        ...(decorationLines?.includes("line-through") ? { lineThrough: decoration } : {}),
        ...(decorationLines?.includes("overline") ? { overline: decoration } : {}),
    };

    const display = own("display", (value) => wordsOf(value.toLowerCase())[0], parent.display) ?? "inline";
    const breakOf = (value: string): "page" | "column" | "auto" | undefined => {
        const keyword = value.trim().toLowerCase();
        if (["page", "left", "right", "recto", "verso", "always", "all"].includes(keyword)) {
            return "page";
        }
        return keyword === "column" ? "column" : ["auto", "avoid", "avoid-page", "avoid-column"].includes(keyword) ? "auto" : undefined;
    };
    const breakBefore = own("break-before", breakOf, parent.breakBefore);
    const breakAfter = own("break-after", breakOf, parent.breakAfter);
    const float = own("float", keywordOf("left", "right", "none", "inline-start", "inline-end"), parent.float);
    const verticalAlign = own(
        "vertical-align",
        (value): ComputedStyle["verticalAlign"] | "baseline" | undefined => {
            const keyword = keywordOf("super", "sub", "top", "middle", "bottom", "baseline", "text-top", "text-bottom")(value);
            if (keyword) {
                return keyword === "text-top" ? "top" : keyword === "text-bottom" ? "bottom" : keyword;
            }
            const length = parseLength(value);
            return length && { raise: toPoints(length, baseFontSize, parent.rootFontSize, baseFontSize)! };
        },
        parent.verticalAlign,
    );
    const lineHeight = inheritedFrom(
        "line-height",
        (value): ComputedStyle["lineHeight"] | "normal" | undefined => {
            if (value.trim().toLowerCase() === "normal") {
                return "normal";
            }
            const multiple = parseNumber(value);
            if (multiple !== undefined) {
                return multiple >= 0 ? { multiple } : undefined;
            }
            const length = parseLength(value);
            if (length === undefined || length.value < 0) {
                return undefined;
            }
            return length.unit === "%" ? { lines: length.value / 100 } : { points: toPoints(length, baseFontSize, parent.rootFontSize)! };
        },
        parent.lineHeight,
    );
    const textAlign = inheritedFrom(
        "text-align",
        (value) => {
            const keyword = value
                .trim()
                .toLowerCase()
                .replace(/^-(?:webkit|moz)-/, "");
            return keyword === "match-parent" ? parent.textAlign : keywordOf("left", "right", "center", "justify", "start", "end")(keyword);
        },
        parent.textAlign,
    );
    const backgroundColor = own("background-color", (value) => colorOf(value, currentColor, "000000"), parent.backgroundColor);

    return {
        color: currentColor,
        fontFamily: inheritedFrom("font-family", fontFamilyOf, parent.fontFamily),
        fontSize: fontSize === undefined ? undefined : Math.min(Math.max(fontSize, 1), 1638),
        baseFontSize,
        rootFontSize: parent.rootFontSize,
        fontWeight,
        bold: turnedOnOrOff(ownWeight, parent.bold),
        italic: turnedOnOrOff(italic === undefined ? undefined : italic !== "normal", parent.italic),
        smallCaps: turnedOnOrOff(smallCaps === undefined ? undefined : smallCaps !== "normal", parent.smallCaps),
        textTransform: inheritedFrom("text-transform", keywordOf("uppercase", "lowercase", "capitalize", "none"), parent.textTransform),
        letterSpacing: inheritedFrom(
            "letter-spacing",
            (value) => (value.trim().toLowerCase() === "normal" ? 0 : pointsOf(value, baseFontSize, parent.rootFontSize)),
            parent.letterSpacing,
        ),
        lineHeight: lineHeight === "normal" ? undefined : lineHeight,
        textAlign,
        textIndent: inheritedFrom(
            "text-indent",
            // Its first word: `hanging` and `each-line`, after it, aren't Word's
            (value) => pointsOf(wordsOf(value)[0], baseFontSize, parent.rootFontSize),
            parent.textIndent,
        ),
        whiteSpace: inheritedFrom(
            "white-space",
            keywordOf("normal", "pre", "nowrap", "pre-wrap", "pre-line", "break-spaces"),
            parent.whiteSpace,
            "normal",
        ),
        direction: inheritedFrom("direction", keywordOf("ltr", "rtl"), parent.direction),
        listStyleType: inheritedFrom(
            "list-style-type",
            (value) =>
                /^["']/.test(value.trim()) ? value.trim() : /^[a-z-]+$/i.test(value.trim()) ? value.trim().toLowerCase() : undefined,
            parent.listStyleType,
        ),
        hidden: inheritedFrom(
            "visibility",
            (value) => {
                const keyword = keywordOf("visible", "hidden", "collapse")(value);
                return keyword && keyword !== "visible";
            },
            parent.hidden,
            false,
        ),
        language: language ?? parent.language,
        decorations,
        customProperties: cascaded.customProperties,
        display,
        margin: {
            top: lengthWithAuto("margin-top", parent.margin.top),
            right: lengthWithAuto("margin-right", parent.margin.right),
            bottom: lengthWithAuto("margin-bottom", parent.margin.bottom),
            left: lengthWithAuto("margin-left", parent.margin.left),
        },
        padding: {
            top: own("padding-top", (value) => nonNegative(pointsOf(value, baseFontSize, parent.rootFontSize)), parent.padding.top) ?? 0,
            right:
                own("padding-right", (value) => nonNegative(pointsOf(value, baseFontSize, parent.rootFontSize)), parent.padding.right) ?? 0,
            bottom:
                own("padding-bottom", (value) => nonNegative(pointsOf(value, baseFontSize, parent.rootFontSize)), parent.padding.bottom) ??
                0,
            left: own("padding-left", (value) => nonNegative(pointsOf(value, baseFontSize, parent.rootFontSize)), parent.padding.left) ?? 0,
        },
        border: { top: borderOf("top"), right: borderOf("right"), bottom: borderOf("bottom"), left: borderOf("left") },
        backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor,
        width: size("width", "width", ["auto"]),
        height: size("height", "height", ["auto"]),
        maxWidth: size("maxWidth", "max-width", ["none"]),
        maxHeight: size("maxHeight", "max-height", ["none"]),
        minWidth: size("minWidth", "min-width", ["auto"]),
        minHeight: size("minHeight", "min-height", ["auto"]),
        verticalAlign: verticalAlign === "baseline" ? undefined : verticalAlign,
        float: float === "left" || float === "inline-start" ? "left" : float === "right" || float === "inline-end" ? "right" : undefined,
        breakBefore: breakBefore === "auto" ? undefined : breakBefore,
        breakAfter: breakAfter === "auto" ? undefined : breakAfter,
        breakInside: own("break-inside", keywordOf("avoid", "avoid-page", "auto", "avoid-column"), parent.breakInside)?.startsWith("avoid")
            ? "avoid"
            : undefined,
        tableLayout: own("table-layout", keywordOf("fixed", "auto"), parent.tableLayout) === "fixed" ? "fixed" : undefined,
        wordStyle: cascaded.values.get(WORD_STYLE)?.map(unquote)[0],
    };
};

const nonNegative = (points: number | undefined): number | undefined => (points !== undefined && points >= 0 ? points : undefined);
