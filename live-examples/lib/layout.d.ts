import type { EstimatedPageNumbers } from 'docx';
import type { IContext } from 'docx';
import type { IXmlableObject } from 'docx';

/**
 * Works out the page each bookmark of a document starts on, and how many pages the document and each of its sections
 * have, by laying out its pages as Word does, so the page numbers of its tables of contents and page references, and its
 * numbers of pages, are written with it. Give it to a document as its `pageNumbers`:
 *
 * ```ts
 * new Document({ pageNumbers: estimatePageNumbers, sections: [...] });
 * ```
 *
 * The pages are laid out with the widths and heights of the fonts Word documents use most, such as Calibri, Cambria,
 * Arial and Times New Roman. It follows paragraphs' spacing, indents, line spacing, tab stops and keep settings, widow
 * and orphan control, lists, pictures in the line, tables, whose rows break across pages, footnotes and endnotes, page,
 * column and section breaks, and each section's page size, margins, columns, headers, footers and page numbering.
 *
 * It stops at the first thing it can't lay out yet: a drawing that text flows around, a text box or frame, an equation,
 * a footnote that continues on the next page, columns evened out before a continuous section break, or a table row kept
 * whole that is taller than a page. The page references to bookmarks after it are left blank, for
 * Word to fill in when it updates the fields.
 *
 * @publicApi
 */
export declare const estimatePageNumbers: (body: IXmlableObject, context: IContext) => EstimatedPageNumbers;

export { }
