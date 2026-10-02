/**
 * Lays out a document's pages as many times as the page numbers it works out change how its lines wrap, such as those of
 * a table of contents.
 *
 * @module
 */
import { DEFAULT_MEASURER, type TextMeasurer, createFontFileMeasurer } from "../text-layout";
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

// Why the layout's page numbers aren't Word's, when they still change after the passes it lays the pages out in
const UNSETTLED = "page numbers that move when the pages are laid out with them";

/**
 * The first page a pass placed a bookmark or field on elsewhere than the pass before did, or showing another number, or
 * its last page, when they differ only in their numbers of pages
 */
const firstMoved = (pagination: Pagination, before: Pagination): number => {
    const moved = [...pagination.places].flatMap(([name, { page, text }]) => {
        const earlier = before.places.get(name);
        return earlier?.page === page && earlier.text === text ? [] : [page];
    });
    return Math.min(pagination.pageCount, ...moved);
};

/**
 * Lays out a document's pages, again with the page numbers each pass works out, until they stop changing, and gives the
 * last. Each pass is laid out with the numbers of the pass before, so the last pass's numbers are those it was laid out
 * with only when they stop changing. When they still change after three passes, as when a table of contents wraps one
 * way with a number and the other way without it, none can be written, so it gives the first pass, laid out without them,
 * as not settled. Guessing (`guess`), it lays the pages out past what it can't lay out as Word does yet, and when the
 * numbers still change, it gives the last pass, with the guess noted on the first page they moved on. Text in the fonts
 * the document embeds is measured from their files, and the rest with `measurer`.
 */
export const layOutPasses = (
    content: DocumentContent,
    measurer: TextMeasurer = DEFAULT_MEASURER,
    guess = false,
): Pagination & { readonly settled: boolean } => {
    // Text in the fonts the document embeds is measured from their files, as Word draws it in them
    const measuring = content.fonts === undefined ? measurer : createFontFileMeasurer(content.fonts, measurer);
    const layOut = (
        before: Pagination | undefined,
        pass: number,
        first: Pagination | undefined,
        earlierPlaces: ReadonlyMap<string, PagePlace>,
    ): Pagination & { readonly settled: boolean } => {
        const pagination = paginate(content, {
            measurer: measuring,
            pageNumbers: before?.bookmarks,
            places: before?.places,
            earlierPlaces,
            pageCount: before && knownPageCount(before),
            sectionPageCounts: before?.sectionPageCounts,
            guess,
        });
        if (before !== undefined && sameNumbers(pagination, before)) {
            return { ...pagination, settled: true };
        }
        if (pass >= PASSES && guess) {
            const moved = firstMoved(pagination, before!);
            const pages = pagination.pages.map((page, index) =>
                index + 1 === moved ? { ...page, guesses: [...(page.guesses ?? []), UNSETTLED] } : page,
            );
            return { ...pagination, pages, settled: true };
        }
        return pass >= PASSES
            ? { ...first!, settled: false }
            : layOut(pagination, pass + 1, first ?? pagination, new Map([...earlierPlaces, ...pagination.places]));
    };
    return layOut(undefined, 1, undefined, new Map());
};
