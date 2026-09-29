/**
 * Bookmark ids for content inserted into an existing document.
 *
 * @module
 */
import type { Element } from "xml-js";

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
 * A bookmark keeps its id if nothing in the document uses it yet, and otherwise gets the next unused one. An id is
 * renumbered the same way each time, so a bookmark's start and end still share one, even in separate patches.
 *
 * @param idsInDocument - The ids of the bookmarks already in the document
 * @returns A function that returns the elements with their bookmarks renumbered
 */
export const renumberBookmarksAvoiding = (idsInDocument: readonly number[]): RenumberBookmarks => {
    const usedIds = new Set(idsInDocument);
    const newIds = new Map<number, number>();
    // Always the highest id in use, so the one after it is free
    let highestId = idsInDocument.reduce((highest, id) => Math.max(highest, id), 0);

    const newIdFor = (id: number): number => {
        const knownId = newIds.get(id);
        if (knownId !== undefined) {
            return knownId;
        }

        const newId = usedIds.has(id) ? highestId + 1 : id;
        highestId = Math.max(highestId, newId);
        // eslint-disable-next-line functional/immutable-data
        usedIds.add(newId);
        // eslint-disable-next-line functional/immutable-data
        newIds.set(id, newId);
        return newId;
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
