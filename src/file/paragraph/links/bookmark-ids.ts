/**
 * Per-document numeric id allocation for bookmarks.
 *
 * @module
 */

/**
 * Allocates the numeric ids written to `w:bookmarkStart` and `w:bookmarkEnd`.
 *
 * Ids must be unique within a document, and a bookmark's start and end must
 * share one. Both markers look up their bookmark name here, so whichever is
 * serialized first allocates and the other reuses.
 *
 * @example
 * ```typescript
 * const ids = new BookmarkIds();
 * ids.getId("intro"); // 1
 * ids.getId("summary"); // 2
 * ids.getId("intro"); // 1
 * ```
 */
export class BookmarkIds {
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly ids: Map<string, number>;

    public constructor() {
        this.ids = new Map<string, number>();
    }

    /**
     * Returns the id for a bookmark name, allocating one on first use.
     *
     * @returns The id shared by that bookmark's start and end markers
     */
    public getId(name: string): number {
        const existing = this.ids.get(name);

        if (existing !== undefined) {
            return existing;
        }

        const id = this.ids.size + 1;
        // eslint-disable-next-line functional/immutable-data
        this.ids.set(name, id);

        return id;
    }
}
