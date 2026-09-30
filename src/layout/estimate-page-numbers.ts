/**
 * Estimates the page numbers of a document's bookmarks when it is written, by laying out its pages as Word does.
 *
 * @module
 */
import type { EstimatedPageNumbers, IContext, IXmlableObject } from "docx";

import { paginate } from "./paginate";
import { readDocument } from "./read-document";

// How many times the pages are laid out again with the page numbers of the pass before, which can change how the
// lines of a table of contents wrap
const PASSES = 3;

const sameNumbers = (one: ReadonlyMap<string, string>, other: ReadonlyMap<string, string>): boolean =>
    one.size === other.size && [...one].every(([name, page]) => other.get(name) === page);

/**
 * Works out the page each bookmark of a document starts on, by laying out its pages as Word does, so the page numbers
 * of its tables of contents and page references are written with it. Give it to a document as its `pageNumbers`:
 *
 * ```ts
 * new Document({ pageNumbers: estimatePageNumbers, sections: [...] });
 * ```
 *
 * The pages are laid out with the widths and heights of the fonts Word documents use most, such as Calibri, Cambria,
 * Arial and Times New Roman. It follows paragraphs' spacing, indents, line spacing, tab stops and keep settings, widow
 * and orphan control, lists, pictures in the line, tables, whose rows break across pages, page and section breaks, and
 * each section's page size, margins, headers, footers and page numbering.
 *
 * It stops at the first thing it can't lay out yet: a drawing that text flows around, a text box or frame, an equation,
 * a footnote, columns, or a table row kept whole that is taller than a page. The page references to bookmarks after it are left blank, for
 * Word to fill in when it updates the fields.
 *
 * @publicApi
 */
export const estimatePageNumbers = (body: IXmlableObject, context: IContext): EstimatedPageNumbers => {
    if (!context.file) {
        return { bookmarks: new Map() };
    }
    const content = readDocument(body, context);
    const layOut = (pages: ReadonlyMap<string, string>, pass: number): ReadonlyMap<string, string> => {
        const { bookmarks } = paginate(content, { pageNumbers: pages });
        return pass >= PASSES || sameNumbers(bookmarks, pages) ? bookmarks : layOut(bookmarks, pass + 1);
    };
    return { bookmarks: layOut(new Map(), 1) };
};
