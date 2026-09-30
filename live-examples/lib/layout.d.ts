import type { EstimatedPageNumbers } from 'docx';
import type { IContext } from 'docx';
import type { IXmlableObject } from 'docx';

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
 * and orphan control, lists, pictures in the line, tables, page and section breaks, and each section's page size,
 * margins, headers, footers and page numbering.
 *
 * It stops at the first thing it can't lay out yet: a drawing that text flows around, a text box or frame, an equation,
 * a footnote, columns, or a table row taller than a page. The page references to bookmarks after it are left blank, for
 * Word to fill in when it updates the fields.
 *
 * @publicApi
 */
export declare const estimatePageNumbers: (body: IXmlableObject, context: IContext) => EstimatedPageNumbers;

export { }
