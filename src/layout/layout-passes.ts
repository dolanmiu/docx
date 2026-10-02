/**
 * Lays out a document's pages as many times as the page numbers it works out change how its lines wrap, such as those of
 * a table of contents.
 *
 * @module
 */
import { DEFAULT_MEASURER, type TextMeasurer, createFontFileMeasurer } from "../text-layout";
import { type Pagination, paginate } from "./paginate";
import type { DocumentContent } from "./read-document";

// How many times the pages are laid out again with the page numbers of the pass before, which can change how the
// lines of a table of contents wrap
const PASSES = 3;

/** The number of pages, which is known only when all of the document was laid out */
export const knownPageCount = ({ pageCount, stoppedAt }: Pagination): number | undefined =>
    stoppedAt === undefined ? pageCount : undefined;

const sameNumbers = (one: Pagination, other: Pagination): boolean =>
    one.bookmarks.size === other.bookmarks.size &&
    [...one.bookmarks].every(([name, page]) => other.bookmarks.get(name) === page) &&
    knownPageCount(one) === knownPageCount(other) &&
    one.sectionPageCounts.length === other.sectionPageCounts.length &&
    one.sectionPageCounts.every((count, index) => other.sectionPageCounts[index] === count);

/**
 * Lays out a document's pages, again with the page numbers each pass works out, until they stop changing, and gives the
 * last. Each pass is laid out with the numbers of the pass before, so the last pass's numbers are those it was laid out
 * with only when they stop changing. When they still change after three passes, as when a table of contents wraps one
 * way with a number and the other way without it, none can be written, so it gives the first pass, laid out without them,
 * as not settled. Text in the fonts the document embeds is measured from their files, and the rest with `measurer`.
 */
export const layOutPasses = (
    content: DocumentContent,
    measurer: TextMeasurer = DEFAULT_MEASURER,
): Pagination & { readonly settled: boolean } => {
    // Text in the fonts the document embeds is measured from their files, as Word draws it in them
    const measuring = content.fonts === undefined ? measurer : createFontFileMeasurer(content.fonts, measurer);
    const layOut = (
        before: Pagination | undefined,
        pass: number,
        first: Pagination | undefined,
    ): Pagination & { readonly settled: boolean } => {
        const pagination = paginate(content, {
            measurer: measuring,
            pageNumbers: before?.bookmarks,
            pageCount: before && knownPageCount(before),
            sectionPageCounts: before?.sectionPageCounts,
        });
        if (before !== undefined && sameNumbers(pagination, before)) {
            return { ...pagination, settled: true };
        }
        return pass >= PASSES ? { ...first!, settled: false } : layOut(pagination, pass + 1, first ?? pagination);
    };
    return layOut(undefined, 1, undefined);
};
