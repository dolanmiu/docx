/**
 * Reads a document, as it is written, into what its pages are laid out from: its paragraphs, with their text, pictures,
 * bookmarks and formatting, its tables, and its sections, with their pages, margins, headers and footers.
 *
 * What can't be laid out yet, such as a picture that text wraps around, is marked as unsupported, with why, so the page
 * numbers after it are left blank rather than guessed.
 *
 * @module
 */
import type { IContext, IXmlableObject } from "docx";

import {
    type InlineItem,
    type KinsokuList,
    type LineBreakRules,
    type ParagraphFormat,
    READING_CONTEXT,
    type RunFormat,
    TWIPS_PER_POINT,
    type TabStop,
    type TabStopSetting,
    type TextFont,
    type TextStyles,
    type XmlObject,
    attributesOf,
    childrenOf,
    combine,
    find,
    fontOf,
    getTextStyles,
    isEastAsianRun,
    isObject,
    isOff,
    kinsokuLanguageOf,
    numberOf,
    onOff,
    readCellMargins,
    readParagraphFormat,
    readRunFormat,
    spansOf,
    stringOf,
    styleChain,
    valueOf,
    withoutUndefined,
} from "../text-layout";
import { formatNumber, formatPageNumber } from "./number-format";

/**
 * A paragraph's content: text, tabs, breaks, pictures and bookmarks, and the results of fields that depend on the pages
 * being worked out: the page of a bookmark a page reference refers to, and the number of pages of the document or of the
 * section it is in.
 */
export type LayoutItem =
    | InlineItem
    | { readonly type: "pageReference"; readonly bookmark: string; readonly font: TextFont }
    | { readonly type: "pageCount"; readonly scope: "document" | "section"; readonly font: TextFont };

export type ParagraphBlock = {
    readonly type: "paragraph";
    readonly items: readonly LayoutItem[];
    /** Its formatting, combined from its styles and its own */
    readonly format: ParagraphFormat;
    readonly tabStops: readonly TabStop[];
    /** The font of its mark */
    readonly markFont: TextFont;
    readonly style?: string;
    /**
     * When its style is one of Word's headings ("heading 1" to "heading 9"), the heading's level, and its number as the
     * chapter number of the pages after it, when its style numbers it
     */
    readonly heading?: { readonly level: number; readonly chapter?: string };
    /** Whether it is empty but for its section's properties, as docx writes the end of each section but the last */
    readonly sectionBreak?: boolean;
    /** Why it can't be laid out, when it can't */
    readonly unsupported?: string;
};

export type TableCell = {
    /** The column of the table's grid the cell starts in, counted from 0 */
    readonly column: number;
    /** How many columns of the grid the cell is across, when it is across more than one */
    readonly span?: number;
    /** The width of the text in the cell, in points: the cell's, less its margins */
    readonly width: number;
    /** The width the cell gives itself, in points: its own, or for a share of the table's width, the grid's */
    readonly ownWidth?: number;
    readonly blocks: readonly Block[];
    /** The space around the text in the cell, in points */
    readonly marginTop: number;
    readonly marginBottom: number;
    readonly marginLeft: number;
    readonly marginRight: number;
    /** Whether it is the first of cells merged down the rows, or one of the rest */
    readonly verticalMerge?: "restart" | "continue";
};

export type TableRow = {
    readonly cells: readonly TableCell[];
    readonly height?: { readonly value: number; readonly rule: "atLeast" | "exact" };
    /** Whether it is repeated at the top of each page the table is on */
    readonly header: boolean;
    /** Whether it moves to the next page whole, rather than breaking across the pages, when it doesn't fit */
    readonly cantSplit: boolean;
    /** The width of the border above the row, and, for the last row, below it, in points */
    readonly borderTop: number;
    readonly borderBottom: number;
};

export type TableBlock = {
    readonly type: "table";
    readonly rows: readonly TableRow[];
    /**
     * Given when Word sizes the table's columns to their text, as it does when some of its cells have no widths, with the
     * table's own width, in points or as a share of the width it is in. Its cells' widths are then worked out as it is
     * laid out, in place of those read
     */
    readonly fit?: { readonly width?: number; readonly share?: number };
    /**
     * Given when Word widens a column for a word longer than the width its cells give it, as it does in a table whose
     * cells all have widths, unless its layout is fixed, with the table's own width, as for `fit`, and whether any of its
     * cells are merged across columns
     */
    readonly widen?: { readonly width?: number; readonly share?: number; readonly acrossColumns: boolean };
    /** The width of the borders left and right of the table, in points */
    readonly borderLeft?: number;
    readonly borderRight?: number;
    readonly unsupported?: string;
};

export type Block = ParagraphBlock | TableBlock;

/** The headers or footers of a section, by the pages they are on */
export type HeadersOrFooters = {
    readonly default?: readonly Block[];
    readonly first?: readonly Block[];
    readonly even?: readonly Block[];
};

/**
 * A section's pages. Lengths are in points.
 */
export type Section = {
    readonly pageWidth: number;
    readonly pageHeight: number;
    readonly marginTop: number;
    readonly marginBottom: number;
    readonly marginLeft: number;
    readonly marginRight: number;
    /** The distance from the top of the page to the header, and from the bottom to the footer */
    readonly header: number;
    readonly footer: number;
    readonly gutter: number;
    /** How the section starts: on a new page, an even or odd one, or on the same page as the one before */
    readonly start: "nextPage" | "continuous" | "evenPage" | "oddPage" | "nextColumn";
    /** Whether its first page has a header and footer of its own */
    readonly titlePage: boolean;
    /** The width of each of its columns, from the first: the width of the page's text for a section of one column */
    readonly columns: readonly number[];
    readonly numberFormat: string;
    /**
     * When its page numbers start with a chapter number: the level of the headings that number the chapters, and what
     * goes between the chapter number and the page's
     */
    readonly chapters?: { readonly level: number; readonly separator: string };
    /** The number of its first page, when it doesn't carry on from the section before */
    readonly firstNumber?: number;
    readonly headers: HeadersOrFooters;
    readonly footers: HeadersOrFooters;
    readonly unsupported?: string;
};

/**
 * A document, read to be laid out.
 */
export type DocumentContent = {
    /** The blocks of its body, with the index of the section each is in */
    readonly blocks: readonly { readonly block: Block; readonly section: number }[];
    readonly sections: readonly Section[];
    /** The distance between default tab stops, in points */
    readonly defaultTabStop: number;
    /** Whether even pages have headers and footers of their own */
    readonly evenAndOddHeaders: boolean;
    /**
     * Whether the space between paragraphs is the space after the first and the space before the second added together,
     * as it is with the compatibility setting `doNotUseHTMLParagraphAutoSpacing`, rather than the larger of them
     */
    readonly addsParagraphSpacing: boolean;
    /** The footnotes the body refers to, by the names of the markers at their references */
    readonly footnotes: ReadonlyMap<string, readonly Block[]>;
    /** What is above the footnotes at the bottom of a page: the paragraph of the line that separates them from the text */
    readonly footnoteSeparator: readonly Block[];
    /** What is above them instead when a footnote continues from the page before: the paragraph of a longer line */
    readonly footnoteContinuationSeparator: readonly Block[];
    /** The endnotes the body refers to, in order, after their separator: they follow the body, as Word lays them out */
    readonly endnotes: readonly Block[];
    /** Where its lines break: the characters that can't start or end a line, where it gives its own */
    readonly breakRules?: LineBreakRules;
    /** Why none of it can be laid out, when a setting of the whole document changes its lines in ways not yet followed */
    readonly unsupported?: string;
};

type NumberingLevel = {
    /** The paragraph style the level is for, which numbers its paragraphs at this level (`w:pStyle`) */
    readonly style?: string;
    readonly format: string;
    readonly text: string;
    readonly suffix: string;
    readonly start: number;
    readonly paragraph: ParagraphFormat;
    readonly run: RunFormat;
};

type NoteKind = "footnote" | "endnote";

/** What a reference to a footnote or endnote shows: its number, and, for a footnote, the marker its note is placed by */
type NoteReference = { readonly label: string; readonly marker?: string };

/** Reads the footnote or endnote a reference in the body refers to, and numbers it */
type NoteReader = { readonly read: (kind: NoteKind, id: string) => NoteReference };

/** A complex field being read */
type OpenField = {
    // eslint-disable-next-line functional/prefer-readonly-type
    instruction: string;
    // eslint-disable-next-line functional/prefer-readonly-type
    inResult: boolean;
    /** Whether its result depends on the pages, so it is worked out rather than read */
    // eslint-disable-next-line functional/prefer-readonly-type
    replaced: boolean;
};

/**
 * What a part of a document, such as its body or a header, is read with. The fields and list numbers carry on from one
 * paragraph to the next.
 */
type Reader = {
    /** Reads the notes the references refer to: the body's. References elsewhere have no notes */
    readonly notes?: NoteReader;
    /** The number of the footnote or endnote being read, which the mark at its start shows */
    readonly noteNumber?: string;
    readonly styles: TextStyles;
    /** The levels of each list, by the id its paragraphs refer to it by */
    readonly numbering: ReadonlyMap<string, readonly NumberingLevel[]>;
    /** Whether it is a header or footer, where drawings that text doesn't flow around don't matter */
    readonly inHeader: boolean;
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly fields: OpenField[];
    /** The numbers each list is at, by its id and then level */
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly counters: Map<string, number[]>;
};

// Word's defaults for a section that doesn't give its page: Letter, with inch margins
const DEFAULT_SECTION: Omit<Section, "headers" | "footers" | "columns"> = {
    pageWidth: 612,
    pageHeight: 792,
    marginTop: 72,
    marginBottom: 72,
    marginLeft: 72,
    marginRight: 72,
    header: 36,
    footer: 36,
    gutter: 0,
    start: "nextPage",
    titlePage: false,
    numberFormat: "decimal",
};
/** What goes between a chapter number and a page number, by `w:chapSep`. Word puts a hyphen when it isn't given */
const CHAPTER_SEPARATORS: Readonly<Record<string, string>> = { hyphen: "-", period: ".", colon: ":", emDash: "\u2014", enDash: "\u2013" };
const EMUS_PER_POINT = 12700;
/** How far apart, in points, the widths two rows give a column can be before they differ: rounding, not a choice */
const WIDTH_TOLERANCE = 1;
/** The most columns a table in Word can have */
const MOST_COLUMNS = 63;
// Border widths are in eighths of a point
const EIGHTHS_PER_POINT = 8;
// Shares of a width, such as a table's of the page's, are in fiftieths of a percent, unless they are written with a %
const FIFTIETHS_OF_A_PERCENT = 5000;
// Formatting switches that don't change how a page reference writes the page's number
// cspell:ignore mergeformatinet
const PLAIN_FORMATS = new Set(["mergeformat", "charformat", "mergeformatinet"]);

const nameOf = (element: XmlObject): string => Object.keys(element)[0];

/** The content of an element, including its text. An element without content has its attributes, or nothing */
const contentOf = (element: XmlObject): readonly unknown[] => {
    const content = element[nameOf(element)];
    return Array.isArray(content) ? content : [content];
};

// How wide the number of a footnote or endnote is, next to text of its size: Word writes it in superscript
const SUPERSCRIPT_WIDTH = 0.65;

/**
 * The number of a footnote or endnote, at its reference or at the start of the note: as narrow as superscript, and as tall
 * as its font, as LibreOffice lays it out.
 */
const noteNumber = (text: string, font: TextFont): LayoutItem => ({
    type: "text",
    text,
    font: { ...font, scale: (font.scale ?? 100) * SUPERSCRIPT_WIDTH },
});

const twips = (value: unknown): number | undefined => {
    const amount = numberOf(value);
    return amount === undefined ? undefined : amount / TWIPS_PER_POINT;
};

/** Whether a field's switches give its number a format of its own, such as `\* roman`, or a picture, such as `\# "00"` */
const hasOwnFormat = (switches: string): boolean => {
    const formats = [...switches.matchAll(/\\\*\s*"?([^\s"\\]+)/g)].map(([, format]) => format.toLowerCase());
    return /\\#/.test(switches) || formats.some((format) => !PLAIN_FORMATS.has(format));
};

/**
 * The result of a field that depends on the pages being worked out, as docx writes it: the page of the bookmark a PAGEREF
 * field refers to, or the number of pages of the document (NUMPAGES) or of its section (SECTIONPAGES). Undefined for other
 * fields, and for those that show something else: a page's position relative to the bookmark (`\p`), or a number in a
 * format of its own.
 */
const workedOutResultOf = (instruction: string, font: TextFont): LayoutItem | undefined => {
    const reference = /^\s*PAGEREF\s+("?)([^\s"\\]+)\1(.*)$/i.exec(instruction);
    if (reference) {
        const [, , bookmark, switches] = reference;
        return /\\p\b/i.test(switches) || hasOwnFormat(switches) ? undefined : { type: "pageReference", bookmark, font };
    }
    const count = /^\s*(NUMPAGES|SECTIONPAGES)\b(.*)$/i.exec(instruction);
    return count && !hasOwnFormat(count[2])
        ? { type: "pageCount", scope: count[1].toUpperCase() === "NUMPAGES" ? "document" : "section", font }
        : undefined;
};

/** Whether what is read now is shown: not in a field's instruction, nor in a result that is worked out */
const isShown = ({ fields }: Reader): boolean => fields.every((field) => field.inResult && !field.replaced);

/** Adds the tab stops of a paragraph, or of its style, to those of the styles before */
const addTabs = (stops: readonly TabStopSetting[], settings: readonly TabStopSetting[] = []): readonly TabStopSetting[] =>
    settings.reduce(
        (all, setting) => [
            ...all.filter((stop) => Math.abs(stop.position - setting.position) > 0.01),
            ...(setting.alignment === "clear" ? [] : [setting]),
        ],
        stops,
    );

const tabStopsOf = (formats: readonly ParagraphFormat[]): readonly TabStop[] =>
    formats
        .reduce<readonly TabStopSetting[]>((stops, { tabs }) => addTabs(stops, tabs), [])
        .filter((stop): stop is TabStop => stop.alignment !== "bar" && stop.alignment !== "clear");

/**
 * Reads a drawing in a run (`w:drawing`): a picture in the line is a box, and one that text doesn't flow around, such as
 * one behind the text, takes up no room.
 */
const readDrawing = (element: XmlObject, reader: Reader): readonly LayoutItem[] | string => {
    const [drawing] = childrenOf(element["w:drawing"]);
    const inline = drawing["wp:inline"];
    if (inline !== undefined) {
        const children = childrenOf(inline);
        const extent = attributesOf(find(children, "wp:extent"));
        const effect = attributesOf(find(children, "wp:effectExtent"));
        const around = attributesOf(inline);
        const emus = (...values: readonly unknown[]): number => values.reduce<number>((total, value) => total + (numberOf(value) ?? 0), 0);
        return [
            {
                type: "box",
                width: emus(extent.cx, effect.l, effect.r, around.distL, around.distR) / EMUS_PER_POINT,
                height: emus(extent.cy, effect.t, effect.b, around.distT, around.distB) / EMUS_PER_POINT,
            },
        ];
    }
    const flowsAround = !childrenOf(drawing["wp:anchor"]).some((child) => "wp:wrapNone" in child);
    return flowsAround && !reader.inHeader ? "a drawing that text flows around" : [];
};

/**
 * Reads a field character (`w:fldChar`). The result of a field that depends on the pages is worked out, rather than read.
 */
const readFieldCharacter = (element: XmlObject, font: TextFont, reader: Reader): readonly LayoutItem[] => {
    const type = attributesOf(element["w:fldChar"])["w:fldCharType"];
    const { fields } = reader;
    const field = fields[fields.length - 1];
    if (type === "begin") {
        // eslint-disable-next-line functional/immutable-data
        fields.push({ instruction: "", inResult: false, replaced: false });
    } else if (type === "end") {
        // eslint-disable-next-line functional/immutable-data
        fields.pop();
    } else if (type === "separate" && field) {
        const result = workedOutResultOf(field.instruction, font);
        // eslint-disable-next-line functional/immutable-data
        field.inResult = true;
        if (result !== undefined && isShown(reader)) {
            // eslint-disable-next-line functional/immutable-data
            field.replaced = true;
            return [result];
        }
    }
    return [];
};

/**
 * Reads a run (`w:r`) in the paragraph's formatting, as its character style and its own formatting change it.
 */
const readRun = (element: XmlObject, paragraphRun: RunFormat, reader: Reader): readonly LayoutItem[] | string => {
    const { styles } = reader;
    const children = contentOf(element).filter(isObject);
    const properties = find(children, "w:rPr");
    const characterStyle = valueOf(childrenOf(properties), "w:rStyle") ?? styles.defaultCharacterStyle;
    const format = combine([
        paragraphRun,
        ...styleChain(styles, characterStyle, "character").map(({ run }) => run),
        readRunFormat(properties, styles.themeFonts),
    ]);
    const font = fontOf(format);
    const items: readonly (readonly LayoutItem[] | string)[] = children.map((child): readonly LayoutItem[] | string => {
        const name = nameOf(child);
        if (name === "w:fldChar") {
            return readFieldCharacter(child, font, reader);
        }
        const field = reader.fields[reader.fields.length - 1];
        if (name === "w:instrText") {
            if (field && !field.inResult) {
                // eslint-disable-next-line functional/immutable-data
                field.instruction += contentOf(child)
                    .filter((part) => typeof part === "string")
                    .join("");
            }
            return [];
        }
        if (!isShown(reader)) {
            return [];
        }
        switch (name) {
            case "w:t":
                return spansOf(
                    contentOf(child)
                        .filter((part) => typeof part === "string")
                        .join(""),
                    format,
                ).map(({ text, ...spanFont }) => ({
                    type: "text" as const,
                    text,
                    font: spanFont,
                    // Where its lines break depends on its language, and whether its run is East Asian
                    ...(format.eastAsianLanguage === undefined ? {} : { language: format.eastAsianLanguage }),
                    ...(isEastAsianRun(format) ? { eastAsian: true } : {}),
                }));
            case "w:tab":
            case "w:ptab":
                return format.hidden ? [] : [{ type: "tab", font }];
            case "w:br": {
                const kind = attributesOf(child["w:br"])["w:type"];
                return format.hidden ? [] : [{ type: "break", kind: kind === "page" || kind === "column" ? kind : "line", font }];
            }
            case "w:cr":
                return format.hidden ? [] : [{ type: "break", kind: "line", font }];
            case "w:noBreakHyphen":
                return [{ type: "text", text: "\u2011", font }];
            case "w:sym": {
                // A symbol is a character of its own font: most often a symbol font's own, such as Wingdings' tick, F0FC,
                // whose width isn't known, so the layout stops there, as it does at other characters it can't measure
                const { "w:font": symbolFont, "w:char": character } = attributesOf(child["w:sym"]);
                const code = parseInt(String(character), 16);
                return Number.isNaN(code)
                    ? []
                    : [
                          {
                              type: "text",
                              text: String.fromCodePoint(code),
                              font: symbolFont === undefined ? font : { ...font, font: String(symbolFont) },
                          },
                      ];
            }
            case "w:footnoteReference":
            case "w:endnoteReference": {
                const note = reader.notes?.read(
                    name === "w:footnoteReference" ? "footnote" : "endnote",
                    String(attributesOf(child[name])["w:id"]),
                );
                return note === undefined
                    ? []
                    : [...(note.marker ? [{ type: "marker" as const, name: note.marker }] : []), noteNumber(note.label, font)];
            }
            case "w:footnoteRef":
            case "w:endnoteRef":
                return reader.noteNumber === undefined ? [] : [noteNumber(reader.noteNumber, font)];
            case "w:drawing":
                return readDrawing(child, reader);
            case "mc:AlternateContent": {
                // The drawing Word reads, rather than the one for older versions
                const choice = childrenOf(child["mc:AlternateContent"]).find((option) => "mc:Choice" in option);
                return choice ? readRun({ "w:r": [...childrenOf(choice["mc:Choice"])] }, paragraphRun, reader) : [];
            }
            case "w:pict":
            case "w:object":
                return reader.inHeader ? [] : "a VML drawing";
            default:
                return [];
        }
    });
    const unsupported = items.find((item): item is string => typeof item === "string");
    return unsupported ?? items.flatMap((item) => item as readonly LayoutItem[]);
};

// Elements in a paragraph that hold runs and are read through
const RUN_CONTAINERS = new Set(["w:hyperlink", "w:ins", "w:moveTo", "w:smartTag", "w:customXml", "w:dir", "w:bdo", "w:sdtContent"]);

/**
 * Reads the content of a paragraph, or of an element in it, such as a hyperlink.
 */
const readInline = (elements: readonly unknown[], paragraphRun: RunFormat, reader: Reader): readonly LayoutItem[] | string => {
    const parts = elements.filter(isObject).map((element): readonly LayoutItem[] | string => {
        const name = nameOf(element);
        if (name === "w:r") {
            return readRun(element, paragraphRun, reader);
        }
        if (RUN_CONTAINERS.has(name)) {
            return readInline(contentOf(element), paragraphRun, reader);
        }
        if (name === "w:sdt") {
            return readInline(childrenOf(find(childrenOf(element[name]), "w:sdtContent")), paragraphRun, reader);
        }
        if (name === "w:fldSimple") {
            const result = workedOutResultOf(String(attributesOf(element[name])["w:instr"]), fontOf(paragraphRun));
            return result !== undefined && isShown(reader) ? [result] : readInline(contentOf(element), paragraphRun, reader);
        }
        if (name === "w:bookmarkStart") {
            const bookmark = stringOf(attributesOf(element[name])["w:name"]);
            return bookmark === undefined ? [] : [{ type: "marker", name: bookmark }];
        }
        return name === "m:oMath" || name === "m:oMathPara" ? "an equation" : [];
    });
    const unsupported = parts.find((part): part is string => typeof part === "string");
    return unsupported ?? parts.flatMap((part) => part as readonly LayoutItem[]);
};

/**
 * The number of a paragraph in a list, and what follows it, as its list's level writes it, and its number as a chapter
 * number. A paragraph is in the list it gives, or else in its style's. The list's numbers move on.
 */
const readListNumber = (
    properties: readonly XmlObject[],
    style: string | undefined,
    paragraphRun: RunFormat,
    reader: Reader,
): {
    readonly items: readonly LayoutItem[];
    readonly level?: NumberingLevel;
    /** Whether it is in its style's list, or in one it gives itself, and its number as a chapter number, when it has one */
    readonly from?: "style" | "paragraph";
    readonly chapter?: string;
} => {
    const numbering = childrenOf(find(properties, "w:numPr"));
    const ownId = valueOf(numbering, "w:numId") ?? numberOf(attributesOf(find(numbering, "w:numId"))["w:val"])?.toString();
    const ownLevel = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"]);
    // The list and level each from the nearest style that gives it, as a style based on another takes what it doesn't give
    const fromStyle = styleChain(reader.styles, style, "paragraph").reduce<{ readonly id?: string; readonly level?: number }>(
        (inherited, { numbering: given }) => ({ ...inherited, ...given }),
        {},
    );
    const id = ownId ?? fromStyle.id ?? "";
    const levels = reader.numbering.get(id);
    // A style's list numbers it at the level it gives, or else at the level that is for it
    const linked = levels?.findIndex((other) => other?.style !== undefined && other.style === style) ?? -1;
    const index = ownLevel ?? (ownId === undefined ? fromStyle.level : undefined) ?? Math.max(linked, 0);
    const level = levels?.[index];
    if (!levels || !level) {
        return { items: [] };
    }
    const counts = reader.counters.get(id) ?? [];
    const current = [...counts.slice(0, index), (counts[index] ?? level.start - 1) + 1];
    // eslint-disable-next-line functional/immutable-data
    reader.counters.set(id, current);
    const numberAt = (at: number): string => {
        const other = levels[at];
        return formatNumber(current[at] ?? other?.start ?? 1, other?.format) ?? "1";
    };
    const text = level.text.replace(/%([1-9])/g, (_, digit: string) => numberAt(Number(digit) - 1));
    // As a chapter number, Word writes the level's text from its first number to its last, so "Chapter %1" is 1 and
    // "%1.%2" is 1.2
    const numbers = /%[1-9](?:.*%[1-9])?/.exec(level.text)?.[0];
    const font = fontOf(combine([paragraphRun, level.run]));
    const suffix: readonly LayoutItem[] =
        level.suffix === "nothing" ? [] : level.suffix === "space" ? [{ type: "text", text: " ", font }] : [{ type: "tab", font }];
    return {
        items: [...(text.length > 0 ? [{ type: "text" as const, text, font }] : []), ...suffix],
        level,
        from: ownId === undefined ? "style" : "paragraph",
        ...withoutUndefined({ chapter: numbers?.replace(/%([1-9])/g, (_, digit: string) => numberAt(Number(digit) - 1)) }),
    };
};

/**
 * Reads a paragraph (`w:p`), in the formatting of its styles, and of its table's style when it is in a table.
 */
const readParagraph = (element: XmlObject, reader: Reader, tableStyle?: string): ParagraphBlock => {
    const { styles } = reader;
    const children = contentOf(element);
    const properties = childrenOf(find(children.filter(isObject), "w:pPr"));
    const style = valueOf(properties, "w:pStyle") ?? styles.defaultParagraphStyle;
    const paragraphStyles = [...styleChain(styles, tableStyle, "table"), ...styleChain(styles, style, "paragraph")];
    const paragraphRun = combine([styles.run, ...paragraphStyles.map(({ run }) => run)]);
    const list = readListNumber(properties, style, paragraphRun, reader);
    const headingLevel = /^heading ([1-9])$/i.exec(styleChain(styles, style, "paragraph").slice(-1)[0]?.name ?? "")?.[1];
    const formats = [
        styles.paragraph,
        ...paragraphStyles.map(({ paragraph }) => paragraph),
        ...(list.level ? [list.level.paragraph] : []),
        readParagraphFormat(properties),
    ];
    const items = readInline(children, paragraphRun, reader);
    const unsupported = find(properties, "w:framePr") === undefined ? undefined : "a text frame";
    return {
        type: "paragraph",
        items: typeof items === "string" ? [] : [...list.items, ...items],
        format: combine(formats),
        tabStops: tabStopsOf(formats),
        markFont: fontOf(combine([paragraphRun, readRunFormat(find(properties, "w:rPr"), styles.themeFonts)])),
        style,
        // Word's chapter numbers are the numbers headings' styles give them, and it passes over headings numbered on their
        // own, or not at all
        ...(headingLevel === undefined
            ? {}
            : {
                  heading: {
                      level: Number(headingLevel),
                      ...withoutUndefined({ chapter: list.from === "style" ? list.chapter : undefined }),
                  },
              }),
        ...(typeof items === "string" || unsupported ? { unsupported: typeof items === "string" ? items : unsupported } : {}),
    };
};

const borderWidth = (borders: readonly XmlObject[], name: string): number => {
    const attributes = attributesOf(find(borders, name));
    const style = attributes["w:val"];
    return style === undefined || style === "nil" || style === "none" ? 0 : (numberOf(attributes["w:sz"]) ?? 0) / EIGHTHS_PER_POINT;
};

/** The rows of a table, or of a content control or custom XML in it */
const rowsOf = (elements: readonly unknown[]): readonly XmlObject[] =>
    elements.filter(isObject).flatMap((element) => {
        const name = nameOf(element);
        if (name === "w:tr") {
            return [element];
        }
        if (name === "w:sdt") {
            return rowsOf(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
        }
        return name === "w:customXml" ? rowsOf(contentOf(element)) : [];
    });

/** The cells of a row */
const cellsOf = (elements: readonly unknown[]): readonly XmlObject[] =>
    elements.filter(isObject).flatMap((element) => {
        const name = nameOf(element);
        if (name === "w:tc") {
            return [element];
        }
        if (name === "w:sdt") {
            return cellsOf(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
        }
        return name === "w:customXml" ? cellsOf(contentOf(element)) : [];
    });

/** A share of a width, as a fraction, from fiftieths of a percent or a percentage written with a % */
const shareOf = (value: unknown): number | undefined => {
    const amount = numberOf(value);
    if (amount === undefined) {
        return undefined;
    }
    return typeof value === "string" && value.trim().endsWith("%") ? amount / 100 : amount / FIFTIETHS_OF_A_PERCENT;
};

/** A table's own width (`w:tblW`): in points, or as a share of the width it is in. Neither when it is sized to its content */
const readTableWidth = (properties: readonly XmlObject[]): NonNullable<TableBlock["fit"]> => {
    const { "w:w": value, "w:type": type = "dxa" } = attributesOf(find(properties, "w:tblW"));
    const width = type === "dxa" ? twips(value) : undefined;
    const share = type === "pct" ? shareOf(value) : undefined;
    return {
        ...(width !== undefined && width > 0 ? { width } : {}),
        ...(share !== undefined && share > 0 ? { share } : {}),
    };
};

/**
 * Reads a table (`w:tbl`): the width, margins and content of each cell, and the height and borders of each row. Word
 * sizes the columns of a table whose cells don't all have widths to their text, and widens a column of one whose cells
 * all have widths for a word longer than they give it, unless its layout is fixed, so those are worked out as it is laid
 * out.
 */
const readTable = (element: XmlObject, reader: Reader): TableBlock => {
    const children = contentOf(element).filter(isObject);
    const properties = childrenOf(find(children, "w:tblPr"));
    const style = valueOf(properties, "w:tblStyle");
    // The margins of the table's style, or of the default table style when it has none that is a table style, and the
    // styles it is based on, then its own. Without any, Word gives cells none
    const ownStyles = styleChain(reader.styles, style, "table");
    const tableStyles = ownStyles.length > 0 ? ownStyles : styleChain(reader.styles, reader.styles.defaultTableStyle, "table");
    const tableMargins = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        ...Object.assign({}, ...tableStyles.map(({ cellMargins }) => cellMargins)),
        ...readCellMargins(find(properties, "w:tblCellMar")),
    };
    const borders = childrenOf(find(properties, "w:tblBorders"));
    const grid = childrenOf(find(children, "w:tblGrid"))
        .filter((child) => "w:gridCol" in child)
        .map((column) => twips(attributesOf(column["w:gridCol"])["w:w"]) ?? 0);
    const rows = rowsOf(children);

    const gridWidth = (from: number, to: number): number => grid.slice(from, to).reduce((total, value) => total + value, 0);

    const read = rows.map(
        (row, rowIndex): { readonly row: TableRow; readonly edges: ReadonlyMap<number, number>; readonly end: number } => {
            const rowChildren = contentOf(row).filter(isObject);
            const rowProperties = childrenOf(find(rowChildren, "w:trPr"));
            const heightAttributes = attributesOf(find(rowProperties, "w:trHeight"));
            const height = twips(heightAttributes["w:val"]);
            const { "w:hRule": rule } = heightAttributes;
            const skipped = numberOf(attributesOf(find(rowProperties, "w:gridBefore"))["w:val"]) ?? 0;
            // Where each cell's edges are, by the grid column they are at, to check the rows agree on them
            const {
                cells,
                edges,
                column: end,
            } = cellsOf(rowChildren).reduce<{
                readonly column: number;
                readonly cells: readonly TableCell[];
                readonly edges: ReadonlyMap<number, number>;
            }>(
                ({ column, cells: done, edges: before }, cell) => {
                    const cellChildren = contentOf(cell).filter(isObject);
                    const cellProperties = childrenOf(find(cellChildren, "w:tcPr"));
                    const span = numberOf(attributesOf(find(cellProperties, "w:gridSpan"))["w:val"]) ?? 1;
                    const mergeElement = find(cellProperties, "w:vMerge");
                    const merge =
                        mergeElement === undefined ? undefined : attributesOf(mergeElement)["w:val"] === "restart" ? "restart" : "continue";
                    const margins = { ...tableMargins, ...readCellMargins(find(cellProperties, "w:tcMar")) };
                    // Word lays a cell out at its own width in twips, when it has one, rather than the grid's. A share of the
                    // table's width is the grid's
                    const { "w:w": ownWidth, "w:type": widthType = "dxa" } = attributesOf(find(cellProperties, "w:tcW"));
                    const inTwips = widthType === "dxa" ? (twips(ownWidth) ?? 0) : 0;
                    const hasWidth = inTwips > 0 || (widthType === "pct" && (shareOf(ownWidth) ?? 0) > 0);
                    const width = inTwips > 0 ? inTwips : gridWidth(column, column + span);
                    return {
                        column: column + span,
                        edges: new Map([...before, [column + span, before.get(column)! + width]]),
                        cells: [
                            ...done,
                            {
                                column,
                                ...(span > 1 ? { span } : {}),
                                width: width - margins.left - margins.right,
                                ...(hasWidth ? { ownWidth: width } : {}),
                                blocks: readBlocks(cellChildren, reader, style),
                                marginTop: margins.top,
                                marginBottom: margins.bottom,
                                marginLeft: margins.left,
                                marginRight: margins.right,
                                ...(merge ? { verticalMerge: merge } : {}),
                            },
                        ],
                    };
                },
                { column: skipped, cells: [], edges: new Map([[skipped, gridWidth(0, skipped)]]) },
            );
            return {
                edges,
                end,
                row: {
                    cells,
                    // A height without a rule is the least the row can be, as Word writes it
                    ...(height !== undefined && rule !== "auto"
                        ? { height: { value: height, rule: rule === "exact" ? "exact" : "atLeast" } }
                        : {}),
                    header: onOff(rowProperties, "w:tblHeader") === true,
                    cantSplit: onOff(rowProperties, "w:cantSplit") === true,
                    borderTop: borderWidth(borders, rowIndex === 0 ? "w:top" : "w:insideH"),
                    borderBottom: rowIndex === rows.length - 1 ? borderWidth(borders, "w:bottom") : 0,
                },
            };
        },
    );
    // Cells over the same columns whose widths put a column's edge in different places in different rows, which Word
    // settles in a way not yet followed
    const edgesAt = new Map<number, number>();
    const unequal = read.some(({ edges }) =>
        [...edges].some(([column, edge]) => {
            const other = edgesAt.get(column) ?? edge;
            // eslint-disable-next-line functional/immutable-data
            edgesAt.set(column, other);
            return Math.abs(other - edge) > WIDTH_TOLERANCE;
        }),
    );
    const tableCells = read.flatMap(({ row }) => row.cells);
    const blocks = tableCells.flatMap((cell) => cell.blocks);
    const fixed = attributesOf(find(properties, "w:tblLayout"))["w:type"] === "fixed";
    const fits = !fixed && tableCells.some(({ ownWidth }) => ownWidth === undefined);
    // How Word lays out a table of more columns than it can have isn't known, and sizing one to its text would count a
    // column for each it says it has, however many
    const columns = read.reduce((most, { end }) => Math.max(most, end), 0);
    const unfitted = columns > MOST_COLUMNS ? `a table given no widths of more than ${MOST_COLUMNS} columns` : undefined;
    const unsupported =
        (fits ? unfitted : unequal ? "a table whose rows give a column different widths" : undefined) ??
        blocks.find((block) => block.unsupported !== undefined)?.unsupported;
    return {
        type: "table",
        rows: read.map(({ row }) => row),
        ...(fits ? { fit: readTableWidth(properties) } : {}),
        ...(!fits && !fixed
            ? { widen: { ...readTableWidth(properties), acrossColumns: tableCells.some(({ span }) => span !== undefined) } }
            : {}),
        borderLeft: borderWidth(borders, "w:left"),
        borderRight: borderWidth(borders, "w:right"),
        ...(unsupported ? { unsupported } : {}),
    };
};

/**
 * Reads the paragraphs and tables in a part of a document, such as a table cell or a header, and in the content controls
 * and custom XML in it.
 */
const readBlocks = (elements: readonly unknown[], reader: Reader, tableStyle?: string): readonly Block[] =>
    elements.filter(isObject).flatMap((element): readonly Block[] => {
        switch (nameOf(element)) {
            case "w:p":
                return [readParagraph(element, reader, tableStyle)];
            case "w:tbl":
                return [readTable(element, reader)];
            case "w:sdt":
                return readBlocks(childrenOf(find(childrenOf(element["w:sdt"]), "w:sdtContent")), reader, tableStyle);
            case "w:customXml":
                return readBlocks(contentOf(element), reader, tableStyle);
            case "w:altChunk":
                return [{ type: "paragraph", items: [], format: {}, tabStops: [], markFont: {}, unsupported: "an imported document" }];
            default:
                return [];
        }
    });

const START_TYPES = new Set<Section["start"]>(["nextPage", "continuous", "evenPage", "oddPage", "nextColumn"]);

/** The headers or footers a section refers to, by the pages they are on */
const readReferences = (
    properties: readonly XmlObject[],
    name: "w:headerReference" | "w:footerReference",
    readPart: (id: string) => readonly Block[] | undefined,
): HeadersOrFooters =>
    Object.fromEntries(
        properties
            .filter((child) => name in child)
            .map((child) => {
                const attributes = attributesOf(child[name]);
                return [String(attributes["w:type"] ?? "default"), readPart(String(attributes["r:id"]))] as const;
            })
            .filter(([type, blocks]) => blocks !== undefined && ["default", "first", "even"].includes(type)),
    );

// The space between columns when a section doesn't give it: half an inch
const DEFAULT_COLUMN_SPACE = 36;

/**
 * The width of each of a section's columns (`w:cols`), from the width of its page's text: columns of the same width with
 * the same space between them, unless the section gives each column's width.
 */
const readColumns = (element: unknown, width: number): readonly number[] => {
    const attributes = attributesOf(element);
    const given = childrenOf(element).filter((child) => "w:col" in child);
    if (isOff(attributes["w:equalWidth"]) && given.length > 0) {
        return given.map((column) => twips(attributesOf(column["w:col"])["w:w"]) ?? 0);
    }
    const count = Math.max(1, numberOf(attributes["w:num"]) ?? 1);
    const space = twips(attributes["w:space"]) ?? DEFAULT_COLUMN_SPACE;
    return Array.from({ length: count }, () => (width - space * (count - 1)) / count);
};

/**
 * Reads a section's properties (`w:sectPr`): its pages, how it starts, and its headers and footers. A section that
 * doesn't give a header or footer for a kind of page has the one of the section before.
 */
const readSection = (element: unknown, readPart: (id: string) => readonly Block[] | undefined, previous?: Section): Section => {
    const properties = childrenOf(element);
    const size = attributesOf(find(properties, "w:pgSz"));
    const margins = attributesOf(find(properties, "w:pgMar"));
    const numbering = attributesOf(find(properties, "w:pgNumType"));
    const grid = attributesOf(find(properties, "w:docGrid"))["w:type"];
    const start = valueOf(properties, "w:type");
    const format = stringOf(numbering["w:fmt"]) ?? "decimal";
    const firstNumber = numberOf(numbering["w:start"]);
    const chapterLevel = numberOf(numbering["w:chapStyle"]);
    const pageWidth = twips(size["w:w"]) ?? DEFAULT_SECTION.pageWidth;
    const marginLeft = twips(margins["w:left"] ?? margins["w:start"]) ?? DEFAULT_SECTION.marginLeft;
    const marginRight = twips(margins["w:right"] ?? margins["w:end"]) ?? DEFAULT_SECTION.marginRight;
    const gutter = twips(margins["w:gutter"]) ?? DEFAULT_SECTION.gutter;
    const columns = readColumns(find(properties, "w:cols"), pageWidth - marginLeft - marginRight - gutter);
    const unsupported =
        grid === "lines" || grid === "linesAndChars" || grid === "snapToChars"
            ? "a document grid"
            : formatPageNumber(1, format) === undefined
              ? "page numbers in a format not yet written"
              : find(properties, "w:textDirection") !== undefined
                ? "text that runs down the page"
                : undefined;
    const headers = readReferences(properties, "w:headerReference", readPart);
    const footers = readReferences(properties, "w:footerReference", readPart);
    return {
        pageWidth,
        pageHeight: twips(size["w:h"]) ?? DEFAULT_SECTION.pageHeight,
        marginTop: twips(margins["w:top"]) ?? DEFAULT_SECTION.marginTop,
        marginBottom: twips(margins["w:bottom"]) ?? DEFAULT_SECTION.marginBottom,
        marginLeft,
        marginRight,
        header: twips(margins["w:header"]) ?? DEFAULT_SECTION.header,
        footer: twips(margins["w:footer"]) ?? DEFAULT_SECTION.footer,
        gutter,
        start: start !== undefined && START_TYPES.has(start as Section["start"]) ? (start as Section["start"]) : "nextPage",
        titlePage: onOff(properties, "w:titlePg") === true,
        columns,
        numberFormat: format,
        ...(chapterLevel === undefined || chapterLevel < 1 || chapterLevel > 9
            ? {}
            : { chapters: { level: chapterLevel, separator: CHAPTER_SEPARATORS[String(numbering["w:chapSep"])] ?? "-" } }),
        ...(firstNumber === undefined ? {} : { firstNumber }),
        headers: { ...previous?.headers, ...headers },
        footers: { ...previous?.footers, ...footers },
        ...(unsupported ? { unsupported } : {}),
    };
};

/**
 * Reads the levels of each list in the document's numbering (`w:numbering`), by the ids its paragraphs refer to it by:
 * its number, and any other name it has, such as the placeholder docx writes before it is given one.
 */
const readNumbering = (
    xml: XmlObject | undefined,
    styles: TextStyles,
    otherIds: ReadonlyMap<string, string>,
): ReadonlyMap<string, readonly NumberingLevel[]> => {
    const root = childrenOf(xml?.["w:numbering"]);
    const abstract = new Map(
        root
            .filter((child) => "w:abstractNum" in child)
            .map((child) => {
                const levels = childrenOf(child["w:abstractNum"])
                    .filter((level) => "w:lvl" in level)
                    .map((level) => {
                        const levelChildren = childrenOf(level["w:lvl"]);
                        return {
                            index: numberOf(attributesOf(level["w:lvl"])["w:ilvl"]) ?? 0,
                            level: {
                                ...withoutUndefined({ style: valueOf(levelChildren, "w:pStyle") }),
                                format: valueOf(levelChildren, "w:numFmt") ?? "decimal",
                                text: stringOf(attributesOf(find(levelChildren, "w:lvlText"))["w:val"]) ?? "",
                                suffix: valueOf(levelChildren, "w:suff") ?? "tab",
                                // A level that doesn't give its first number starts at 0
                                start: numberOf(attributesOf(find(levelChildren, "w:start"))["w:val"]) ?? 0,
                                paragraph: readParagraphFormat(find(levelChildren, "w:pPr")),
                                run: readRunFormat(find(levelChildren, "w:rPr"), styles.themeFonts),
                            },
                        };
                    });
                const byIndex = levels.reduce<readonly NumberingLevel[]>((all, { index, level }) => {
                    const copy = [...all];
                    // eslint-disable-next-line functional/immutable-data
                    copy[index] = level;
                    return copy;
                }, []);
                return [String(attributesOf(child["w:abstractNum"])["w:abstractNumId"]), byIndex] as const;
            }),
    );
    // Each list refers to one of the definitions
    const numbers = new Map(
        root
            .filter((child) => "w:num" in child)
            .flatMap((child) => {
                const abstractId = String(numberOf(attributesOf(find(childrenOf(child["w:num"]), "w:abstractNumId"))["w:val"]));
                const levels = abstract.get(abstractId);
                return levels ? [[String(attributesOf(child["w:num"])["w:numId"]), levels] as const] : [];
            }),
    );
    return new Map([
        ...numbers,
        ...[...otherIds].flatMap(([other, id]) => {
            const levels = numbers.get(id);
            return levels ? [[other, levels] as const] : [];
        }),
    ]);
};

// The compatibility mode of Word 2013 and later, which lay out pages as Word does today. A document in an older one, or
// without one, is laid out as that version of Word laid it out
const CURRENT_COMPATIBILITY_MODE = 15;

/**
 * The document's own lists of the characters that can't start a line (`w:noLineBreaksBefore`) and can't end one
 * (`w:noLineBreaksAfter`), which take the place of Word's for their language.
 */
const readKinsokuLists = (settings: readonly XmlObject[]): NonNullable<LineBreakRules["lists"]> =>
    settings.reduce<NonNullable<LineBreakRules["lists"]>>((lists, child) => {
        const name = nameOf(child);
        const attributes = attributesOf(child[name]);
        const language = kinsokuLanguageOf(stringOf(attributes["w:lang"]));
        if ((name !== "w:noLineBreaksBefore" && name !== "w:noLineBreaksAfter") || language === undefined) {
            return lists;
        }
        const list: KinsokuList = { [name === "w:noLineBreaksBefore" ? "noLineStart" : "noLineEnd"]: String(attributes["w:val"] ?? "") };
        return { ...lists, [language]: { ...lists[language], ...list } };
    }, {});

/**
 * Reads the parts of the document's settings (`w:settings`) that change how it is laid out.
 */
const readSettings = (
    xml: XmlObject | undefined,
): Pick<DocumentContent, "defaultTabStop" | "evenAndOddHeaders" | "addsParagraphSpacing" | "breakRules" | "unsupported"> => {
    const settings = childrenOf(xml?.["w:settings"]);
    const compatibility = childrenOf(find(settings, "w:compat"));
    const lists = readKinsokuLists(settings);
    const spacingControl = valueOf(settings, "w:characterSpacingControl");
    const mode = numberOf(
        attributesOf(
            compatibility.find(
                (child) => "w:compatSetting" in child && attributesOf(child["w:compatSetting"])["w:name"] === "compatibilityMode",
            )?.["w:compatSetting"],
        )["w:val"],
    );
    // Word's strict rules, and its compression of punctuation, aren't known yet
    const unsupported =
        onOff(settings, "w:autoHyphenation") === true
            ? "hyphenation"
            : onOff(settings, "w:strictFirstAndLastChars") === true
              ? "the strict rules for the characters that can't start a line"
              : spacingControl !== undefined && spacingControl !== "doNotCompress"
                ? "punctuation compressed"
                : mode === undefined || mode < CURRENT_COMPATIBILITY_MODE
                  ? "a document in compatibility mode"
                  : undefined;
    return {
        defaultTabStop: twips(attributesOf(find(settings, "w:defaultTabStop"))["w:val"]) ?? 36,
        evenAndOddHeaders: onOff(settings, "w:evenAndOddHeaders") === true,
        addsParagraphSpacing: onOff(compatibility, "w:doNotUseHTMLParagraphAutoSpacing") === true,
        ...(Object.keys(lists).length > 0 ? { breakRules: { lists } } : {}),
        ...(unsupported ? { unsupported } : {}),
    };
};

/**
 * The parts of a document other than its body that it is read with, as elements formatted as docx writes them: those of
 * a document being written, or those of a .docx (see `read-docx.ts`).
 */
export type DocumentParts = {
    /** Its defaults and styles, with the fonts of its theme */
    readonly styles: TextStyles;
    /** Its numbering (`w:numbering`), if it has any */
    readonly numbering?: XmlObject;
    /** Other ids its lists are referred to by, with the number of the list each is: the placeholders docx writes */
    readonly otherListIds?: ReadonlyMap<string, string>;
    /** Its settings (`w:settings`), if it has any */
    readonly settings?: XmlObject;
    /** The content of each header and footer, by the id of the relationship to it: its attributes, paragraphs and tables */
    readonly headersAndFooters: ReadonlyMap<string, readonly unknown[]>;
    /** Its footnotes (`w:footnotes`), if it has any */
    readonly footnotes?: XmlObject;
    /** Its endnotes (`w:endnotes`), if it has any */
    readonly endnotes?: XmlObject;
};

/**
 * The parts of the document being written, formatted to be read.
 */
const partsOfFile = (context: IContext): DocumentParts => {
    const { file } = context;
    const styles = getTextStyles(context);
    // The lists that styles number their paragraphs in are added to the document as its styles are written, after its
    // body, so they are added now to be read
    for (const style of styles.styles.values()) {
        const placeholder = /^\{(.+)-(\d+)\}$/.exec(style.numbering?.id ?? "");
        if (placeholder) {
            file.Numbering.createConcreteNumberingInstance(placeholder[1], Number(placeholder[2]));
        }
    }
    // Formatting a part needs a context with the part in it
    const format = (wrapper: { readonly View: { readonly prepForXml: (context: IContext) => unknown } }): XmlObject =>
        wrapper.View.prepForXml({ ...context, viewWrapper: wrapper as unknown as IContext["viewWrapper"], stack: [] }) as XmlObject;
    return {
        styles,
        numbering: file.Numbering.prepForXml(READING_CONTEXT) as XmlObject,
        // docx writes a placeholder for each list in the paragraphs, before it is given its number
        otherListIds: new Map(
            file.Numbering.ConcreteNumbering.map((concrete) => [`{${concrete.reference}-${concrete.instance}}`, String(concrete.numId)]),
        ),
        settings: file.Settings.prepForXml(READING_CONTEXT) as XmlObject,
        // A header or footer is written with its attributes and its paragraphs and tables
        headersAndFooters: new Map(
            [...file.Headers, ...file.Footers].map(
                (wrapper) => [`rId${wrapper.View.ReferenceId}`, Object.values(format(wrapper))[0] as readonly unknown[]] as const,
            ),
        ),
        footnotes: format(file.FootNotes),
        endnotes: format(file.Endnotes),
    };
};

/**
 * Reads a document's body, as it is written, with its styles, lists, settings, headers and footers.
 *
 * @param body - The formatted body (`w:body`)
 * @param context - The context it was formatted in, with the document it is in
 */
export const readDocument = (body: IXmlableObject, context: IContext): DocumentContent =>
    readContent(body as XmlObject, partsOfFile(context));

/**
 * Reads a document's body (`w:body`), with the other parts of the document.
 */
export const readContent = (body: XmlObject, parts: DocumentParts): DocumentContent => {
    const { styles } = parts;
    const numbering = readNumbering(parts.numbering, styles, parts.otherListIds ?? new Map());
    const readerOf = (inHeader: boolean): Reader => ({ styles, numbering, inHeader, fields: [], counters: new Map() });

    // Each header and footer, the first time a section refers to it
    const headersAndFooters = new Map<string, readonly Block[] | undefined>();
    const readPart = (id: string): readonly Block[] | undefined => {
        if (!headersAndFooters.has(id)) {
            const content = parts.headersAndFooters.get(id);
            // eslint-disable-next-line functional/immutable-data
            headersAndFooters.set(id, content && readBlocks(content, readerOf(true)));
        }
        return headersAndFooters.get(id);
    };

    // The footnotes and endnotes, by their ids, and the separators above them
    const noteElements = (kind: NoteKind): ReadonlyMap<string, XmlObject> => {
        const xml = kind === "footnote" ? parts.footnotes : parts.endnotes;
        const notes = childrenOf(xml && Object.values(xml)[0]).filter((child) => `w:${kind}` in child);
        return new Map(
            notes.map((note) => {
                const attributes = attributesOf(note[`w:${kind}`]);
                const type = attributes["w:type"];
                return [String(type === "separator" || type === "continuationSeparator" ? type : attributes["w:id"]), note] as const;
            }),
        );
    };
    const notesByKind = { footnote: noteElements("footnote"), endnote: noteElements("endnote") };
    const readNoteContent = (kind: NoteKind, id: string, label?: string): readonly Block[] => {
        const note = notesByKind[kind].get(id);
        return note === undefined
            ? []
            : readBlocks(contentOf(note), { ...readerOf(false), ...(label === undefined ? {} : { noteNumber: label }) });
    };
    const footnotes = new Map<string, readonly Block[]>();
    // eslint-disable-next-line functional/prefer-readonly-type
    const endnotes: Block[] = [];
    const noteCounts = { footnote: 0, endnote: 0 };
    // Footnotes are numbered 1, 2, 3 and endnotes i, ii, iii, as Word numbers them unless the document says otherwise
    const readNote = (kind: NoteKind, id: string): NoteReference => {
        // eslint-disable-next-line functional/immutable-data
        noteCounts[kind]++;
        const label = formatNumber(noteCounts[kind], kind === "footnote" ? "decimal" : "lowerRoman")!;
        const content = readNoteContent(kind, id, label);
        if (kind === "endnote") {
            // eslint-disable-next-line functional/immutable-data
            endnotes.push(...content);
            return { label };
        }
        // A name no bookmark can have, as bookmarks' names have no spaces
        const marker = `footnote ${noteCounts[kind]}`;
        // eslint-disable-next-line functional/immutable-data
        footnotes.set(marker, content);
        return { label, marker };
    };

    const reader: Reader = { ...readerOf(false), notes: { read: readNote } };
    // eslint-disable-next-line functional/prefer-readonly-type
    const sections: Section[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    const blocks: { readonly block: Block; readonly section: number }[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    let bookmarks: string[] = [];
    const addSection = (element: unknown): void => {
        sections.push(readSection(element, readPart, sections[sections.length - 1]));
    };
    const read = (elements: readonly unknown[]): void => {
        for (const element of elements.filter(isObject)) {
            const name = nameOf(element);
            if (name === "w:sdt") {
                read(childrenOf(find(childrenOf(element[name]), "w:sdtContent")));
            } else if (name === "w:customXml") {
                read(contentOf(element));
            } else if (name === "w:sectPr") {
                addSection(element[name]);
            } else if (name === "w:bookmarkStart") {
                // A bookmark between paragraphs starts with the next one
                bookmarks = [...bookmarks, String(attributesOf(element[name])["w:name"])];
            } else {
                const sectionProperties =
                    name === "w:p" ? find(childrenOf(find(contentOf(element).filter(isObject), "w:pPr")), "w:sectPr") : undefined;
                for (const block of readBlocks([element], reader)) {
                    const markers = bookmarks.map((marker) => ({ type: "marker" as const, name: marker }));
                    const marked = block.type === "paragraph" && markers.length > 0;
                    const sectionBreak =
                        sectionProperties !== undefined && block.type === "paragraph" && block.items.length === 0 && !marked;
                    // eslint-disable-next-line functional/immutable-data
                    blocks.push({
                        block: marked
                            ? { ...block, items: [...markers, ...block.items] }
                            : sectionBreak
                              ? { ...block, sectionBreak }
                              : block,
                        section: sections.length,
                    });
                    bookmarks = marked ? [] : bookmarks;
                }
                if (sectionProperties !== undefined) {
                    addSection(sectionProperties);
                }
            }
        }
    };
    // The body is written with its section's properties at its end, if nothing else
    read(contentOf(body));
    if (sections.length === 0 || blocks.some(({ section }) => section >= sections.length)) {
        addSection(undefined);
    }

    return {
        blocks,
        sections,
        footnotes,
        footnoteSeparator: footnotes.size > 0 ? readNoteContent("footnote", "separator") : [],
        footnoteContinuationSeparator: footnotes.size > 0 ? readNoteContent("footnote", "continuationSeparator") : [],
        endnotes: endnotes.length > 0 ? [...readNoteContent("endnote", "separator"), ...endnotes] : [],
        ...readSettings(parts.settings),
    };
};
