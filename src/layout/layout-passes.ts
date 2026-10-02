/**
 * Lays out a document's pages as many times as the page numbers it works out change how its lines wrap, such as those of
 * a table of contents.
 *
 * @module
 */
import type { TextMeasurer } from "../text-layout";
import { type PagePlace, type Pagination, paginate } from "./paginate";
import type { DocumentContent } from "./read-document";

// How many times the pages are laid out again with the page numbers of the pass before, which can change how the
// lines of a table of contents wrap, or of a line with a page number in it
const PASSES = 3;

/** The number of pages, which is known only when all of the document was laid out */
export const knownPageCount = ({ pageCount, stoppedAt }: Pagination): number | undefined =>
    stoppedAt === undefined ? pageCount : undefined;

/** The bookmarks and fields a pass placed, with the page each is on and how the page shows its number */
const placesOf = ({ places }: Pagination): string =>
    [...places]
        .map(([name, { page, text }]) => JSON.stringify([name, page, text]))
        .sort()
        .join("\n");

const sameNumbers = (one: Pagination, other: Pagination): boolean =>
    placesOf(one) === placesOf(other) &&
    knownPageCount(one) === knownPageCount(other) &&
    one.sectionPageCounts.length === other.sectionPageCounts.length &&
    one.sectionPageCounts.every((count, index) => other.sectionPageCounts[index] === count);

/**
 * Lays out a document's pages, again with the page numbers each pass works out, until they stop changing, and gives the
 * last. Each pass is laid out with the numbers of the pass before, so the last pass's numbers are those it was laid out
 * with only when they stop changing. When they still change after three passes, as when a table of contents wraps one
 * way with a number and the other way without it, none can be written, so it gives the first pass, laid out without them,
 * as not settled.
 */
export const layOutPasses = (content: DocumentContent, measurer?: TextMeasurer): Pagination & { readonly settled: boolean } => {
    const layOut = (
        before: Pagination | undefined,
        pass: number,
        first: Pagination | undefined,
        earlierPlaces: ReadonlyMap<string, PagePlace>,
    ): Pagination & { readonly settled: boolean } => {
        const pagination = paginate(content, {
            measurer,
            pageNumbers: before?.bookmarks,
            places: before?.places,
            earlierPlaces,
            pageCount: before && knownPageCount(before),
            sectionPageCounts: before?.sectionPageCounts,
        });
        if (before !== undefined && sameNumbers(pagination, before)) {
            return { ...pagination, settled: true };
        }
        return pass >= PASSES
            ? { ...first!, settled: false }
            : layOut(pagination, pass + 1, first ?? pagination, new Map([...earlierPlaces, ...pagination.places]));
    };
    return layOut(undefined, 1, undefined, new Map());
};
