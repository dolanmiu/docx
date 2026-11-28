/**
 * The ids of runs fitted to a width on their own, for content inserted into an existing document.
 *
 * @module
 */
import type { XmlElement as Element } from "@util/xml";

/**
 * Renumbers the runs fitted to a width on their own in content that is about to be inserted into a document.
 */
export type RenumberFitText = (elements: readonly Element[]) => readonly Element[];

// The ids docx gives runs fitted on their own are negative, so they don't meet the groups people give, which count up
const fitTextIdOf = (element: Element): number | undefined => {
    if (element.name !== "w:fitText") {
        return undefined;
    }
    const id = Number(element.attributes?.["w:id"]);
    return Number.isInteger(id) && id < 0 ? id : undefined;
};

/**
 * Finds the negative id of every run fitted to a width (`w:fitText`) in an element, at any depth.
 *
 * @param element - The element to search, such as a part's root
 * @returns The ids, once for each run that has one
 */
export const findFitTextIds = (element: Element): readonly number[] => {
    const id = fitTextIdOf(element);
    return [...(id === undefined ? [] : [id]), ...(element.elements ?? []).flatMap(findFitTextIds)];
};

/**
 * Creates a function that renumbers the runs fitted to a width on their own in content being inserted. Word fits
 * runs next to each other with the same id together, but a run's id is chosen when it is created, from one counter
 * for the whole process, without knowing which ids the template has.
 *
 * Each id gets the one below the lowest the document has, in the order the runs are inserted, so the ids don't
 * depend on the runs created before the patch. An id is renumbered the same way each time, so runs that shared an id
 * still share one.
 *
 * @param idsInDocument - The negative ids of the runs fitted to a width in the document
 * @returns A function that returns the elements with their runs renumbered
 */
export const renumberFitTextAvoiding = (idsInDocument: readonly number[]): RenumberFitText => {
    const newIds = new Map<number, number>();
    // Always the lowest id in use, so the one below it is free
    let lowestId = idsInDocument.reduce((lowest, id) => Math.min(lowest, id), 0);

    const newIdFor = (id: number): number => {
        const knownId = newIds.get(id);
        if (knownId !== undefined) {
            return knownId;
        }
        lowestId--;
        // eslint-disable-next-line functional/immutable-data
        newIds.set(id, lowestId);
        return lowestId;
    };

    const renumber = (element: Element): Element => {
        const id = fitTextIdOf(element);
        return {
            ...element,
            ...(id === undefined ? {} : { attributes: { ...element.attributes, "w:id": String(newIdFor(id)) } }),
            ...(element.elements === undefined ? {} : { elements: element.elements.map(renumber) }),
        };
    };

    return (elements) => elements.map(renumber);
};
