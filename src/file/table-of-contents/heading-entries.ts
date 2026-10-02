/**
 * Entries written into a table of contents from the headings of the document.
 *
 * A table of contents is a TOC field. Word fills in its entries when it updates the field. Until then, and in
 * applications that don't update it, such as LibreOffice, it shows the entries it was last filled in with, and without
 * any it is empty. So once the body is written, each table of contents that wasn't given `cachedEntries` or
 * `contentChildren` is filled in from the headings its switches include, the way Word fills it in: each heading is
 * bookmarked, and its entry links to the bookmark and gives its page with a PAGEREF field. The page numbers are left
 * empty, because they depend on how the document is laid out. Word fills them in when it updates the field, unless the
 * document's `pageNumbers` writes them.
 *
 * @module
 */
import { BookmarkEnd, BookmarkStart, InternalHyperlink, PageReference, Paragraph, type ParagraphChild } from "@file/paragraph";
import { Run, Tab, TextRun } from "@file/paragraph/run";
import { createBegin, createBeginDirtyWithoutPageNumbers, createEnd, createSeparate } from "@file/paragraph/run/field";
import type { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";
import { bookmarkUniqueNumericId } from "@util/convenience-functions";

import { FieldInstruction } from "./field-instruction";
import { StructuredDocumentTagContent } from "./sdt-content";
import type { ITableOfContentsOptions } from "./table-of-contents-properties";

/** A table of contents to fill in from the headings */
export type HeadingEntriesOptions = {
    readonly properties: ITableOfContentsOptions;
    /**
     * Whether the field is written dirty, as the caller set it. Undefined when the caller didn't: then it is dirty unless
     * the document is given page numbers
     */
    readonly beginDirty?: boolean;
    /** The width, in twips, of the text in its section, where the page numbers are aligned */
    readonly textWidth: number;
};

/**
 * The beginning of a table of contents' field: dirty or clean, as the caller set it, or else dirty unless the document
 * is given page numbers
 */
export const beginOf = (beginDirty: boolean | undefined): XmlComponent =>
    beginDirty === undefined ? createBeginDirtyWithoutPageNumbers() : createBegin(beginDirty);

/** A formatted element, such as `{ "w:p": [...] }` */
type Element = Record<string, unknown>;

type Range = readonly [number, number];

type StyleDetails = {
    readonly name?: string;
    readonly basedOn?: string;
    readonly outlineLevel?: number;
};

type ParagraphDetails = {
    readonly element: Element;
    readonly styleId?: string;
    readonly outlineLevel?: number;
    /** The paragraph's text, with its tabs and line breaks as `\t` and `\n` */
    readonly text: string;
    /** The names of the bookmarks the paragraph is in, for the `\b` switch */
    readonly bookmarks: ReadonlySet<string>;
};

type Entry = {
    readonly title: string;
    readonly level: number;
    readonly bookmark: string;
};

/** The formatted tables of contents, with what each is filled in with, or undefined when it was given its content */
const writtenTables = new WeakMap<object, HeadingEntriesOptions | undefined>();

/**
 * Records a formatted table of contents, so the paragraphs in it aren't taken for headings, with what to fill it in
 * with from the headings once the body it is in is written. That is undefined when it was given its content.
 */
export const recordTableOfContents = (table: IXmlableObject, fillWith: HeadingEntriesOptions | undefined): void => {
    writtenTables.set(table, fillWith);
};

/**
 * The ids of the bookmarks on a body's headings: the first for its first bookmarked heading, and so on. Each is taken
 * from the counter every bookmark shares, the first time it is needed, so a document packed again is written the same.
 */
export class HeadingBookmarkIds {
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly ids: number[] = [];

    public get(index: number): number {
        // eslint-disable-next-line functional/immutable-data
        this.ids[index] ??= bookmarkUniqueNumericId();
        return this.ids[index];
    }
}

/** The name of a formatted element, or `_attr` for its parent's attributes */
const nameOf = (element: unknown): string | undefined =>
    typeof element === "object" && element !== null ? Object.keys(element)[0] : undefined;

/** The children of a formatted element. An element with only attributes has them as its one child */
const childrenOf = (element: unknown): readonly unknown[] => {
    const name = nameOf(element);
    const content = name === undefined ? undefined : (element as Element)[name];
    return Array.isArray(content) ? content : content === undefined ? [] : [content];
};

const childOf = (element: unknown, name: string): unknown => childrenOf(element).find((child) => nameOf(child) === name);

const attributeOf = (element: unknown, attribute: string): unknown =>
    (childOf(element, "_attr") as { readonly _attr?: Record<string, unknown> } | undefined)?._attr?.[attribute];

/** An attribute such as `w:val="2"` as a number. Imported XML gives it as a string */
const numberAttributeOf = (element: unknown, attribute: string): number | undefined => {
    const value = attributeOf(element, attribute);
    return value === undefined ? undefined : Number(value);
};

/** The block-level containers of paragraphs: tables, their rows and cells, and content controls */
const BLOCK_CONTAINERS = new Set(["w:tbl", "w:tr", "w:tc", "w:sdt", "w:sdtContent", "w:customXml"]);

/**
 * The paragraphs and the tables of contents, in the order they are in the body. A table of contents isn't looked into,
 * so the paragraphs in it aren't taken for headings. Nor are paragraphs in text boxes, as in Word.
 */
const blocksOf = (elements: readonly unknown[]): readonly Element[] =>
    elements.flatMap((element) => {
        const name = nameOf(element);
        if (name === "w:p" || writtenTables.has(element as object)) {
            return [element as Element];
        }
        return name !== undefined && BLOCK_CONTAINERS.has(name) ? blocksOf(childrenOf(element)) : [];
    });

/** The elements in a paragraph that its text is in. Deleted text, field instructions and drawings aren't */
const TEXT_CONTAINERS = new Set([
    "w:r",
    "w:hyperlink",
    "w:ins",
    "w:moveTo",
    "w:smartTag",
    "w:customXml",
    "w:sdt",
    "w:sdtContent",
    "w:fldSimple",
    "w:dir",
    "w:bdo",
]);

/** The text an element in a run stands for, such as `\t` for a tab. A page or column break isn't text */
const textOfRunContent = (element: unknown): string => {
    switch (nameOf(element)) {
        case "w:t":
            return childrenOf(element)
                .filter((child) => typeof child === "string")
                .join("");
        case "w:tab":
            return "\t";
        case "w:br":
            return [undefined, "textWrapping"].includes(attributeOf(element, "w:type") as string | undefined) ? "\n" : "";
        case "w:cr":
            return "\n";
        case "w:noBreakHyphen":
            return "-";
        default:
            return "";
    }
};

/** The text of a paragraph. Of a field, only its result is text, not its instruction */
const textOf = (paragraph: Element): string => {
    // For each field that has begun, whether its result has
    // eslint-disable-next-line functional/prefer-readonly-type
    const fields: boolean[] = [];
    const read = (element: unknown): string => {
        const name = nameOf(element);
        if (name !== undefined && TEXT_CONTAINERS.has(name)) {
            return childrenOf(element).map(read).join("");
        }
        if (name === "w:fldChar") {
            const type = attributeOf(element, "w:fldCharType");
            if (type === "begin") {
                // eslint-disable-next-line functional/immutable-data
                fields.push(false);
            } else if (type === "separate") {
                // eslint-disable-next-line functional/immutable-data
                fields[fields.length - 1] = true;
            } else {
                // eslint-disable-next-line functional/immutable-data
                fields.pop();
            }
            return "";
        }
        return fields.every(Boolean) ? textOfRunContent(element) : "";
    };
    return childrenOf(paragraph).map(read).join("");
};

type BookmarkMark = { readonly start: true; readonly id: unknown; readonly name: string } | { readonly start: false; readonly id: unknown };

/** The bookmarks started and ended in an element, in order */
const bookmarkMarksOf = (element: unknown): readonly BookmarkMark[] => {
    const name = nameOf(element);
    if (name === "w:bookmarkStart") {
        return [{ start: true, id: attributeOf(element, "w:id"), name: attributeOf(element, "w:name") as string }];
    }
    if (name === "w:bookmarkEnd") {
        return [{ start: false, id: attributeOf(element, "w:id") }];
    }
    return name === undefined || name === "_attr" ? [] : childrenOf(element).flatMap(bookmarkMarksOf);
};

/**
 * The names of the bookmarks each paragraph is in, for the `\b` switch: those open where it starts, followed through the
 * body, and those that start in it.
 */
const bookmarksOf = (paragraphs: readonly Element[]): readonly ReadonlySet<string>[] => {
    const open = new Map<unknown, string>();
    return paragraphs.map((paragraph) => {
        const marks = bookmarkMarksOf(paragraph);
        const names = new Set([...open.values(), ...marks.flatMap((mark) => (mark.start ? [mark.name] : []))]);
        for (const mark of marks) {
            if (mark.start) {
                // eslint-disable-next-line functional/immutable-data
                open.set(mark.id, mark.name);
            } else {
                // eslint-disable-next-line functional/immutable-data
                open.delete(mark.id);
            }
        }
        return names;
    });
};

/** The details of each paragraph that could be a heading. The bookmarks it is in are only followed when needed */
const paragraphDetailsOf = (paragraphs: readonly Element[], followBookmarks: boolean): readonly ParagraphDetails[] => {
    const bookmarks = followBookmarks ? bookmarksOf(paragraphs) : [];
    return paragraphs.map((element, index) => {
        const properties = childOf(element, "w:pPr");
        return {
            element,
            styleId: attributeOf(childOf(properties, "w:pStyle"), "w:val") as string | undefined,
            outlineLevel: numberAttributeOf(childOf(properties, "w:outlineLvl"), "w:val"),
            text: textOf(element),
            bookmarks: bookmarks[index] ?? new Set(),
        };
    });
};

/** The document's paragraph styles, by id, read from the styles as they are written */
const stylesOf = (context: IContext): ReadonlyMap<string, StyleDetails> => {
    const styles = context.file?.Styles?.prepForXml(context);
    return new Map(
        childrenOf(styles)
            // A style is a paragraph style when its type isn't given
            .filter(
                (style) =>
                    nameOf(style) === "w:style" && ["paragraph", undefined].includes(attributeOf(style, "w:type") as string | undefined),
            )
            .map((style) => [
                attributeOf(style, "w:styleId") as string,
                {
                    name: attributeOf(childOf(style, "w:name"), "w:val") as string | undefined,
                    basedOn: attributeOf(childOf(style, "w:basedOn"), "w:val") as string | undefined,
                    outlineLevel: numberAttributeOf(childOf(childOf(style, "w:pPr"), "w:outlineLvl"), "w:val"),
                },
            ]),
    );
};

/** A range such as `1-3` */
const parseRange = (range: string): Range | undefined => {
    const match = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(range);
    return match ? [Number(match[1]), Number(match[2])] : undefined;
};

const isWithin = (level: number, [from, to]: Range): boolean => level >= from && level <= to;

/** The level of a built-in heading style, Heading 1 to Heading 9, by its name, or by its id when it has no name */
const headingLevelOf = (styleId: string | undefined, styles: ReadonlyMap<string, StyleDetails>): number | undefined => {
    if (styleId === undefined) {
        return undefined;
    }
    const match = /^heading ?([1-9])$/i.exec(styles.get(styleId)?.name ?? styleId);
    return match ? Number(match[1]) : undefined;
};

/**
 * A style's outline level, from 0: its own, or else the one of the style it is based on. A built-in heading style has
 * its heading's. Following the styles it is based on stops after as many as there are, in case they loop.
 */
const styleOutlineLevelOf = (styleId: string | undefined, styles: ReadonlyMap<string, StyleDetails>, depth = 0): number | undefined => {
    if (styleId === undefined || depth > styles.size) {
        return undefined;
    }
    const style = styles.get(styleId);
    const heading = headingLevelOf(styleId, styles);
    return style?.outlineLevel ?? (heading === undefined ? styleOutlineLevelOf(style?.basedOn, styles, depth + 1) : heading - 1);
};

/**
 * Reads the heading level of the document's paragraphs, as the `\s` switch of a SEQ field follows it: the level of a
 * paragraph in a built-in heading style, Heading 1 to Heading 9. A paragraph whose outline level is another, or that has
 * one without a heading style, is `"unclear"`, as which of the two Word follows hasn't been checked. Other paragraphs
 * are undefined.
 */
export const headingLevels = (context: IContext): ((paragraph: Element) => number | "unclear" | undefined) => {
    const styles = stylesOf(context);
    return (paragraph) => {
        const properties = childOf(paragraph, "w:pPr");
        const styleId = attributeOf(childOf(properties, "w:pStyle"), "w:val") as string | undefined;
        const heading = headingLevelOf(styleId, styles);
        const outlineLevel = outlineLevelOf(
            { styleId, outlineLevel: numberAttributeOf(childOf(properties, "w:outlineLvl"), "w:val") },
            styles,
        );
        // Outline level 9 is body text
        const outline = outlineLevel === undefined || outlineLevel >= 9 ? undefined : outlineLevel + 1;
        if (heading !== undefined && (outline === undefined || outline === heading)) {
            return heading;
        }
        return outline === undefined ? undefined : "unclear";
    };
};

/** A paragraph's outline level, from 0: its own, or else its style's */
const outlineLevelOf = (
    paragraph: Pick<ParagraphDetails, "styleId" | "outlineLevel">,
    styles: ReadonlyMap<string, StyleDetails>,
): number | undefined => paragraph.outlineLevel ?? styleOutlineLevelOf(paragraph.styleId, styles);

/** The level a table of contents gives a paragraph, or undefined when it doesn't include it */
const levelIn = (
    properties: ITableOfContentsOptions,
    paragraph: ParagraphDetails,
    styles: ReadonlyMap<string, StyleDetails>,
): number | undefined => {
    const { entriesFromBookmark, headingStyleRange, stylesWithLevels = [], useAppliedParagraphOutlineLevel } = properties;
    if (paragraph.text.trim() === "" || (entriesFromBookmark && !paragraph.bookmarks.has(entriesFromBookmark))) {
        return undefined;
    }

    // \t: the styles listed, by name or id
    const names = [paragraph.styleId, paragraph.styleId === undefined ? undefined : styles.get(paragraph.styleId)?.name]
        .filter((name) => name !== undefined)
        .map((name) => name.toLowerCase());
    const listed = stylesWithLevels.find((style) => names.includes(style.styleName.toLowerCase()));
    if (listed) {
        return listed.level;
    }

    // \o: the built-in heading styles. With no switch that says where the entries come from, Word takes Heading 1 to 9
    const namesItsEntries =
        Boolean(headingStyleRange) ||
        stylesWithLevels.length > 0 ||
        Boolean(useAppliedParagraphOutlineLevel) ||
        Boolean(properties.tcFieldIdentifier) ||
        Boolean(properties.tcFieldLevelRange) ||
        Boolean(properties.captionLabel) ||
        Boolean(properties.captionLabelIncludingNumbers);
    const headingRange: Range | undefined = headingStyleRange ? parseRange(headingStyleRange) : namesItsEntries ? undefined : [1, 9];
    const heading = headingLevelOf(paragraph.styleId, styles);
    if (headingRange && heading !== undefined && isWithin(heading, headingRange)) {
        return heading;
    }

    // \u: the paragraphs' outline levels, in the range of \o when it has one
    const outlineLevel = useAppliedParagraphOutlineLevel ? outlineLevelOf(paragraph, styles) : undefined;
    return outlineLevel !== undefined && isWithin(outlineLevel + 1, headingRange ?? [1, 9]) ? outlineLevel + 1 : undefined;
};

/** The runs of an entry's title. Tabs and line breaks are kept only when the table of contents keeps them (\w and \x) */
const titleRunsOf = (title: string, properties: ITableOfContentsOptions): readonly TextRun[] => {
    const text = properties.preserveTabInEntries ? title : title.replace(/\t/g, " ");
    const lines = properties.preserveNewLineInEntries ? text.split("\n") : [text.replace(/\n/g, " ")];
    return lines.map(
        (line, index) =>
            new TextRun({
                break: index > 0 ? 1 : undefined,
                children: line
                    .split("\t")
                    .flatMap((part, partIndex) => [...(partIndex > 0 ? [new Tab()] : []), ...(part === "" ? [] : [part])]),
            }),
    );
};

/**
 * The paragraph style of the entries at a level: the built-in TOC style, found by its name, "toc 1" to "toc 9". When
 * the document doesn't have it, the entries are indented as Word's are, 220 twips a level.
 */
const entryStyleOf = (level: number, styles: ReadonlyMap<string, StyleDetails>): { readonly id: string; readonly indent?: number } => {
    const named = [...styles].find(([, style]) => style.name?.toLowerCase() === `toc ${level}`)?.[0];
    const id = named ?? `TOC${level}`;
    return named !== undefined || styles.has(id) || level === 1 ? { id } : { id, indent: (level - 1) * 220 };
};

/** The formatted content of a table of contents with its entries */
const contentOf = (
    { properties, beginDirty, textWidth }: HeadingEntriesOptions,
    entries: readonly Entry[],
    styles: ReadonlyMap<string, StyleDetails>,
    context: IContext,
): IXmlableObject | undefined => {
    // \n: the levels without page numbers. Word leaves them out of every level when the range isn't one it can read
    const withoutPageNumbers = properties.pageNumbersEntryLevelsRange
        ? (parseRange(properties.pageNumbersEntryLevelsRange) ?? [1, 9])
        : undefined;
    const content = new StructuredDocumentTagContent();

    entries.forEach((entry, index) => {
        const hasPageNumber = withoutPageNumbers === undefined || !isWithin(entry.level, withoutPageNumbers);
        const children: readonly ParagraphChild[] = [
            ...titleRunsOf(entry.title, properties),
            ...(hasPageNumber
                ? [
                      // \p: what separates the title from the page number, instead of a tab
                      new TextRun({ children: [properties.entryAndPageNumberSeparator || new Tab()] }),
                      new PageReference(entry.bookmark, { hyperlink: properties.hyperlink }),
                  ]
                : []),
        ];
        const style = entryStyleOf(entry.level, styles);
        content.addChildElement(
            new Paragraph({
                style: style.id,
                indent: style.indent === undefined ? undefined : { left: style.indent },
                tabStops: [{ type: "right", position: textWidth, leader: "dot" }],
                children: [
                    ...(index === 0
                        ? [
                              new Run({
                                  children: [beginOf(beginDirty), new FieldInstruction(properties), createSeparate()],
                              }),
                          ]
                        : []),
                    ...(properties.hyperlink ? [new InternalHyperlink({ anchor: entry.bookmark, children })] : children),
                ],
            }),
        );
    });
    // As Word writes it, the field ends in a paragraph of its own after the entries
    content.addChildElement(new Paragraph({ children: [new Run({ children: [createEnd()] })] }));

    return content.prepForXml(context);
};

/** Puts a bookmark around the content of a formatted paragraph */
const bookmark = (paragraph: Element, name: string, id: number, context: IContext): void => {
    const children = childrenOf(paragraph);
    const start = children.findIndex((child) => nameOf(child) === "w:pPr") + 1;
    // eslint-disable-next-line functional/immutable-data
    paragraph["w:p"] = [
        ...children.slice(0, start),
        new BookmarkStart(name, id).prepForXml(context),
        ...children.slice(start),
        new BookmarkEnd(id).prepForXml(context),
    ];
};

/**
 * Fills in the tables of contents in a formatted body from its headings, and bookmarks the headings they list. A
 * table of contents that doesn't list any heading is left empty, for Word to fill in.
 */
export const fillTablesOfContents = (body: IXmlableObject, context: IContext, bookmarkIds: HeadingBookmarkIds): void => {
    const blocks = blocksOf(childrenOf(body));
    const tables = blocks.flatMap((block) => {
        const options = writtenTables.get(block);
        return options ? [[block, options] as const] : [];
    });
    if (tables.length === 0) {
        return;
    }

    const styles = stylesOf(context);
    const followBookmarks = tables.some(([, { properties }]) => Boolean(properties.entriesFromBookmark));
    const paragraphs = paragraphDetailsOf(
        blocks.filter((block) => nameOf(block) === "w:p"),
        followBookmarks,
    );

    // A heading is bookmarked once, however many tables of contents list it
    const headings = paragraphs
        .map((paragraph) => ({ paragraph, levels: tables.map(([, { properties }]) => levelIn(properties, paragraph, styles)) }))
        .filter(({ levels }) => levels.some((level) => level !== undefined))
        .map((heading, index) => ({ ...heading, id: bookmarkIds.get(index) }));
    for (const { paragraph, id } of headings) {
        bookmark(paragraph.element, `_Toc${id}`, id, context);
    }

    tables.forEach(([table, options], index) => {
        const entries = headings.flatMap(({ paragraph, levels, id }) => {
            const level = levels[index];
            return level === undefined ? [] : [{ title: paragraph.text, level, bookmark: `_Toc${id}` }];
        });
        if (entries.length === 0) {
            return;
        }
        const children = childrenOf(table);
        // eslint-disable-next-line functional/immutable-data
        table["w:sdt"] = children.map((child) => (nameOf(child) === "w:sdtContent" ? contentOf(options, entries, styles, context) : child));
    });
};
