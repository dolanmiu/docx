/**
 * Turns CSS's shorthand properties, such as `margin` and `border`, into the properties they set, such as `margin-top`
 * and `border-left-color`, and its other names for properties, such as `page-break-before`, into the names docx/html
 * reads.
 *
 * @module
 */
import { parseColor } from "./css-color";
import { listOf, parseLength, wordsOf } from "./css-values";

/** A property and its value */
export type PropertyValue = readonly [property: string, value: string];

const SIDES = ["top", "right", "bottom", "left"] as const;

/** The four sides' values from one to four values, as `margin` and `padding` give them */
const sidesOf = (values: readonly string[]): readonly string[] | undefined => {
    switch (values.length) {
        case 1:
            return [values[0], values[0], values[0], values[0]];
        case 2:
            return [values[0], values[1], values[0], values[1]];
        case 3:
            return [values[0], values[1], values[2], values[1]];
        case 4:
            return values;
        default:
            return undefined;
    }
};

const BORDER_STYLES: ReadonlySet<string> = new Set([
    "none",
    "hidden",
    "dotted",
    "dashed",
    "solid",
    "double",
    "groove",
    "ridge",
    "inset",
    "outset",
]);

const BORDER_WIDTHS: ReadonlySet<string> = new Set(["thin", "medium", "thick"]);

const isBorderWidth = (word: string): boolean => BORDER_WIDTHS.has(word.toLowerCase()) || parseLength(word)?.unit === "pt";

/** A border's width, style and colour, from a `border` value, such as `1px solid red`, in any order */
const borderParts = (value: string): readonly [width: string, style: string, color: string] | undefined => {
    const words = wordsOf(value);
    const width = words.filter(isBorderWidth);
    const style = words.filter((word) => BORDER_STYLES.has(word.toLowerCase()));
    const color = words.filter((word) => !isBorderWidth(word) && !BORDER_STYLES.has(word.toLowerCase()));
    if (words.length === 0 || width.length > 1 || style.length > 1 || color.length > 1 || (color.length === 1 && !parseColor(color[0]))) {
        return undefined;
    }
    // What a border leaves out is its initial value: medium, none, and the text's colour
    return [width[0] ?? "medium", style[0] ?? "none", color[0] ?? "currentcolor"];
};

const border = (sides: readonly string[], value: string): readonly PropertyValue[] | undefined => {
    const parts = borderParts(value);
    return (
        parts &&
        sides.flatMap((side): readonly PropertyValue[] => [
            [`border-${side}-width`, parts[0]],
            [`border-${side}-style`, parts[1]],
            [`border-${side}-color`, parts[2]],
        ])
    );
};

const fourSides = (property: (side: string) => string, value: string): readonly PropertyValue[] | undefined =>
    sidesOf(wordsOf(value))?.map((sideValue, index) => [property(SIDES[index]), sideValue]);

const FONT_STYLES: ReadonlySet<string> = new Set(["italic", "oblique", "normal"]);
const FONT_VARIANTS: ReadonlySet<string> = new Set(["small-caps"]);
const FONT_WEIGHTS: ReadonlySet<string> = new Set(["bold", "bolder", "lighter"]);
const FONT_SIZES: ReadonlySet<string> = new Set([
    "xx-small",
    "x-small",
    "small",
    "medium",
    "large",
    "x-large",
    "xx-large",
    "xxx-large",
    "smaller",
    "larger",
]);

/**
 * The properties `font` sets: its style, variant, weight and stretch, in any order, then its size, with a line height
 * after a slash, and its families. A system font, such as `caption`, is left out, as its size and family can't be
 * known.
 */
const font = (value: string): readonly PropertyValue[] | undefined => {
    const words = wordsOf(value.replace(/\s*\/\s*/, "/"));
    const sizeIndex = words.findIndex((word) => FONT_SIZES.has(word.split("/")[0].toLowerCase()) || parseLength(word.split("/")[0]));
    if (sizeIndex === -1 || sizeIndex === words.length - 1) {
        return undefined;
    }
    const before = words.slice(0, sizeIndex).map((word) => word.toLowerCase());
    const [size, lineHeight] = words[sizeIndex].split("/");
    const style = before.find((word) => FONT_STYLES.has(word) && word !== "normal");
    const variant = before.find((word) => FONT_VARIANTS.has(word));
    const weight = before.find((word) => FONT_WEIGHTS.has(word) || /^\d+$/.test(word));
    return [
        ["font-style", style ?? "normal"],
        ["font-variant-caps", variant ?? "normal"],
        ["font-weight", weight ?? "normal"],
        ["font-size", size],
        ["line-height", lineHeight ?? "normal"],
        ["font-family", words.slice(sizeIndex + 1).join(" ")],
    ];
};

/** The colour of a `background`, which is the only part of it a paragraph, a run or a cell can have */
const background = (value: string): readonly PropertyValue[] => {
    // The colour is its last layer's, after the last comma
    const layers = listOf(value);
    return [["background-color", wordsOf(layers[layers.length - 1]).find((word) => parseColor(word)) ?? "transparent"]];
};

const DECORATION_LINES: ReadonlySet<string> = new Set(["underline", "overline", "line-through", "blink", "none"]);
const DECORATION_STYLES: ReadonlySet<string> = new Set(["solid", "double", "dotted", "dashed", "wavy"]);

/** The line, style and colour of a `text-decoration`, such as `underline wavy red`, in any order */
const textDecoration = (value: string): readonly PropertyValue[] => {
    const words = wordsOf(value);
    const lines = words.filter((word) => DECORATION_LINES.has(word.toLowerCase()));
    const style = words.find((word) => DECORATION_STYLES.has(word.toLowerCase()));
    const color = words.find((word) => !DECORATION_LINES.has(word.toLowerCase()) && !DECORATION_STYLES.has(word.toLowerCase()));
    return [
        ["text-decoration-line", lines.length === 0 ? "none" : lines.join(" ")],
        ["text-decoration-style", style ?? "solid"],
        ["text-decoration-color", color ?? "currentcolor"],
    ];
};

/** The type of a `list-style`, such as `square inside`, whose other parts docx/html leaves out */
const listStyle = (value: string): readonly PropertyValue[] => {
    const words = wordsOf(value).filter((word) => !/^(?:inside|outside|url\(.*\))$/i.test(word));
    return [["list-style-type", words.find((word) => word.toLowerCase() !== "none") ?? words[0] ?? "none"]];
};

// The values of the page-break properties, as the break properties have them
const PAGE_BREAKS: Readonly<Record<string, string>> = { always: "page", left: "page", right: "page", avoid: "avoid", auto: "auto" };

/**
 * The properties a shorthand sets, or another name for a property sets, a property as it is, and undefined for a
 * shorthand whose value isn't valid, which is left out, as a browser leaves it out. Logical properties, such as
 * `margin-inline-start`, are the physical ones of left-to-right text.
 */
export const expandShorthand = (property: string, value: string): readonly PropertyValue[] | undefined => {
    switch (property) {
        case "margin":
        case "padding":
            return fourSides((side) => `${property}-${side}`, value);
        case "margin-inline":
        case "padding-inline": {
            const [start, end = start] = wordsOf(value);
            return [
                [`${property.split("-")[0]}-left`, start],
                [`${property.split("-")[0]}-right`, end],
            ];
        }
        case "margin-block":
        case "padding-block": {
            const [start, end = start] = wordsOf(value);
            return [
                [`${property.split("-")[0]}-top`, start],
                [`${property.split("-")[0]}-bottom`, end],
            ];
        }
        case "border":
            return border(SIDES, value);
        case "border-top":
        case "border-right":
        case "border-bottom":
        case "border-left":
            return border([property.slice("border-".length)], value);
        case "border-inline-start":
            return border(["left"], value);
        case "border-inline-end":
            return border(["right"], value);
        case "border-block-start":
            return border(["top"], value);
        case "border-block-end":
            return border(["bottom"], value);
        case "border-width":
        case "border-style":
        case "border-color":
            return fourSides((side) => `border-${side}-${property.slice("border-".length)}`, value);
        case "font":
            return font(value);
        case "font-variant":
            return [["font-variant-caps", wordsOf(value).some((word) => /^(?:all-)?small-caps$/i.test(word)) ? "small-caps" : "normal"]];
        case "background":
            return background(value);
        case "text-decoration":
            return textDecoration(value);
        case "list-style":
            return listStyle(value);
        case "page-break-before":
        case "page-break-after":
        case "page-break-inside":
            return [[property.replace("page-", ""), PAGE_BREAKS[value.trim().toLowerCase()] ?? value]];
        default: {
            const logical = /^(margin|padding)-(inline|block)-(start|end)$/.exec(property);
            if (logical) {
                const [, box, axis, edge] = logical;
                return [
                    [`${box}-${axis === "inline" ? (edge === "start" ? "left" : "right") : edge === "start" ? "top" : "bottom"}`, value],
                ];
            }
            return [[property, value]];
        }
    }
};
