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
    isObject,
    numberOf,
    onOff,
    readParagraphFormat,
    readRunFormat,
    spansOf,
    stringOf,
    styleChain,
    valueOf,
} from "../text-layout";
import { formatNumber } from "./number-format";

/**
 * A paragraph's content: text, tabs, breaks, pictures and bookmarks, and the results of page references, which depend
 * on the pages being worked out.
 */
export type LayoutItem = InlineItem | { readonly type: "pageReference"; readonly bookmark: string; readonly font: TextFont };

export type ParagraphBlock = {
    readonly type: "paragraph";
    readonly items: readonly LayoutItem[];
    /** Its formatting, combined from its styles and its own */
    readonly format: ParagraphFormat;
    readonly tabStops: readonly TabStop[];
    /** The font of its mark */
    readonly markFont: TextFont;
    readonly style?: string;
    /** Why it can't be laid out, when it can't */
    readonly unsupported?: string;
};

export type TableCell = {
    /** The width of the text in the cell, in points: the cell's, less its margins */
    readonly width: number;
    readonly blocks: readonly Block[];
    /** The space above and below the text in the cell, in points */
    readonly marginTop: number;
    readonly marginBottom: number;
    /** Whether it is the first of cells merged down the rows, or one of the rest */
    readonly verticalMerge?: "restart" | "continue";
};

export type TableRow = {
    readonly cells: readonly TableCell[];
    readonly height?: { readonly value: number; readonly rule: "atLeast" | "exact" };
    /** Whether it is repeated at the top of each page the table is on */
    readonly header: boolean;
    /** The width of the border above the row, and, for the last row, below it, in points */
    readonly borderTop: number;
    readonly borderBottom: number;
};

export type TableBlock = {
    readonly type: "table";
    readonly rows: readonly TableRow[];
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
    readonly numberFormat: string;
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
    /** Why none of it can be laid out, when a setting of the whole document changes its lines in ways not yet followed */
    readonly unsupported?: string;
};

type NumberingLevel = {
    readonly format: string;
    readonly text: string;
    readonly suffix: string;
    readonly start: number;
    readonly paragraph: ParagraphFormat;
    readonly run: RunFormat;
};

/** A complex field being read */
type OpenField = {
    // eslint-disable-next-line functional/prefer-readonly-type
    instruction: string;
    // eslint-disable-next-line functional/prefer-readonly-type
    inResult: boolean;
    /** Whether its result is a page reference's, which is worked out rather than read */
    // eslint-disable-next-line functional/prefer-readonly-type
    replaced: boolean;
};

/**
 * What a part of a document, such as its body or a header, is read with. The fields and list numbers carry on from one
 * paragraph to the next.
 */
type Reader = {
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
const DEFAULT_SECTION: Omit<Section, "headers" | "footers"> = {
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
// The space either side of the text in a table cell, when the table doesn't give it: 0.075 inches
const DEFAULT_CELL_MARGIN = 5.4;
const EMUS_PER_POINT = 12700;
// Border widths are in eighths of a point
const EIGHTHS_PER_POINT = 8;
// Formatting switches that don't change how a page reference writes the page's number
// cspell:ignore mergeformatinet
const PLAIN_FORMATS = new Set(["mergeformat", "charformat", "mergeformatinet"]);

const nameOf = (element: XmlObject): string => Object.keys(element)[0];

/** The content of an element, including its text. An element without content has its attributes, or nothing */
const contentOf = (element: XmlObject): readonly unknown[] => {
    const content = element[nameOf(element)];
    return Array.isArray(content) ? content : [content];
};

const twips = (value: unknown): number | undefined => {
    const amount = numberOf(value);
    return amount === undefined ? undefined : amount / TWIPS_PER_POINT;
};

/**
 * The bookmark a PAGEREF field refers to, unless it shows something other than the page's number: its position relative
 * to the bookmark (`\p`), or the number in a format of its own. As docx writes the page numbers.
 */
const pageReferenceOf = (instruction: string): string | undefined => {
    const match = /^\s*PAGEREF\s+("?)([^\s"\\]+)\1(.*)$/i.exec(instruction);
    if (!match) {
        return undefined;
    }
    const [, , bookmark, switches] = match;
    const formats = [...switches.matchAll(/\\\*\s*"?([^\s"\\]+)/g)].map(([, format]) => format.toLowerCase());
    return /\\p\b/i.test(switches) || formats.some((format) => !PLAIN_FORMATS.has(format)) ? undefined : bookmark;
};

/** Whether what is read now is shown: not in a field's instruction, nor in the result of a page reference */
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
 * Reads a field character (`w:fldChar`). A page reference's result is replaced with the page it refers to.
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
        const bookmark = pageReferenceOf(field.instruction);
        // eslint-disable-next-line functional/immutable-data
        field.inResult = true;
        if (bookmark !== undefined && isShown(reader)) {
            // eslint-disable-next-line functional/immutable-data
            field.replaced = true;
            return [{ type: "pageReference", bookmark, font }];
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
                ).map((span) => {
                    const { text, ...spanFont } = span;
                    return { type: "text" as const, text, font: spanFont };
                });
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
            case "w:sym":
                return [{ type: "text", text: "\u25a0", font }];
            case "w:endnoteReference":
                // Its number, as Word writes it in superscript
                return [{ type: "text", text: "1", font: { ...font, size: (font.size ?? 10) * 0.65 } }];
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
            case "w:footnoteReference":
                return "a footnote";
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
            const bookmark = pageReferenceOf(String(attributesOf(element[name])["w:instr"]));
            return bookmark !== undefined && isShown(reader)
                ? [{ type: "pageReference", bookmark, font: fontOf(paragraphRun) }]
                : readInline(contentOf(element), paragraphRun, reader);
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
 * The number of a paragraph in a list, and what follows it, as its list's level writes it. The list's numbers move on.
 */
const readListNumber = (
    properties: readonly XmlObject[],
    paragraphRun: RunFormat,
    reader: Reader,
): { readonly items: readonly LayoutItem[]; readonly level?: NumberingLevel } => {
    const numbering = childrenOf(find(properties, "w:numPr"));
    const id = valueOf(numbering, "w:numId") ?? String(numberOf(attributesOf(find(numbering, "w:numId"))["w:val"]) ?? "");
    const levels = reader.numbering.get(id);
    const index = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"]) ?? 0;
    const level = levels?.[index];
    if (!levels || !level) {
        return { items: [] };
    }
    const counts = reader.counters.get(id) ?? [];
    const current = [...counts.slice(0, index), (counts[index] ?? level.start - 1) + 1];
    // eslint-disable-next-line functional/immutable-data
    reader.counters.set(id, current);
    const text = level.text.replace(/%([1-9])/g, (_, digit: string) => {
        const other = levels[Number(digit) - 1];
        return formatNumber(current[Number(digit) - 1] ?? other?.start ?? 1, other?.format) ?? "1";
    });
    const font = fontOf(combine([paragraphRun, level.run]));
    const suffix: readonly LayoutItem[] =
        level.suffix === "nothing" ? [] : level.suffix === "space" ? [{ type: "text", text: " ", font }] : [{ type: "tab", font }];
    return { items: [...(text.length > 0 ? [{ type: "text" as const, text, font }] : []), ...suffix], level };
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
    const list = readListNumber(properties, paragraphRun, reader);
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
        ...(typeof items === "string" || unsupported ? { unsupported: typeof items === "string" ? items : unsupported } : {}),
    };
};

const borderWidth = (borders: readonly XmlObject[], name: string): number => {
    const attributes = attributesOf(find(borders, name));
    const style = attributes["w:val"];
    return style === undefined || style === "nil" || style === "none" ? 0 : (numberOf(attributes["w:sz"]) ?? 0) / EIGHTHS_PER_POINT;
};

/** The margins of the cells of a table (`w:tblCellMar`), or of one cell (`w:tcMar`), in points */
const readCellMargins = (element: unknown): Partial<Record<"top" | "bottom" | "left" | "right", number>> => {
    const children = childrenOf(element);
    const side = (...names: readonly string[]): number | undefined =>
        names.map((name) => twips(attributesOf(find(children, name))["w:w"])).find((value) => value !== undefined);
    return Object.fromEntries(
        Object.entries({
            top: side("w:top"),
            bottom: side("w:bottom"),
            left: side("w:start", "w:left"),
            right: side("w:end", "w:right"),
        }).filter(([, value]) => value !== undefined),
    );
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

/**
 * Reads a table (`w:tbl`): the width, margins and content of each cell, and the height and borders of each row.
 */
const readTable = (element: XmlObject, reader: Reader): TableBlock => {
    const children = contentOf(element).filter(isObject);
    const properties = childrenOf(find(children, "w:tblPr"));
    const style = valueOf(properties, "w:tblStyle");
    const tableMargins = {
        top: 0,
        bottom: 0,
        left: DEFAULT_CELL_MARGIN,
        right: DEFAULT_CELL_MARGIN,
        ...readCellMargins(find(properties, "w:tblCellMar")),
    };
    const borders = childrenOf(find(properties, "w:tblBorders"));
    const grid = childrenOf(find(children, "w:tblGrid"))
        .filter((child) => "w:gridCol" in child)
        .map((column) => twips(attributesOf(column["w:gridCol"])["w:w"]) ?? 0);
    const rows = rowsOf(children);

    const read = rows.map((row, rowIndex): TableRow => {
        const rowChildren = contentOf(row).filter(isObject);
        const rowProperties = childrenOf(find(rowChildren, "w:trPr"));
        const heightAttributes = attributesOf(find(rowProperties, "w:trHeight"));
        const height = twips(heightAttributes["w:val"]);
        const { "w:hRule": rule } = heightAttributes;
        const skipped = numberOf(attributesOf(find(rowProperties, "w:gridBefore"))["w:val"]) ?? 0;
        const { cells } = cellsOf(rowChildren).reduce<{ readonly column: number; readonly cells: readonly TableCell[] }>(
            ({ column, cells: done }, cell) => {
                const cellChildren = contentOf(cell).filter(isObject);
                const cellProperties = childrenOf(find(cellChildren, "w:tcPr"));
                const span = numberOf(attributesOf(find(cellProperties, "w:gridSpan"))["w:val"]) ?? 1;
                const mergeElement = find(cellProperties, "w:vMerge");
                const merge =
                    mergeElement === undefined ? undefined : attributesOf(mergeElement)["w:val"] === "restart" ? "restart" : "continue";
                const margins = { ...tableMargins, ...readCellMargins(find(cellProperties, "w:tcMar")) };
                const columns = grid.slice(column, column + span);
                const width =
                    columns.length > 0
                        ? columns.reduce((total, value) => total + value, 0)
                        : (twips(attributesOf(find(cellProperties, "w:tcW"))["w:w"]) ?? 0);
                return {
                    column: column + span,
                    cells: [
                        ...done,
                        {
                            width: width - margins.left - margins.right,
                            blocks: readBlocks(cellChildren, reader, style),
                            marginTop: margins.top,
                            marginBottom: margins.bottom,
                            ...(merge ? { verticalMerge: merge } : {}),
                        },
                    ],
                };
            },
            { column: skipped, cells: [] },
        );
        return {
            cells,
            // A height without a rule is the least the row can be, as Word writes it
            ...(height !== undefined && rule !== "auto" ? { height: { value: height, rule: rule === "exact" ? "exact" : "atLeast" } } : {}),
            header: onOff(rowProperties, "w:tblHeader") === true,
            borderTop: borderWidth(borders, rowIndex === 0 ? "w:top" : "w:insideH"),
            borderBottom: rowIndex === rows.length - 1 ? borderWidth(borders, "w:bottom") : 0,
        };
    });
    const unsupported = read
        .flatMap(({ cells }) => cells)
        .flatMap(({ blocks }) => blocks)
        .find((block) => block.unsupported !== undefined)?.unsupported;
    return { type: "table", rows: read, ...(unsupported ? { unsupported } : {}) };
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

/**
 * Reads a section's properties (`w:sectPr`): its pages, how it starts, and its headers and footers. A section that
 * doesn't give a header or footer for a kind of page has the one of the section before.
 */
const readSection = (element: unknown, readPart: (id: string) => readonly Block[] | undefined, previous?: Section): Section => {
    const properties = childrenOf(element);
    const size = attributesOf(find(properties, "w:pgSz"));
    const margins = attributesOf(find(properties, "w:pgMar"));
    const numbering = attributesOf(find(properties, "w:pgNumType"));
    const columns = find(properties, "w:cols");
    const grid = attributesOf(find(properties, "w:docGrid"))["w:type"];
    const start = valueOf(properties, "w:type");
    const format = stringOf(numbering["w:fmt"]) ?? "decimal";
    const firstNumber = numberOf(numbering["w:start"]);
    const columnCount = Math.max(
        numberOf(attributesOf(columns)["w:num"]) ?? 1,
        childrenOf(columns).filter((child) => "w:col" in child).length,
    );
    const unsupported =
        columnCount > 1
            ? "columns"
            : grid === "lines" || grid === "linesAndChars" || grid === "snapToChars"
              ? "a document grid"
              : numbering["w:chapStyle"] !== undefined || formatNumber(1, format) === undefined
                ? "page numbers in a format not yet written"
                : find(properties, "w:textDirection") !== undefined
                  ? "text that runs down the page"
                  : undefined;
    const headers = readReferences(properties, "w:headerReference", readPart);
    const footers = readReferences(properties, "w:footerReference", readPart);
    return {
        pageWidth: twips(size["w:w"]) ?? DEFAULT_SECTION.pageWidth,
        pageHeight: twips(size["w:h"]) ?? DEFAULT_SECTION.pageHeight,
        marginTop: twips(margins["w:top"]) ?? DEFAULT_SECTION.marginTop,
        marginBottom: twips(margins["w:bottom"]) ?? DEFAULT_SECTION.marginBottom,
        marginLeft: twips(margins["w:left"] ?? margins["w:start"]) ?? DEFAULT_SECTION.marginLeft,
        marginRight: twips(margins["w:right"] ?? margins["w:end"]) ?? DEFAULT_SECTION.marginRight,
        header: twips(margins["w:header"]) ?? DEFAULT_SECTION.header,
        footer: twips(margins["w:footer"]) ?? DEFAULT_SECTION.footer,
        gutter: twips(margins["w:gutter"]) ?? DEFAULT_SECTION.gutter,
        start: start !== undefined && START_TYPES.has(start as Section["start"]) ? (start as Section["start"]) : "nextPage",
        titlePage: onOff(properties, "w:titlePg") === true,
        numberFormat: format,
        ...(firstNumber === undefined ? {} : { firstNumber }),
        headers: { ...previous?.headers, ...headers },
        footers: { ...previous?.footers, ...footers },
        ...(unsupported ? { unsupported } : {}),
    };
};

/**
 * Reads the levels of each list in the document's numbering (`w:numbering`), by the ids its paragraphs refer to it by:
 * its number, and the placeholder docx writes before it is given one.
 */
const readNumbering = (context: IContext, styles: TextStyles): ReadonlyMap<string, readonly NumberingLevel[]> => {
    const numbering = context.file.Numbering;
    const xml = numbering.prepForXml(READING_CONTEXT) as XmlObject;
    const root = childrenOf(xml["w:numbering"]);
    const abstract = new Map(
        root
            .filter((child) => "w:abstractNum" in child)
            .map((child) => {
                const levels = childrenOf(child["w:abstractNum"])
                    .filter((level) => "w:lvl" in level)
                    .map((level) => {
                        const levelChildren = childrenOf(level["w:lvl"]);
                        return {
                            index: numberOf(attributesOf(level["w:lvl"])["w:ilvl"])!,
                            level: {
                                format: valueOf(levelChildren, "w:numFmt") ?? "decimal",
                                text: stringOf(attributesOf(find(levelChildren, "w:lvlText"))["w:val"]) ?? "",
                                suffix: valueOf(levelChildren, "w:suff") ?? "tab",
                                start: numberOf(attributesOf(find(levelChildren, "w:start"))["w:val"])!,
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
    // Each list refers to one of the definitions docx writes with it
    const byNumber = root
        .filter((child) => "w:num" in child)
        .map((child) => {
            const abstractId = String(numberOf(attributesOf(find(childrenOf(child["w:num"]), "w:abstractNumId"))["w:val"]));
            return [String(attributesOf(child["w:num"])["w:numId"]), abstract.get(abstractId)!] as const;
        });
    const numbers = new Map(byNumber);
    const placeholders = numbering.ConcreteNumbering.map(
        (concrete) => [`{${concrete.reference}-${concrete.instance}}`, numbers.get(String(concrete.numId))!] as const,
    );
    return new Map([...byNumber, ...placeholders]);
};

/**
 * Reads the parts of the document's settings (`w:settings`) that change how it is laid out.
 */
const readSettings = (
    context: IContext,
): Pick<DocumentContent, "defaultTabStop" | "evenAndOddHeaders" | "addsParagraphSpacing" | "unsupported"> => {
    const settings = childrenOf((context.file.Settings.prepForXml(READING_CONTEXT) as XmlObject)["w:settings"]);
    return {
        defaultTabStop: twips(attributesOf(find(settings, "w:defaultTabStop"))["w:val"]) ?? 36,
        evenAndOddHeaders: onOff(settings, "w:evenAndOddHeaders") === true,
        addsParagraphSpacing: onOff(childrenOf(find(settings, "w:compat")), "w:doNotUseHTMLParagraphAutoSpacing") === true,
        ...(onOff(settings, "w:autoHyphenation") === true ? { unsupported: "hyphenation" } : {}),
    };
};

/**
 * Reads a document's body, as it is written, with its styles, lists, settings, headers and footers.
 *
 * @param body - The formatted body (`w:body`)
 * @param context - The context it was formatted in, with the document it is in
 */
export const readDocument = (body: IXmlableObject, context: IContext): DocumentContent => {
    const styles = getTextStyles(context);
    const numbering = readNumbering(context, styles);
    const readerOf = (inHeader: boolean): Reader => ({ styles, numbering, inHeader, fields: [], counters: new Map() });

    // Each header and footer, the first time a section refers to it
    const parts = new Map<string, readonly Block[] | undefined>();
    const readPart = (id: string): readonly Block[] | undefined => {
        if (!parts.has(id)) {
            const wrapper = [...context.file.Headers, ...context.file.Footers].find(({ View }) => `rId${View.ReferenceId}` === id);
            const xml = wrapper?.View.prepForXml({ ...context, viewWrapper: wrapper, stack: [] }) as XmlObject | undefined;
            // A header or footer is written with its attributes and its paragraphs and tables
            // eslint-disable-next-line functional/immutable-data
            parts.set(id, xml && readBlocks(Object.values(xml)[0] as readonly unknown[], readerOf(true)));
        }
        return parts.get(id);
    };

    const reader = readerOf(false);
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
                for (const block of readBlocks([element], reader)) {
                    const markers = bookmarks.map((marker) => ({ type: "marker" as const, name: marker }));
                    const marked = block.type === "paragraph" && markers.length > 0;
                    // eslint-disable-next-line functional/immutable-data
                    blocks.push({ block: marked ? { ...block, items: [...markers, ...block.items] } : block, section: sections.length });
                    bookmarks = marked ? [] : bookmarks;
                }
                const sectionProperties =
                    name === "w:p" ? find(childrenOf(find(contentOf(element).filter(isObject), "w:pPr")), "w:sectPr") : undefined;
                if (sectionProperties !== undefined) {
                    addSection(sectionProperties);
                }
            }
        }
    };
    // The body is written with its section's properties at its end, if nothing else
    read(Object.values(body as XmlObject)[0] as readonly unknown[]);
    if (sections.length === 0 || blocks.some(({ section }) => section >= sections.length)) {
        addSection(undefined);
    }

    return { blocks, sections, ...readSettings(context) };
};
