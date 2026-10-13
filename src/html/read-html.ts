/**
 * Reads HTML into blocks: paragraphs with their content, tables and lists, from its elements and their styles.
 *
 * Elements are blocks or inline as their `display` says, as in a browser. A block's text, and its inline elements',
 * is a paragraph, and text next to blocks in an element is a paragraph of its own. Formatting comes from each
 * element's style, and paragraphs' indents, backgrounds and borders from the blocks they are in.
 *
 * @module
 */
// cspell:ignore Msoand lfo
import type { ChildNode, Element } from "domhandler";
import { parse } from "parse5";
import { type Htmlparser2TreeAdapterMap, adapter } from "parse5-htmlparser2-tree-adapter";

import {
    AlignmentType,
    BorderStyle,
    CheckBox,
    HeadingLevel,
    HeightRule,
    type IBorderOptions,
    Math as MathElement,
    type ParagraphChild,
    ShadingType,
    TableLayoutType,
    VerticalAlignTable,
    WidthType,
} from "docx";
import { latexToMath } from "docx/math";

import {
    type Block,
    type CellBlock,
    type Content,
    type Inline,
    type Link,
    type ListItem,
    type ParagraphBlock,
    type ParagraphFormat,
    type Revision,
    type RowBlock,
    isBlock,
} from "./content";
import { type ComputedStyle, ROOT_STYLE, type Size, WORD_STYLE, computeStyle } from "./css/computed-style";
import { type CascadedStyle, compileUserAgentStyleSheet, createCascade } from "./css/css-cascade";
import { isForPrint } from "./css/css-syntax";
import { presentationalHints } from "./css/presentational-hints";
import { USER_AGENT_STYLES } from "./css/user-agent-styles";
import { descendantsOf, elementsOf, isElement, textOf } from "./dom";
import { type Flow, type InlineFormat, borderOf, paragraphFormatOf, runFormatOf, twips } from "./formats";
import { imageOf, resolveUrl, svgImageOf } from "./images";
import { DEEPEST_LEVEL, HANGING, LIST_INDENT, listLevelOf } from "./lists";
import { editorLatexOf, isMathRendering, mathOf } from "./math";
import type { HtmlOptions, HtmlWarning } from "./options";

/** How deep in elements content is read with its formatting. Deeper content's text is kept, as a browser stops nesting too */
export const DEEPEST_ELEMENT = 512;

// A browser's own style sheet, compiled once
const USER_AGENT_STYLE_SHEET = compileUserAgentStyleSheet(USER_AGENT_STYLES);

/** What reading HTML needs throughout */
type Conversion = {
    readonly options: HtmlOptions;
    /** The bookmark names of the ids and anchor names that links in the HTML go to */
    readonly bookmarks: ReadonlyMap<string, string>;
    /** The lists of the paragraphs that Word's HTML puts in lists, by their list and level */
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly wordLists: Map<string, object>;
} & {
    readonly warn: (warning: HtmlWarning) => void;
    readonly cascade: (element: Element, inherited: ReadonlyMap<string, string>) => CascadedStyle;
};

/** What an element's content gets from the elements it is in */
type State = {
    /** The style of the element it is in */
    readonly style: ComputedStyle;
    /** The formatting of its text, from the style and the inline elements it is in */
    readonly format: ReturnType<typeof runFormatOf>;
    readonly inline: InlineFormat & { readonly link?: Link; readonly revision?: Revision };
    readonly flow: Flow;
    /** How many `<q>` it is in */
    readonly quotes: number;
    /** How many elements it is in */
    readonly depth: number;
};

const HEADINGS: Readonly<Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]>> = {
    h1: HeadingLevel.HEADING_1,
    h2: HeadingLevel.HEADING_2,
    h3: HeadingLevel.HEADING_3,
    h4: HeadingLevel.HEADING_4,
    h5: HeadingLevel.HEADING_5,
    h6: HeadingLevel.HEADING_6,
};

// The values of `display` whose elements are inline; the others' are blocks, such as flex and grid containers
const INLINE_DISPLAYS: ReadonlySet<string> = new Set([
    "inline",
    "inline-block",
    "inline-flex",
    "inline-grid",
    "inline-table",
    "contents",
    "ruby",
    "ruby-base",
    "ruby-text",
]);

// Elements that are a paragraph, an empty one if they have no content, as editors write empty lines
const PARAGRAPHS: ReadonlySet<string> = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "dt", "dd"]);

// Elements whose content a document can't have, which are left out
const UNSUPPORTED: ReadonlySet<string> = new Set([
    "iframe",
    "video",
    "audio",
    "canvas",
    "object",
    "embed",
    "applet",
    "frame",
    "frameset",
    "portal",
    "fencedframe",
]);

const LISTS: ReadonlySet<string> = new Set(["ul", "ol", "menu", "dir"]);

// Links to addresses of these schemes could run code, so they are left out
const UNSAFE_LINK = /^\s*(?:javascript|vbscript|data|livescript):/i;

const QUOTES = [
    ["\u201C", "\u201D"],
    ["\u2018", "\u2019"],
];

/** A bookmark name that Word allows: letters, digits and underscores, starting with a letter, and at most 40 characters */
const bookmarkNameOf = (id: string, taken: ReadonlySet<string>): string => {
    const name = id.replace(/[^\p{L}\p{N}_]/gu, "_");
    const valid = (/^\p{L}/u.test(name) ? name : `_${name}`).slice(0, 40);
    let unique = valid;
    for (let suffix = 2; taken.has(unique.toLowerCase()); suffix++) {
        unique = `${valid.slice(0, 40 - `_${suffix}`.length)}_${suffix}`;
    }
    return unique;
};

/** The ids that links in the document go to, and their bookmark names */
const bookmarksOf = (body: Element): ReadonlyMap<string, string> => {
    const elements = descendantsOf(body);
    const ids = new Set(elements.flatMap((element) => [element.attribs.id, ...(element.name === "a" ? [element.attribs.name] : [])]));
    const targets = new Map<string, string>();
    const taken = new Set<string>();
    for (const element of elements) {
        const href = element.name === "a" ? element.attribs.href?.trim() : undefined;
        const id = href?.startsWith("#") ? decodeFragment(href.slice(1)) : undefined;
        if (id === undefined || targets.has(id)) {
            continue;
        }
        // `#` and `#top` go to the top of the page, as Word's own `_top` bookmark does, unless an element is called top
        const name = id === "" || (id.toLowerCase() === "top" && !ids.has(id)) ? "_top" : bookmarkNameOf(id, taken);
        // eslint-disable-next-line functional/immutable-data
        targets.set(id, name);
        // eslint-disable-next-line functional/immutable-data
        taken.add(name.toLowerCase());
    }
    return targets;
};

const decodeFragment = (fragment: string): string => {
    try {
        return decodeURIComponent(fragment);
    } catch {
        return fragment;
    }
};

const isBlockDisplay = (display: string): boolean => !INLINE_DISPLAYS.has(display);

/** Whether inline content has anything to show, rather than only spaces that are collapsed away and bookmarks */
const hasContent = (content: readonly Inline[]): boolean =>
    content.some(
        (item) =>
            item.type === "atom" ||
            item.type === "break" ||
            (item.type === "text" &&
                (/[^ \t\n\r\f]/.test(item.text) || (item.whiteSpace !== "normal" && item.whiteSpace !== "nowrap" && item.text !== ""))),
    );

/**
 * Groups content into blocks: blocks as they are, and the inline content between them in paragraphs of the format
 * given. Bookmarks in inline content with nothing else go in the next paragraph, or the last if there is none after.
 */
const toBlocks = (contents: readonly Content[], format: ParagraphFormat): readonly Block[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const blocks: Block[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    let inline: Inline[] = [];
    let bookmarks: readonly Inline[] = [];
    const flush = (): void => {
        if (hasContent(inline)) {
            // eslint-disable-next-line functional/immutable-data
            blocks.push({ type: "paragraph", format, content: [...bookmarks, ...inline] });
            bookmarks = [];
        } else {
            bookmarks = [...bookmarks, ...inline.filter((item) => item.type === "bookmark")];
        }
        inline = [];
    };
    for (const content of contents) {
        if (!isBlock(content)) {
            // eslint-disable-next-line functional/immutable-data
            inline.push(content);
            continue;
        }
        flush();
        if (content.type === "paragraph" && bookmarks.length > 0) {
            // eslint-disable-next-line functional/immutable-data
            blocks.push({ ...content, content: [...bookmarks, ...content.content] });
            bookmarks = [];
        } else {
            // eslint-disable-next-line functional/immutable-data
            blocks.push(content);
        }
    }
    flush();
    if (bookmarks.length > 0) {
        const last = blocks.map((block) => block.type).lastIndexOf("paragraph");
        if (last !== -1) {
            const paragraph = blocks[last] as ParagraphBlock;
            // eslint-disable-next-line functional/immutable-data
            blocks[last] = { ...paragraph, content: [...paragraph.content, ...bookmarks] };
        }
    }
    return blocks;
};

/** The indent of a list's text at a depth in lists, in twips, or nothing out of lists */
const listIndentOf = (flow: Flow): number => (flow.listDepth === undefined ? 0 : LIST_INDENT * (flow.listDepth + 1));

const points = (value: number | "auto" | undefined): number => (typeof value === "number" ? value : 0);

/** A table's or cell's width as Word has it: in twips, or a percentage */
const widthOf = (size: Size): { readonly size: number | `${number}%`; readonly type: (typeof WidthType)[keyof typeof WidthType] } =>
    "points" in size
        ? { size: twips(size.points), type: WidthType.DXA }
        : { size: `${Math.round(size.percent * 100) / 100}%`, type: WidthType.PERCENTAGE };

const VERTICAL_ALIGNMENTS = { top: VerticalAlignTable.TOP, middle: VerticalAlignTable.CENTER, bottom: VerticalAlignTable.BOTTOM } as const;

const SIDES = ["top", "right", "bottom", "left"] as const;

/** Reads the content of an element, or a text, comment or other node */
const readNodes = (nodes: readonly ChildNode[], state: State, conversion: Conversion): readonly Content[] =>
    nodes.flatMap((node) => readNode(node, state, conversion));

const readNode = (node: ChildNode, state: State, conversion: Conversion): readonly Content[] => {
    if (node.type === "text") {
        return state.style.hidden ? [] : [textItem(node.data, state)];
    }
    if (node.type === "comment") {
        // TinyMCE's page breaks
        return /^\s*pagebreak\s*$/i.test(node.data) ? [{ type: "block-break", kind: "page" }] : [];
    }
    // The rest are elements: the parser puts no doctypes or processing instructions in the body
    return readElement(node as Element, state, conversion);
};

const textItem = (text: string, state: State): Inline => ({
    type: "text",
    text,
    format: state.format,
    whiteSpace: state.style.whiteSpace,
    ...(state.style.textTransform === "lowercase" || state.style.textTransform === "capitalize"
        ? { transform: state.style.textTransform }
        : {}),
    ...(state.inline.link ? { link: state.inline.link } : {}),
    ...(state.inline.revision ? { revision: state.inline.revision } : {}),
});

const atom = (child: ParagraphChild, state: State): Inline => ({
    type: "atom",
    child,
    ...(state.inline.link ? { link: state.inline.link } : {}),
});

/** The state of an element's content: its style, and its inline formatting */
const stateIn = (style: ComputedStyle, state: State, inline: State["inline"], flow = state.flow): State => ({
    ...state,
    style,
    inline,
    flow,
    format: runFormatOf(style, inline),
    depth: state.depth + 1,
});

const readElement = (element: Element, parentState: State, conversion: Conversion): readonly Content[] => {
    if (parentState.depth >= DEEPEST_ELEMENT) {
        conversion.warn({
            code: "too-deep",
            message: `Content in more than ${DEEPEST_ELEMENT} elements in each other keeps its text, without its formatting`,
        });
        return [textItem(textOf(element), parentState)];
    }
    const cascaded = conversion.cascade(element, parentState.style.customProperties);
    const computed = computeStyle(cascaded, parentState.style, element.attribs.lang);
    // Word shows tracked changes as its own, without a browser's underline and line through
    const tracked = conversion.options.trackChanges !== undefined && (element.name === "ins" || element.name === "del");
    const style = tracked ? { ...computed, decorations: parentState.style.decorations } : computed;
    if (element.name === "script" && /^math\/tex\b/i.test(element.attribs.type ?? "")) {
        return mathContent(element, style, parentState, conversion, () => latexToMath(textOf(element)), textOf(element));
    }
    if (style.display === "none" || /mso-list:\s*ignore/i.test(element.attribs.style ?? "") || isMathRendering(element)) {
        return [];
    }
    const { name } = element;
    const state: State = { ...parentState, style };

    const latex = editorLatexOf(element);
    if (latex !== undefined) {
        return mathContent(element, style, parentState, conversion, () => latexToMath(latex), latex);
    }
    if (UNSUPPORTED.has(name)) {
        conversion.warn({ code: "unsupported-element", message: `A document can't have an <${name}>, so it is left out` });
        return [];
    }
    switch (name) {
        case "br":
            return style.breakBefore === "page" || style.breakAfter === "page"
                ? [{ type: "block-break", kind: "page" }]
                : [{ type: "break", format: parentState.format, ...(parentState.inline.link ? { link: parentState.inline.link } : {}) }];
        case "wbr":
            return [textItem("\u200B", parentState)];
        case "img": {
            const image = imageOf(element, style, conversion);
            return image === undefined ? [] : placed(atom(image, parentState), style, parentState);
        }
        case "svg":
            return placed(atom(svgImageOf(element, style, conversion.options), parentState), style, parentState);
        case "math":
            return mathContent(element, style, parentState, conversion, () => mathOf(element), textOf(element));
        case "input":
            return inputOf(element, parentState);
        case "select": {
            const options = elementsOf(element).flatMap((child) => (child.name === "optgroup" ? elementsOf(child) : [child]));
            const selected = options.find((option) => option.attribs.selected !== undefined) ?? options[0];
            return selected ? [textItem(textOf(selected), stateIn(style, parentState, parentState.inline))] : [];
        }
        case "hr":
            return [{ type: "paragraph", format: horizontalRuleOf(style, parentState), content: [] }];
        case "table":
            return readTable(element, style, parentState, conversion);
        case "q": {
            const [open, close] = QUOTES[parentState.quotes % 2];
            const insideQuote = {
                ...stateIn(style, parentState, inlineOf(element, style, parentState, conversion, cascaded)),
                quotes: parentState.quotes + 1,
            };
            return [textItem(open, insideQuote), ...readNodes(element.children, insideQuote, conversion), textItem(close, insideQuote)];
        }
        case "rt": {
            const insideRuby = stateIn(style, parentState, inlineOf(element, style, parentState, conversion, cascaded));
            const content = readNodes(element.children, insideRuby, conversion);
            const parentHasRp =
                element.parent &&
                "children" in element.parent &&
                element.parent.children.some((child) => isElement(child) && child.name === "rp");
            return parentHasRp ? content : [textItem("(", insideRuby), ...content, textItem(")", insideRuby)];
        }
        default:
            break;
    }
    if (LISTS.has(name)) {
        return withBookmark(element, readList(element, style, state, conversion), conversion);
    }
    if (name === "li" || /mso-list:\s*l\d+\s+level\d+/i.test(element.attribs.style ?? "")) {
        return withBookmark(element, readStrayItem(element, style, state, conversion), conversion);
    }
    if (isBlockDisplay(style.display)) {
        return withBookmark(element, readBlock(element, style, parentState, conversion), conversion);
    }
    const inner = stateIn(style, parentState, inlineOf(element, style, parentState, conversion, cascaded));
    return withBookmark(element, readNodes(element.children, inner, conversion), conversion);
};

/** Content with a bookmark at its start, when a link in the HTML goes to the element */
const withBookmark = (element: Element, content: readonly Content[], conversion: Conversion): readonly Content[] => {
    const id = element.attribs.id ?? (element.name === "a" ? element.attribs.name : undefined);
    const name = id === undefined ? undefined : conversion.bookmarks.get(id);
    // Word has its own bookmark at the top of the document
    if (name === undefined || name === "_top") {
        return content;
    }
    const bookmark: Inline = { type: "bookmark", name };
    const first = content[0] as Content | undefined;
    return first?.type === "paragraph"
        ? [{ ...first, content: [bookmark, ...first.content] }, ...content.slice(1)]
        : [bookmark, ...content];
};

/** The inline formatting of an inline element's content: its link, background, script, character style and revision */
const inlineOf = (
    element: Element,
    style: ComputedStyle,
    state: State,
    conversion: Conversion,
    cascaded: CascadedStyle,
): State["inline"] => {
    const link = element.name === "a" ? linkOf(element, conversion) : undefined;
    const tracked = conversion.options.trackChanges;
    const revision: Revision | undefined =
        tracked && (element.name === "ins" || element.name === "del")
            ? {
                  kind: element.name === "ins" ? "insertion" : "deletion",
                  author: tracked.author,
                  date: element.attribs.datetime ?? tracked.date ?? new Date().toISOString().replace(/\.\d+Z$/, "Z"),
              }
            : state.inline.revision;
    const script =
        style.verticalAlign === "super" || style.verticalAlign === "sub" || typeof style.verticalAlign === "object"
            ? style.verticalAlign
            : state.inline.script;
    return {
        background: style.backgroundColor ?? state.inline.background,
        script,
        characterStyle: style.wordStyle ?? (link ? "Hyperlink" : state.inline.characterStyle),
        ...((link ?? state.inline.link) ? { link: link ?? state.inline.link } : {}),
        ...(revision ? { revision } : {}),
        // A link that its CSS takes the underline off isn't underlined, though the Hyperlink style underlines it
        ...(link && /\bnone\b/i.test(cascaded.values.get("text-decoration-line")?.[0] ?? "") ? { removeUnderline: true } : {}),
    };
};

/** Where a link goes, or undefined, with a warning, for an address that could run code */
const linkOf = (element: Element, conversion: Conversion): Link | undefined => {
    const href = element.attribs.href?.trim();
    if (href === undefined || href === "") {
        return undefined;
    }
    if (href.startsWith("#")) {
        // Every link in the document to an id has a bookmark name
        return { anchor: conversion.bookmarks.get(decodeFragment(href.slice(1)))! };
    }
    if (UNSAFE_LINK.test(href)) {
        conversion.warn({
            code: "unsafe-link",
            message: `The link to "${href.slice(0, 60)}" could run code, so its text is kept without it`,
        });
        return undefined;
    }
    return { href: resolveUrl(href, conversion.options.baseUrl) ?? href };
};

/** An image, or other content of its own, inline, or in a paragraph of its own when it is a block */
const placed = (content: Inline, style: ComputedStyle, state: State): readonly Content[] => {
    if (!isBlockDisplay(style.display) || style.float) {
        return [content];
    }
    const { left, right } = style.margin;
    const alignment = left === "auto" && right === "auto" ? AlignmentType.CENTER : left === "auto" ? AlignmentType.RIGHT : undefined;
    const format = paragraphFormatOf(state.style, state.flow, listIndentOf(state.flow));
    return [{ type: "paragraph", format: alignment ? { ...format, alignment } : format, content: [content] }];
};

/** Math, as a Word equation, or its text, with a warning, if it can't be read */
const mathContent = (
    element: Element,
    style: ComputedStyle,
    state: State,
    conversion: Conversion,
    read: () => ReturnType<typeof latexToMath>,
    text: string,
): readonly Content[] => {
    try {
        const equation = atom(new MathElement({ children: read() }), state);
        return element.attribs.display === "block"
            ? placed(equation, { ...style, display: "block" }, state)
            : placed(equation, style, state);
    } catch (error) {
        conversion.warn({
            code: "invalid-math",
            message: `The math "${text.trim().slice(0, 60)}" can't be read, so its text is kept: ${(error as Error).message}`,
        });
        return [textItem(text, state)];
    }
};

/** A checkbox or radio button as a checkbox, and other inputs as their values */
const inputOf = (element: Element, state: State): readonly Content[] => {
    const type = (element.attribs.type ?? "text").toLowerCase();
    const checked = element.attribs.checked !== undefined;
    // A browser's checkboxes have a margin, so there is space between them and the text after them
    if (type === "checkbox") {
        return [atom(new CheckBox({ checked }), state), textItem(" ", state)];
    }
    if (type === "radio") {
        return [
            atom(
                new CheckBox({
                    checked,
                    checkedState: { value: "25C9", font: "Segoe UI Symbol" },
                    uncheckedState: { value: "25CB", font: "Segoe UI Symbol" },
                }),
                state,
            ),
            textItem(" ", state),
        ];
    }
    const value = element.attribs.value ?? "";
    return type === "hidden" || value === "" ? [] : [textItem(value, state)];
};

/** A horizontal rule: a paragraph with a line under it, of its CSS colour and thickness, or Word's own */
const horizontalRuleOf = (style: ComputedStyle, state: State): ParagraphFormat => {
    const format = paragraphFormatOf(state.style, state.flow, listIndentOf(state.flow));
    const side = style.border.top ?? style.border.bottom;
    const color = side?.color ?? style.backgroundColor;
    if (!side && !style.backgroundColor) {
        return { ...format, thematicBreak: true };
    }
    const width = side?.width ?? (style.height && "points" in style.height ? style.height.points : 0.75);
    return { ...format, border: { bottom: borderOf({ style: side?.style ?? "solid", width, color: color! }) } };
};

/** The borders of a block, as Word's paragraph borders, with the block's padding as the space inside them */
const paragraphBordersOf = (style: ComputedStyle): ParagraphFormat["border"] | undefined => {
    const sides = SIDES.filter((side) => style.border[side]);
    return sides.length === 0
        ? undefined
        : Object.fromEntries(sides.map((side) => [side, borderOf(style.border[side]!, style.padding[side])]));
};

/**
 * Reads a block: its content, in paragraphs of its format, with the indents of its margins and padding, its
 * background and its borders, its margins above and below it, and its page breaks.
 *
 * @param box - Whether the block's own margins, padding, background and borders are its paragraphs', which a table
 * cell's aren't, as the cell has them
 * @param readChildren - Reads the block's content, which a list reads as its items
 */
const readBlock = (
    element: Element,
    style: ComputedStyle,
    state: State,
    conversion: Conversion,
    {
        box = true,
        readChildren = readNodes,
        padding = true,
    }: { readonly box?: boolean; readonly readChildren?: typeof readNodes; readonly padding?: boolean } = {},
): readonly Block[] => {
    const borders = box ? paragraphBordersOf(style) : undefined;
    // Padding inside a border is the space between it and the text, rather than an indent
    const inset = (side: "left" | "right"): number =>
        box ? points(style.margin[side]) + (padding && !style.border[side] ? style.padding[side] : 0) : 0;
    const flow: Flow = {
        ...state.flow,
        indentLeft: state.flow.indentLeft + inset("left"),
        indentRight: state.flow.indentRight + inset("right"),
        background: box ? (style.backgroundColor ?? state.flow.background) : state.flow.background,
        borders: borders ?? state.flow.borders,
    };
    // A link and a tracked change go on into the blocks in them, as does the link's character style
    const { link, revision, characterStyle } = state.inline;
    const inner = stateIn(style, state, { link, revision, ...(link ? { characterStyle } : {}) }, flow);
    const contents = readChildren(element.children, inner, conversion);

    const heading =
        HEADINGS[element.name] ?? (element.attribs.role === "heading" ? HEADINGS[`h${element.attribs["aria-level"] ?? "2"}`] : undefined);
    const format: ParagraphFormat = {
        ...paragraphFormatOf(style, flow, listIndentOf(flow)),
        ...(style.wordStyle ? { style: style.wordStyle } : heading ? { heading } : {}),
    };
    let blocks = toBlocks(contents, format);
    if (blocks.length === 0 && PARAGRAPHS.has(element.name)) {
        blocks = [{ type: "paragraph", format, content: [] }];
    }

    if (box) {
        const before = twips(Math.max(points(style.margin.top) + (style.border.top ? 0 : style.padding.top), 0));
        const after = twips(Math.max(points(style.margin.bottom) + (style.border.bottom ? 0 : style.padding.bottom), 0));
        blocks = spacedAt(blocks, "before", before);
        blocks = spacedAt(blocks, "after", after);
    }
    if (style.breakInside === "avoid") {
        blocks = blocks.map((block, index) =>
            block.type === "paragraph"
                ? { ...block, format: { ...block.format, keepLines: true, ...(index < blocks.length - 1 ? { keepNext: true } : {}) } }
                : block,
        );
    }
    return [
        ...(style.breakBefore ? [{ type: "block-break", kind: style.breakBefore } as const] : []),
        ...blocks,
        ...(style.breakAfter ? [{ type: "block-break", kind: style.breakAfter } as const] : []),
    ];
};

/** Blocks with space added before the first paragraph, or after the last, when it is one */
const spacedAt = (blocks: readonly Block[], edge: "before" | "after", space: number): readonly Block[] => {
    const index =
        edge === "before"
            ? blocks.findIndex((candidate) => candidate.type !== "block-break")
            : blocks.map((candidate) => candidate.type !== "block-break").lastIndexOf(true);
    const block = blocks[index] as Block | undefined;
    if (space === 0 || block?.type !== "paragraph") {
        return blocks;
    }
    const spacing = { ...block.format.spacing, [edge]: (block.format.spacing?.[edge] ?? 0) + space };
    return [...blocks.slice(0, index), { ...block, format: { ...block.format, spacing } }, ...blocks.slice(index + 1)];
};

/** An item's checkbox, for the lists of to-dos that Quill and Lexical write without an `<input>` */
const checkboxOf = (item: Element): boolean | undefined => {
    const quill = item.attribs["data-list"];
    if (quill === "checked" || quill === "unchecked") {
        return quill === "checked";
    }
    if (item.attribs.role === "checkbox") {
        return item.attribs["aria-checked"] === "true";
    }
    const list = item.parent as Element | null;
    const checked = list?.attribs?.["data-checked"];
    return checked === undefined || list?.attribs["data-type"] === "taskList" ? undefined : checked === "true";
};

/** Whether an item of a list has nothing but lists in it */
const isListWrapper = (item: Element): boolean =>
    elementsOf(item).length > 0 &&
    item.children.every((child) => (isElement(child) ? LISTS.has(child.name) : child.type !== "text" || !/\S/.test(child.data)));

// The numbers of Quill's numbered lists at each depth, as its style sheet numbers them
const QUILL_NUMBERS = ["decimal", "lower-alpha", "lower-roman"];

/** The depth of an item of a list that Quill writes flat, with its classes for how far in it is */
const quillIndentOf = (item: Element): number => Number(/(?:^|\s)ql-indent-(\d+)(?:\s|$)/.exec(item.attribs.class ?? "")?.[1] ?? 0);

/**
 * Reads a list: its items, each a list item of its own paragraphs, at the list's depth, numbered from its start,
 * or the other way for a reversed list. Quill's lists, which are flat, have their items' depths from their classes,
 * and each item's kind from its `data-list`.
 */
const readList = (element: Element, style: ComputedStyle, state: State, conversion: Conversion): readonly Block[] => {
    const depth = Math.min(state.flow.listDepth === undefined ? 0 : state.flow.listDepth + 1, DEEPEST_LEVEL);
    const items = elementsOf(element).filter((child) => child.name === "li");
    const ordered = element.name === "ol";
    const reversed = ordered && element.attribs.reversed !== undefined;
    const startAttribute = Number.parseInt(element.attribs.start ?? "", 10);
    let itemNumber = ordered && !Number.isNaN(startAttribute) ? startAttribute : reversed ? items.length : 1;
    // The list each depth's items are in: a list starts again where its kind changes, as in Quill's flat lists
    let lists = new Map<number, { readonly kind: string; readonly list: object }>();

    const readChildren = (children: readonly ChildNode[], inner: State): readonly Content[] =>
        children.flatMap((child): readonly Content[] => {
            if (!isElement(child) || child.name !== "li") {
                return readNode(child, { ...inner, flow: { ...inner.flow, listDepth: depth } }, conversion);
            }
            const itemStyle = computeStyle(conversion.cascade(child, inner.style.customProperties), inner.style, child.attribs.lang);
            if (itemStyle.display === "none") {
                return [];
            }
            if (isListWrapper(child)) {
                // An item with only lists in it, as Lexical writes a list in a list, has no number or bullet of its own
                return readBlock(child, itemStyle, { ...inner, flow: { ...inner.flow, listDepth: depth } }, conversion);
            }
            const value = Number.parseInt(child.attribs.value ?? "", 10);
            // Lexical gives every item its value, which only starts the list again where it isn't the next number
            const restart = ordered && !Number.isNaN(value) && value !== itemNumber;
            itemNumber = restart ? value : itemNumber;
            const quill = child.attribs["data-list"];
            const itemDepth = Math.min(depth + quillIndentOf(child), DEEPEST_LEVEL);
            const checkbox = checkboxOf(child);
            const listStyleType =
                checkbox !== undefined
                    ? "none"
                    : quill === "bullet"
                      ? "disc"
                      : quill === "ordered"
                        ? QUILL_NUMBERS[itemDepth % QUILL_NUMBERS.length]
                        : itemStyle.listStyleType;
            // Only the list's own items are numbered from its start; Quill's deeper ones start at 1
            const level = listLevelOf(listStyleType, itemDepth, itemDepth === depth ? itemNumber : 1);
            const kind = `${level.format} ${level.text}`;
            const current = lists.get(itemDepth);
            const list = current && current.kind === kind && !restart && !reversed ? current.list : {};
            lists = new Map([...lists].filter(([listDepth]) => listDepth < itemDepth));
            // eslint-disable-next-line functional/immutable-data
            lists.set(itemDepth, { kind, list });
            itemNumber += itemDepth !== depth ? 0 : reversed ? -1 : 1;
            return readItem(
                child,
                itemStyle,
                { ...inner, flow: { ...inner.flow, listDepth: itemDepth } },
                conversion,
                { depth: itemDepth, level, list },
                checkbox,
            );
        });

    // A list's padding is the room for its bullets, which Word's levels have
    return readBlock(element, style, { ...state, flow: { ...state.flow, listDepth: depth } }, conversion, { readChildren, padding: false });
};

/** Reads a list item: its paragraphs, the first of which starts it, and its checkbox, if it has one */
const readItem = (
    element: Element,
    style: ComputedStyle,
    state: State,
    conversion: Conversion,
    item: ListItem,
    checkbox: boolean | undefined,
): readonly Block[] => {
    const readChildren = (children: readonly ChildNode[], inner: State): readonly Content[] => [
        ...(checkbox === undefined ? [] : [atom(new CheckBox({ checked: checkbox }), inner), textItem(" ", inner)]),
        ...readNodes(children, inner, conversion),
    ];
    const blocks = readBlock(element, style, state, conversion, { readChildren });
    const firstIndex = blocks.findIndex((block) => block.type !== "block-break");
    const first = blocks[firstIndex] as Block | undefined;
    // The item's paragraph is indented by its list's level, unless it is in an indented block, which adds to it
    const indentLeft = twips(state.flow.indentLeft);
    const marked = (paragraph: ParagraphBlock): ParagraphBlock => {
        const { indent, ...format } = paragraph.format;
        return {
            ...paragraph,
            format:
                indentLeft === 0 && !indent?.right
                    ? format
                    : {
                          ...format,
                          indent: {
                              left: indentLeft + LIST_INDENT * (item.depth + 1),
                              hanging: HANGING,
                              ...(indent?.right ? { right: indent.right } : {}),
                          },
                      },
            item,
        };
    };
    return first?.type === "paragraph"
        ? [...blocks.slice(0, firstIndex), marked(first), ...blocks.slice(firstIndex + 1)]
        : [marked({ type: "paragraph", format: paragraphFormatOf(style, state.flow, 0), content: [] }), ...blocks];
};

/** Reads an item that isn't in a list, such as an `<li>` on its own, or a paragraph that Word's HTML puts in a list */
const readStrayItem = (element: Element, style: ComputedStyle, state: State, conversion: Conversion): readonly Block[] => {
    const word = /mso-list:\s*(l\d+)\s+level(\d+)/i.exec(element.attribs.style ?? "");
    const depth = word
        ? Math.min(Number(word[2]) - 1, DEEPEST_LEVEL)
        : Math.min(state.flow.listDepth === undefined ? 0 : state.flow.listDepth + 1, DEEPEST_LEVEL);
    // Word's HTML has each item's number or bullet in the paragraph, in an element that is left out, from which the
    // list's kind and start are read
    const marker = word
        ? textOf(elementsOf(element).find((child) => /mso-list:\s*ignore/i.test(child.attribs.style ?? "")) ?? element)
              .trim()
              .split(/\s/)[0]
        : "";
    const level = word ? wordListLevelOf(marker, depth) : listLevelOf(style.listStyleType, depth, 1);
    const key = word ? `${word[1]} ${depth}` : undefined;
    const list = key === undefined ? {} : (conversion.wordLists.get(key) ?? {});
    if (key !== undefined) {
        // eslint-disable-next-line functional/immutable-data
        conversion.wordLists.set(key, list);
    }
    return readItem(
        element,
        style,
        { ...state, flow: { ...state.flow, listDepth: depth } },
        conversion,
        { depth, level, list },
        checkboxOf(element),
    );
};

const ROMAN = /^[ivxlcdm]+[.)]?$/i;

/** The level of a list in Word's HTML, from the number or bullet of its item, such as `3.` or `iv)` or `•` */
const wordListLevelOf = (marker: string, depth: number): ListItem["level"] => {
    const numeral = /^(\d+)[.)]?$/.exec(marker);
    if (numeral) {
        return listLevelOf("decimal", depth, Number(numeral[1]));
    }
    // A letter on its own is a letter, as a list of letters is more usual than one of Roman numerals from 50, but i is 1
    if (ROMAN.test(marker) && (marker.replace(/[.)]$/, "").length > 1 || /^i/i.test(marker))) {
        return listLevelOf(marker === marker.toLowerCase() ? "lower-roman" : "upper-roman", depth, romanValue(marker.replace(/[.)]$/, "")));
    }
    const letter = /^([a-z])[.)]?$/i.exec(marker);
    if (letter) {
        return listLevelOf(
            letter[1] === letter[1].toLowerCase() ? "lower-alpha" : "upper-alpha",
            depth,
            letter[1].toLowerCase().charCodeAt(0) - 96,
        );
    }
    return listLevelOf("disc", depth, 1);
};

const romanValue = (roman: string): number => {
    const values: Readonly<Record<string, number>> = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
    const digits = [...roman.toLowerCase()].map((digit) => values[digit]);
    return digits.reduce((total, value, index) => total + (value < (digits[index + 1] ?? 0) ? -value : value), 0);
};

/** Whether a table or its cells say what their borders are, in their CSS or attributes */
const hasBorders = (cascaded: CascadedStyle): boolean => SIDES.some((side) => cascaded.values.has(`border-${side}-style`));

/**
 * Reads a table, with the cells of its rows placed as HTML places them: each in the first column of its row that a
 * cell above doesn't span, spanning the columns and rows it says, within its rows' group. Rows with fewer cells are
 * given empty ones, so each row has as many columns as the table. Its caption is a paragraph before it.
 */
const readTable = (element: Element, style: ComputedStyle, state: State, conversion: Conversion): readonly Content[] => {
    const inner = stateIn(style, state, {}, { indentLeft: 0, indentRight: 0 });
    const children = elementsOf(element);
    const styleOf = (child: Element, parent: State): State => {
        const childStyle = computeStyle(conversion.cascade(child, parent.style.customProperties), parent.style, child.attribs.lang);
        return stateIn(childStyle, parent, {});
    };

    const caption = children.find((child) => child.name === "caption");
    const captionBlocks = caption
        ? readBlock(caption, styleOf(caption, inner).style, inner, conversion).map((block) =>
              block.type === "paragraph" ? { ...block, format: { ...block.format, keepNext: true } } : block,
          )
        : [];

    // The parser puts each row in a group, a <tbody> if the HTML has none
    const groups = children.filter((child) => ["thead", "tbody", "tfoot"].includes(child.name));
    const head = groups.find((group) => group.name === "thead");
    const foot = groups.find((group) => group.name === "tfoot");
    const ordered = [...(head ? [head] : []), ...groups.filter((group) => group !== head && group !== foot), ...(foot ? [foot] : [])];

    let borders = hasBorders(conversion.cascade(element, style.customProperties));
    // Each cell's place: its row, its column, and how many it spans
    // eslint-disable-next-line functional/prefer-readonly-type
    const placedCells: {
        readonly row: number;
        readonly column: number;
        readonly element: Element;
        readonly state: State;
        readonly columns: number;
        readonly rows: number;
    }[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    const rowStates: { readonly state: State; readonly header: boolean; readonly cells: number }[] = [];
    const taken = new Set<string>();
    let width = 0;

    for (const group of ordered) {
        const groupState = styleOf(group, inner);
        if (groupState.style.display === "none") {
            continue;
        }
        const groupRows = elementsOf(group)
            .filter((child) => child.name === "tr")
            .map((row) => ({ row, state: styleOf(row, groupState) }))
            .filter((row) => row.state.style.display !== "none");
        const firstRow = rowStates.length;
        for (const [rowIndex, { row, state: rowState }] of groupRows.entries()) {
            const rowNumber = firstRow + rowIndex;
            let column = 0;
            const cells = elementsOf(row).filter((cell) => cell.name === "td" || cell.name === "th");
            for (const cell of cells) {
                const cellState = styleOf(cell, rowState);
                if (cellState.style.display === "none") {
                    continue;
                }
                borders = borders || hasBorders(conversion.cascade(cell, rowState.style.customProperties));
                while (taken.has(`${rowNumber} ${column}`)) {
                    column++;
                }
                const columns = Math.min(Math.max(Number.parseInt(cell.attribs.colspan ?? "1", 10) || 1, 1), 1000);
                const rowSpan = Number.parseInt(cell.attribs.rowspan ?? "1", 10);
                // A row span of 0 spans the rest of the group, and no span goes past it
                const rowsLeft = groupRows.length - rowIndex;
                const spannedRows =
                    Number.isNaN(rowSpan) || rowSpan < 0 ? 1 : rowSpan === 0 ? rowsLeft : Math.min(rowSpan, rowsLeft, 65534);
                for (let spannedRow = 0; spannedRow < spannedRows; spannedRow++) {
                    for (let spannedColumn = 0; spannedColumn < columns; spannedColumn++) {
                        // eslint-disable-next-line functional/immutable-data
                        taken.add(`${rowNumber + spannedRow} ${column + spannedColumn}`);
                    }
                }
                // eslint-disable-next-line functional/immutable-data
                placedCells.push({ row: rowNumber, column, element: cell, state: cellState, columns, rows: spannedRows });
                column += columns;
                width = Math.max(width, column);
            }
            const header =
                group === head ||
                (head === undefined &&
                    rowNumber === rowStates.length &&
                    cells.length > 0 &&
                    cells.every((cell) => cell.name === "th") &&
                    rowStates.every((other) => other.header));
            // eslint-disable-next-line functional/immutable-data
            rowStates.push({ state: rowState, header, cells: cells.length });
        }
    }

    if (width === 0) {
        return captionBlocks;
    }

    const cellBlockOf = (cell: (typeof placedCells)[number]): CellBlock => {
        const cellStyle = cell.state.style;
        const rowStyle = rowStates[cell.row].state.style;
        const background = cellStyle.backgroundColor ?? rowStyle.backgroundColor ?? style.backgroundColor;
        const verticalAlign = [cellStyle.verticalAlign, rowStyle.verticalAlign].find(
            (align) => align === "top" || align === "middle" || align === "bottom",
        );
        const { padding } = cellStyle;
        const cellBorders = SIDES.filter((side) => cellStyle.border[side]);
        return {
            options: {
                ...(cell.columns > 1 ? { columnSpan: cell.columns } : {}),
                ...(cell.rows > 1 ? { rowSpan: cell.rows } : {}),
                ...(background ? { shading: { type: ShadingType.CLEAR, fill: background, color: "auto" } } : {}),
                ...(verticalAlign ? { verticalAlign: VERTICAL_ALIGNMENTS[verticalAlign as keyof typeof VERTICAL_ALIGNMENTS] } : {}),
                ...(cellStyle.width ? { width: widthOf(cellStyle.width) } : {}),
                ...(SIDES.some((side) => padding[side] > 0)
                    ? {
                          margins: {
                              top: twips(padding.top),
                              right: twips(padding.right),
                              bottom: twips(padding.bottom),
                              left: twips(padding.left),
                          },
                      }
                    : {}),
                ...(cellBorders.length > 0
                    ? {
                          borders: Object.fromEntries(
                              SIDES.map((side) => [side, cellStyle.border[side] ? borderOf(cellStyle.border[side]!) : NO_BORDER]),
                          ),
                      }
                    : {}),
            },
            content: readBlock(
                cell.element,
                cellStyle,
                { ...cell.state, style: rowStates[cell.row].state.style, flow: { indentLeft: 0, indentRight: 0 } },
                conversion,
                { box: false },
            ),
        };
    };

    const rows: readonly RowBlock[] = rowStates.map(({ state: rowState, header }, rowNumber) => {
        const own = placedCells.filter((cell) => cell.row === rowNumber);
        const free = Array.from({ length: width }, (_, column) => column).filter((column) => !taken.has(`${rowNumber} ${column}`)).length;
        const heights = [rowState.style.height, ...own.map((cell) => cell.state.style.height)].flatMap((height) =>
            height && "points" in height ? [height.points] : [],
        );
        return {
            options: {
                ...(header ? { tableHeader: true } : {}),
                ...(heights.length > 0 ? { height: { value: twips(Math.max(...heights)), rule: HeightRule.ATLEAST } } : {}),
                ...(rowState.style.breakInside === "avoid" ? { cantSplit: true } : {}),
            },
            cells: [...own.map(cellBlockOf), ...Array.from({ length: free }, (): CellBlock => ({ options: {}, content: [] }))],
        };
    });

    const { left, right } = style.margin;
    const indent = twips(state.flow.indentLeft + points(left)) + listIndentOf(state.flow);
    const columnWidths = columnWidthsOf(children, width);
    const table: Block = {
        type: "table",
        options: {
            ...(style.width ? { width: widthOf(style.width) } : {}),
            ...(left === "auto" && right === "auto"
                ? { alignment: AlignmentType.CENTER }
                : left === "auto"
                  ? { alignment: AlignmentType.RIGHT }
                  : {}),
            ...(indent > 0 ? { indent: { size: indent, type: WidthType.DXA } } : {}),
            ...(borders
                ? {
                      borders: {
                          top: style.border.top ? borderOf(style.border.top) : NO_BORDER,
                          right: style.border.right ? borderOf(style.border.right) : NO_BORDER,
                          bottom: style.border.bottom ? borderOf(style.border.bottom) : NO_BORDER,
                          left: style.border.left ? borderOf(style.border.left) : NO_BORDER,
                          insideHorizontal: NO_BORDER,
                          insideVertical: NO_BORDER,
                      },
                  }
                : {}),
            ...(style.tableLayout === "fixed" ? { layout: TableLayoutType.FIXED } : {}),
            ...(style.direction === "rtl" ? { visuallyRightToLeft: true } : {}),
            ...(style.wordStyle ? { style: style.wordStyle } : {}),
            ...(columnWidths ? { columnWidths } : {}),
        },
        rows,
    };
    return [
        ...(style.breakBefore ? [{ type: "block-break", kind: style.breakBefore } as const] : []),
        ...captionBlocks,
        table,
        ...(style.breakAfter ? [{ type: "block-break", kind: style.breakAfter } as const] : []),
    ];
};

const NO_BORDER: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: "auto" };

/** The widths of a table's columns from its `<col>`s, in twips, when they give every column a width in pixels or points */
const columnWidthsOf = (children: readonly Element[], width: number): readonly number[] | undefined => {
    const columns = children.flatMap((child) =>
        // The parser puts each <col> in a <colgroup>, which gives the width of its columns when it has no <col>s
        child.name === "colgroup" ? (elementsOf(child).length > 0 ? elementsOf(child) : [child]) : [],
    );
    const widths = columns.flatMap((column) => {
        const span = Math.max(Number.parseInt(column.attribs.span ?? "1", 10) || 1, 1);
        const pixels = /^\s*(\d+(?:\.\d+)?)\s*(?:px)?\s*$/.exec(
            column.attribs.width ?? /(?:^|;)\s*width\s*:\s*([^;]+)/i.exec(column.attribs.style ?? "")?.[1] ?? "",
        );
        return Array.from({ length: span }, () => (pixels ? twips(Number(pixels[1]) * 0.75) : undefined));
    });
    return widths.length === width && widths.every((value) => value !== undefined) ? (widths as readonly number[]) : undefined;
};

/**
 * Reads HTML into blocks.
 *
 * @param html - The HTML: a whole document, or some of its body
 * @param options - The options of the conversion
 */
export const readHtml = (html: string, options: HtmlOptions): readonly Block[] => {
    const document = parse<Htmlparser2TreeAdapterMap>(html, { treeAdapter: adapter });
    const root = document.children.find((node): node is Element => isElement(node) && node.name === "html")!;
    const body = elementsOf(root).find((element) => element.name === "body")!;

    // The <style>s for print, but not those in a <template>, which isn't shown
    const inTemplate = (element: Element): boolean => {
        let { parent } = element;
        while (parent && parent.type === "tag" && parent.name !== "template") {
            ({ parent } = parent);
        }
        return parent?.type === "tag";
    };
    const styleElements = descendantsOf(root).filter(
        (element) => element.name === "style" && isForPrint(element.attribs.media ?? "") && !inTemplate(element),
    );
    const styleMap = Object.entries(options.styleMap ?? {})
        .map(([selector, style]) => `${selector} { ${WORD_STYLE}: "${style.replace(/["\\]/g, "\\$&")}"; }`)
        .join("\n");
    const cascade = createCascade(
        USER_AGENT_STYLE_SHEET,
        [...styleElements.map(textOf), options.stylesheet ?? "", styleMap],
        presentationalHints,
    );

    const warnings = new Set<string>();
    const conversion: Conversion = {
        options,
        warn: (warning) => {
            // Each warning once, as an element can be read more than once, such as a table's cells
            if (!warnings.has(warning.message)) {
                // eslint-disable-next-line functional/immutable-data
                warnings.add(warning.message);
                options.onWarning?.(warning);
            }
        },
        cascade,
        bookmarks: bookmarksOf(body),
        wordLists: new Map(),
    };

    // The root's font size is what `rem`s are relative to
    const rootStyle = computeStyle(cascade(root, new Map()), ROOT_STYLE, root.attribs.lang);
    const rootState: State = {
        style: { ...rootStyle, rootFontSize: rootStyle.baseFontSize },
        format: {},
        inline: {},
        flow: { indentLeft: 0, indentRight: 0 },
        quotes: 0,
        depth: 0,
    };
    const bodyStyle = computeStyle(cascade(body, rootState.style.customProperties), rootState.style, body.attribs.lang);
    if (bodyStyle.display === "none") {
        return [];
    }
    const state = stateIn(bodyStyle, rootState, {});
    return toBlocks(readNodes(body.children, state, conversion), paragraphFormatOf(bodyStyle, state.flow, 0));
};
