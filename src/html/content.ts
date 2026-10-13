/**
 * The content docx/html reads from HTML, before it is written as docx's paragraphs and tables: blocks, the text and
 * other content of their paragraphs, and the lists and tables they are in.
 *
 * Reading the HTML gives this content, and writing it, after its spaces are collapsed and its lists numbered, gives
 * docx's components. Keeping the two apart lets each be done in order: a list's numbering, say, depends on the lists
 * before and after it, and a page break before an element goes in the paragraph after it.
 *
 * @module
 */
import type { IParagraphOptions, IRunOptions, ITableCellOptions, ITableOptions, ITableRowOptions, LevelFormat, ParagraphChild } from "docx";

import type { ComputedStyle } from "./css/computed-style";

/** A run's formatting */
export type RunFormat = Omit<IRunOptions, "text" | "children" | "break">;

/** A paragraph's formatting, other than the list it is in */
export type ParagraphFormat = Omit<IParagraphOptions, "children" | "text" | "numbering" | "bullet">;

/**
 * Where a link goes: a web address, or a bookmark in the document. A link is an object for each `<a>`, so the runs of
 * one link are written in one hyperlink, and those of links next to each other in one each.
 */
export type Link = { readonly href: string } | { readonly anchor: string };

/** A tracked change: content inserted or deleted, by an author, at a time */
export type Revision = { readonly kind: "insertion" | "deletion"; readonly author: string; readonly date: string };

/** A paragraph's content, before its spaces are collapsed */
export type Inline =
    | {
          readonly type: "text";
          readonly text: string;
          readonly format: RunFormat;
          readonly whiteSpace: ComputedStyle["whiteSpace"];
          readonly transform?: "lowercase" | "capitalize";
          readonly link?: Link;
          readonly revision?: Revision;
      }
    | { readonly type: "break"; readonly format: RunFormat; readonly link?: Link }
    /** Content that is one thing, such as an image or a checkbox, which spaces either side of aren't collapsed into */
    | { readonly type: "atom"; readonly child: ParagraphChild; readonly link?: Link }
    /** The start of an element that a link in the HTML goes to */
    | { readonly type: "bookmark"; readonly name: string };

/** A level of a list: how its items are numbered, or the bullet they have */
export type ListLevel = {
    readonly format: (typeof LevelFormat)[keyof typeof LevelFormat];
    /** The number or bullet, as Word writes it, such as `%1.` for the first level's number and a full stop */
    readonly text: string;
    readonly start: number;
};

/** An item of a list, which its paragraph is the first of */
export type ListItem = {
    /** How deep in lists the item is: 0 for an item of a list that isn't in another */
    readonly depth: number;
    readonly level: ListLevel;
    /**
     * The list the item is in: items of one list are numbered on from each other, and a list starts its numbering
     * again. An object for each list, compared by identity
     */
    readonly list: object;
};

/** A paragraph */
export type ParagraphBlock = {
    readonly type: "paragraph";
    readonly format: ParagraphFormat;
    readonly content: readonly Inline[];
    /** The list item the paragraph starts, if it is the first of one */
    readonly item?: ListItem;
};

/** A cell of a table, with what it spans */
export type CellBlock = {
    readonly options: Omit<ITableCellOptions, "children">;
    readonly content: readonly Block[];
};

/** A row of a table */
export type RowBlock = {
    readonly options: Omit<ITableRowOptions, "children">;
    readonly cells: readonly CellBlock[];
};

/** A table */
export type TableBlock = {
    readonly type: "table";
    readonly options: Omit<ITableOptions, "rows">;
    readonly rows: readonly RowBlock[];
};

/** A break between blocks, such as a page break from `break-before: page`, which goes in the block after it */
export type BreakBlock = { readonly type: "block-break"; readonly kind: "page" | "column" };

/** A block of content */
export type Block = ParagraphBlock | TableBlock | BreakBlock;

/** What reading an element or text gives: content of a paragraph, or blocks */
export type Content = Inline | Block;

/** Whether content is a block, rather than content of a paragraph */
export const isBlock = (content: Content): content is Block =>
    content.type === "paragraph" || content.type === "table" || content.type === "block-break";
