/**
 * Lays out a document's pages as many times as the page numbers it works out change how its lines wrap, such as those of
 * a table of contents.
 *
 * @module
 */
import type { TextMeasurer } from "../text-layout";
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
 * Lays out a document's pages, again with the page numbers each pass works out, until they stop changing, or for at most
 * three passes, and gives the last.
 */
export const layOutPasses = (content: DocumentContent, measurer?: TextMeasurer): Pagination => {
    const layOut = (before: Pagination | undefined, pass: number): Pagination => {
        const pagination = paginate(content, {
            measurer,
            pageNumbers: before?.bookmarks,
            pageCount: before && knownPageCount(before),
            sectionPageCounts: before?.sectionPageCounts,
        });
        return pass >= PASSES || (before !== undefined && sameNumbers(pagination, before)) ? pagination : layOut(pagination, pass + 1);
    };
    return layOut(undefined, 1);
};
