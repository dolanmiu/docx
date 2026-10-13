/**
 * The styles that HTML's presentational attributes stand for, such as `align`, `bgcolor`, a table's `border` and
 * `<font color>`, which editors such as TinyMCE and Word's HTML still write. They are less important than any style
 * of the document's own, as in a browser.
 *
 * @module
 */
// cspell:ignore bgcolor
import type { Element } from "domhandler";

import type { Declaration } from "./css-syntax";

/** A dimension attribute's length, such as `width="200"` (pixels) or `width="50%"`, or undefined if it has none */
const dimensionOf = (value: string | undefined): string | undefined => {
    const match = /^\s*(\d+(?:\.\d+)?)\s*(%?)/.exec(value ?? "");
    return match ? `${match[1]}${match[2] === "%" ? "%" : "px"}` : undefined;
};

// The font sizes of `<font size>`, from 1 to 7
const FONT_SIZES = ["x-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large"];

/** The size of `<font size>`: 1 to 7, or one more or less than 3 with a sign, kept within 1 to 7 */
const fontSizeOf = (value: string): string | undefined => {
    const match = /^\s*([+-]?)(\d+)/.exec(value);
    if (!match) {
        return undefined;
    }
    const amount = Number(match[2]);
    const size = match[1] === "+" ? 3 + amount : match[1] === "-" ? 3 - amount : amount;
    return FONT_SIZES[Math.min(Math.max(size, 1), 7) - 1];
};

// The list types of `<ol type>`, whose letters' cases matter, and of `<ul type>` and `<li type>`
const LIST_TYPES: Readonly<Record<string, string>> = {
    "1": "decimal",
    a: "lower-alpha",
    A: "upper-alpha",
    i: "lower-roman",
    I: "upper-roman",
    disc: "disc",
    circle: "circle",
    square: "square",
};

const ALIGNED: ReadonlySet<string> = new Set([
    "p",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "caption",
    "td",
    "th",
    "tr",
    "thead",
    "tbody",
    "tfoot",
    "legend",
]);
const TABLE_PARTS: ReadonlySet<string> = new Set(["table", "thead", "tbody", "tfoot", "tr", "td", "th"]);
const SIZED: ReadonlySet<string> = new Set(["table", "td", "th", "img", "col", "colgroup", "hr", "iframe", "video", "canvas"]);
const HEIGHTS: ReadonlySet<string> = new Set(["table", "tr", "td", "th", "img", "iframe", "video", "canvas"]);

/** The table a cell is in */
const tableOf = (cell: Element): Element | undefined => {
    let ancestor = cell.parent;
    while (ancestor && (ancestor.type !== "tag" || ancestor.name !== "table")) {
        ancestor = ancestor.parent;
    }
    return ancestor ?? undefined;
};

/** Whether a table has a border by its `border` attribute, which is a number of pixels, or 1 if it has no number */
const tableBorderOf = (table: Element): number | undefined => {
    const { border } = table.attribs;
    return border === undefined ? undefined : Number(/^\s*(\d*)/.exec(border)![1] || "1");
};

/** A declaration if what it stands for is given, or none */
const hint = (property: string, value: string | undefined | false): readonly Declaration[] =>
    value ? [{ property, value, important: false }] : [];

/** A table's or cell's border, from its table's `border` attribute */
const borderHint = (border: number | undefined, width: string): readonly Declaration[] =>
    border === undefined ? [] : hint("border", border === 0 ? "none" : `${width} solid`);

/** The list type of a `type` attribute, whose case matters on an `<ol>`, as `a` and `A` are different */
const listTypeOf = (name: string, type: string | undefined): string | undefined => {
    const trimmed = type?.trim() ?? "";
    return name === "ol" ? LIST_TYPES[trimmed] : (LIST_TYPES[trimmed] ?? LIST_TYPES[trimmed.toLowerCase()]);
};

/**
 * The declarations an element's presentational attributes stand for.
 */
export const presentationalHints = (element: Element): readonly Declaration[] => {
    const { name, attribs } = element;
    const align = attribs.align?.trim().toLowerCase();
    const table = name === "td" || name === "th" ? tableOf(element) : undefined;
    return [
        ...hint("text-align", ALIGNED.has(name) && ["left", "right", "center", "justify"].includes(align ?? "") && align),
        ...hint("margin-left", name === "table" && (align === "center" || align === "right") && "auto"),
        ...hint("margin-right", name === "table" && align === "center" && "auto"),
        ...hint("float", name === "img" && (align === "left" || align === "right") && align),
        ...hint("vertical-align", TABLE_PARTS.has(name) && attribs.valign),
        ...hint("background-color", (TABLE_PARTS.has(name) || name === "body") && attribs.bgcolor),
        ...hint("width", SIZED.has(name) && dimensionOf(attribs.width)),
        ...hint("height", HEIGHTS.has(name) && dimensionOf(attribs.height)),
        ...hint("white-space", (name === "td" || name === "th") && attribs.nowrap !== undefined && "nowrap"),
        ...(name === "table" ? borderHint(tableBorderOf(element), `${tableBorderOf(element)}px`) : []),
        ...(table ? borderHint(tableBorderOf(table), "1px") : []),
        ...hint("padding", table && dimensionOf(table.attribs.cellpadding)),
        ...hint("color", name === "font" && attribs.color),
        ...hint("font-family", name === "font" && attribs.face),
        ...hint("font-size", name === "font" && attribs.size !== undefined && fontSizeOf(attribs.size)),
        ...hint("list-style-type", (name === "ol" || name === "ul" || name === "li") && listTypeOf(name, attribs.type)),
    ];
};
