/**
 * Bookmark ids for content inserted into an existing document.
 *
 * @module
 */
import type { XmlElement as Element } from "@util/xml";

/**
 * Renumbers the bookmarks in content that is about to be inserted into a document.
 */
export type RenumberBookmarks = (elements: readonly Element[]) => readonly Element[];

const bookmarkIdOf = (element: Element): number | undefined => {
    if (element.name !== "w:bookmarkStart" && element.name !== "w:bookmarkEnd") {
        return undefined;
    }
    const id = Number(element.attributes?.["w:id"]);
    return Number.isInteger(id) ? id : undefined;
};

/**
 * Finds the id of every bookmark in an element, at any depth.
 *
 * @param element - The element to search, such as a part's root
 * @returns The ids, once for each bookmarkStart and bookmarkEnd
 */
export const findBookmarkIds = (element: Element): readonly number[] => {
    const id = bookmarkIdOf(element);
    return [...(id === undefined ? [] : [id]), ...(element.elements ?? []).flatMap(findBookmarkIds)];
};

/**
 * Creates a function that renumbers the bookmarks in content being inserted, so none takes an id the document
 * already uses. Bookmark ids must be unique within a document, but a bookmark's id is chosen when it is created,
 * without knowing which ids the template has.
 *
 * Each bookmark gets the id after the highest one the document has, in the order the bookmarks are inserted, so the
 * ids don't depend on the bookmarks created before the patch. An id is renumbered the same way each time, so a
 * bookmark's start and end still share one, even in separate patches.
 *
 * @param idsInDocument - The ids of the bookmarks already in the document
 * @returns A function that returns the elements with their bookmarks renumbered
 */
export const renumberBookmarksAvoiding = (idsInDocument: readonly number[]): RenumberBookmarks => {
    const newIds = new Map<number, number>();
    // Always the highest id in use, so the one after it is free
    let highestId = idsInDocument.reduce((highest, id) => Math.max(highest, id), 0);

    const newIdFor = (id: number): number => {
        const knownId = newIds.get(id);
        if (knownId !== undefined) {
            return knownId;
        }

        highestId++;
        // eslint-disable-next-line functional/immutable-data
        newIds.set(id, highestId);
        return highestId;
    };

    const renumber = (element: Element): Element => {
        const id = bookmarkIdOf(element);
        return {
            ...element,
            ...(id === undefined ? {} : { attributes: { ...element.attributes, "w:id": String(newIdFor(id)) } }),
            ...(element.elements === undefined ? {} : { elements: element.elements.map(renumber) }),
        };
    };

    return (elements) => elements.map(renumber);
};
