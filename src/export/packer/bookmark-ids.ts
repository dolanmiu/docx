/**
 * Numbers the bookmarks of a document as it is packed.
 *
 * @module
 */

// A bookmark's start and end, which share its id
const TAG = /<(w:bookmarkStart|w:bookmarkEnd)(?=[\s/>])[^>]*>/g;
const ID = /(\sw:id=")(-?\d+)(")/;

/**
 * Creates a function that numbers the bookmarks in the parts of a document from 1, in the order they start.
 *
 * Each bookmark is given an id when it is created, from one counter for the whole process, so no two bookmarks share
 * one. Written as they are, the ids of a document would depend on the bookmarks created before it. Word only needs the
 * ids to be unique in the document, and a bookmark's start and end to share one, so the parts of a document are
 * numbered by the same function, one after the other.
 *
 * A bookmark's end gets the id of the last start with its id that hasn't ended, so a bookmark written twice is two
 * bookmarks. An end without such a start gets an id of its own, so it can't end another bookmark.
 *
 * @returns A function that returns a part's XML with its bookmarks numbered after those of the parts before it
 */
export const createBookmarkNumbering = (): ((xml: string) => string) => {
    let lastId = 0;
    // The new ids of the bookmarks that have started and not yet ended, by their old ids
    const open = new Map<number, readonly number[]>();

    return (xml) =>
        xml.replace(TAG, (tag: string, name: string) => {
            const match = ID.exec(tag);
            if (!match) {
                return tag;
            }
            const id = Number(match[2]);
            const started = open.get(id) ?? [];
            if (name === "w:bookmarkEnd" && started.length > 0) {
                // eslint-disable-next-line functional/immutable-data
                open.set(id, started.slice(0, -1));
                return tag.replace(ID, `$1${started[started.length - 1]}$3`);
            }
            lastId++;
            if (name === "w:bookmarkStart") {
                // eslint-disable-next-line functional/immutable-data
                open.set(id, [...started, lastId]);
            }
            return tag.replace(ID, `$1${lastId}$3`);
        });
};
