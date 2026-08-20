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
 * Ids a caller chose explicitly are reserved through {@link reserve}, so an
 * allocated id never lands on one of them.
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
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly used: Set<number>;

    public constructor() {
        this.ids = new Map<string, number>();
        this.used = new Set<number>();
    }

    /**
     * Records an id so it is never allocated to another bookmark.
     *
     * Callers that pass their own id are responsible for it being unique: an id
     * reserved after the same number was already allocated stays as given.
     */
    public reserve(id: number): void {
        // eslint-disable-next-line functional/immutable-data
        this.used.add(id);
    }

    /**
     * Returns the id for a bookmark name, allocating the lowest free one on first use.
     *
     * @returns The id shared by that bookmark's start and end markers
     */
    public getId(name: string): number {
        const existing = this.ids.get(name);

        if (existing !== undefined) {
            return existing;
        }

        let id = 1;

        while (this.used.has(id)) {
            id++;
        }

        // eslint-disable-next-line functional/immutable-data
        this.ids.set(name, id);
        this.reserve(id);

        return id;
    }
}
