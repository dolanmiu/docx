// cspell:ignore Aptos
/**
 * The list numbers of the paragraphs bookmarks start, which `docx` starts the entries of a table of contents filled in
 * from the headings with, as Word writes them.
 *
 * @module
 */
import type { BookmarkListNumber, IContext, IXmlableObject } from "docx";

import { DEFAULT_MEASURER } from "../text-layout";
import { type Block, readDocument } from "./read-document";

/**
 * The font Word measures a list number in for the tab stop after it in a table of contents' entry: its Normal template's,
 * Aptos 12 pt, whatever the document's font and size (`scripts/layout-probes/word-toc-numbers.ts` TN1, TN4)
 */
const NUMBER_FONT = { font: "Aptos", size: 12 } as const;

/** The list number of each bookmark that starts in a numbered paragraph of the blocks, and of the tables in them */
const numbersIn = (blocks: readonly Block[]): readonly (readonly [string, BookmarkListNumber])[] =>
    blocks.flatMap((block) => {
        if (block.type === "table") {
            return block.rows.flatMap((row) => row.cells.flatMap((cell) => numbersIn(cell.blocks)));
        }
        const { listNumber } = block;
        if (!listNumber) {
            return [];
        }
        // In twips, as tab stops are
        const width = DEFAULT_MEASURER.measureWidth(listNumber.text, NUMBER_FONT) * 20;
        return block.items.flatMap((item) => (item.type === "marker" ? [[item.name, { ...listNumber, width }] as const] : []));
    });

/**
 * Works out the list numbers of the paragraphs bookmarks start in a document's body, by the bookmarks' names, as its
 * lists number them. Only those written as Word writes them are given.
 */
export const listNumbersOf = (body: IXmlableObject, context: IContext): ReadonlyMap<string, BookmarkListNumber> =>
    new Map(context.file ? numbersIn(readDocument(body, context).blocks.map(({ block }) => block)) : []);
