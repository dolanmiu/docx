/**
 * Estimates the page numbers of a document's bookmarks when it is written, or of a template's once `patchDocument` has
 * patched it, by laying out its pages as Word does.
 *
 * @module
 */
import type {
    EstimatedPageNumbers,
    IContext,
    IXmlableObject,
    PageNumberEstimator,
    PatchedTemplate,
    TemplatePageNumberEstimator,
} from "docx";

import { DEFAULT_MEASURER, type TextMeasurer } from "../text-layout";
import { type MeasureWidth, measurerOf } from "./measure-width";
import { paginate } from "./paginate";
import { type DocumentContent, readDocument } from "./read-document";
import { readDocx } from "./read-docx";

// How many times the pages are laid out again with the page numbers of the pass before, which can change how the
// lines of a table of contents wrap
const PASSES = 3;

/** An estimate each pass works out, with the number of pages of each section */
type Pass = EstimatedPageNumbers & { readonly sectionPageCounts: readonly (number | undefined)[] };

const sameNumbers = (one: Pass, other: Pass): boolean =>
    one.bookmarks.size === other.bookmarks.size &&
    [...one.bookmarks].every(([name, page]) => other.bookmarks.get(name) === page) &&
    one.pageCount === other.pageCount &&
    one.sectionPageCounts.length === other.sectionPageCounts.length &&
    one.sectionPageCounts.every((count, index) => other.sectionPageCounts[index] === count);

/** What a document is read into: a template patchDocument patched, or the body of a document being written */
const contentOf = (document: IXmlableObject | PatchedTemplate, context?: IContext): DocumentContent | undefined =>
    "parts" in document ? readDocx(document.parts) : context?.file && readDocument(document, context);

/** Lays out the pages until their page numbers stop changing, with a measurer */
const estimateWith = (content: DocumentContent | undefined, measurer: TextMeasurer): EstimatedPageNumbers => {
    if (!content) {
        return { bookmarks: new Map() };
    }
    const layOut = (before: Pass, pass: number): Pass => {
        const { bookmarks, pageCount, sectionPageCounts, stoppedAt } = paginate(content, {
            measurer,
            pageNumbers: before.bookmarks,
            pageCount: before.pageCount,
            sectionPageCounts: before.sectionPageCounts,
        });
        // The number of pages is known only when all of the document was laid out
        const estimate = { bookmarks, sectionPageCounts, ...(stoppedAt === undefined ? { pageCount } : {}) };
        return pass >= PASSES || sameNumbers(estimate, before) ? estimate : layOut(estimate, pass + 1);
    };
    return layOut({ bookmarks: new Map(), sectionPageCounts: [] }, 1);
};

/**
 * Works out the page each bookmark of a document starts on, and how many pages the document and each of its sections
 * have, by laying out its pages as Word does, so the page numbers of its tables of contents and page references, and its
 * numbers of pages, are written with it. Give it to a document as its `pageNumbers`, or to `patchDocument` as its
 * `pageNumbers` to write a template's once it is patched:
 *
 * ```ts
 * new Document({ pageNumbers: estimatePageNumbers, sections: [...] });
 * await patchDocument({ outputType: "nodebuffer", data, patches, pageNumbers: estimatePageNumbers });
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
 * Word to fill in when it updates the fields. A document in compatibility mode, which Word lays out as an older version
 * of Word did, isn't laid out at all.
 *
 * Page references and tables of contents are written clean, so Word shows the numbers as they are written, and the
 * page numbers it left blank stay blank, without asking to update the fields, unless the document has `updateFields`
 * on.
 *
 * @publicApi
 */
export const estimatePageNumbers: PageNumberEstimator & TemplatePageNumberEstimator = (
    document: IXmlableObject | PatchedTemplate,
    context?: IContext,
): EstimatedPageNumbers => estimateWith(contentOf(document, context), DEFAULT_MEASURER);

/**
 * How {@link estimatePageNumbersWith} lays out the pages.
 *
 * @publicApi
 */
export type EstimatePageNumbersOptions = {
    /**
     * Measures how wide text is, such as {@link measureWithPretext}, which measures it with the fonts a browser has.
     * Default is the widths of the fonts Word documents use most, which {@link estimatePageNumbers} uses. Lines still
     * break, and tabs move to their stops, as Word lays them out, and lines are as tall as Word makes them.
     */
    readonly measureWidth?: MeasureWidth;
};

/**
 * Works out the page each bookmark of a document starts on, as {@link estimatePageNumbers} does, measuring text as the
 * options say. Give what it returns to a document as its `pageNumbers`, or to `patchDocument` as its `pageNumbers`:
 *
 * ```ts
 * new Document({ pageNumbers: estimatePageNumbersWith({ measureWidth: measureWithPretext(pretext) }), sections: [...] });
 * ```
 *
 * @publicApi
 */
export const estimatePageNumbersWith = ({
    measureWidth,
}: EstimatePageNumbersOptions): PageNumberEstimator & TemplatePageNumberEstimator => {
    // One measurer for every document, so the lines laid out for one are kept for the passes after
    const measurer = measureWidth ? measurerOf(measureWidth) : DEFAULT_MEASURER;
    return (document: IXmlableObject | PatchedTemplate, context?: IContext) => estimateWith(contentOf(document, context), measurer);
};
