/**
 * Drawing ids for content inserted into an existing document.
 *
 * @module
 */
import type { XmlElement as Element } from "@util/xml";

/**
 * Renumbers the drawings in content that is about to be inserted into a document.
 */
export type RenumberDrawings = (elements: readonly Element[]) => readonly Element[];

// The drawings, which each have their own ids, and those of the shapes in them, such as in a group
const DRAWINGS = new Set(["wp:inline", "wp:anchor"]);
// The elements whose id must be unique in a document: a drawing's, and those of the shapes, pictures and groups in a
// group or canvas. They share one set of ids, as they do in a Document
const ID_ELEMENTS = new Set(["wp:docPr", "wps:cNvPr", "wpg:cNvPr", "pic:cNvPr"]);
// The elements that refer to a shape in the same drawing by its id: the shapes a connector joins
const REFERENCE_ELEMENTS = new Set(["a:stCxn", "a:endCxn"]);

const idOf = (element: Element, names: ReadonlySet<string>): number | undefined => {
    if (!names.has(element.name ?? "")) {
        return undefined;
    }
    const id = Number(element.attributes?.id);
    // A picture's own pic:cNvPr has id 0, as Word writes it. Only its drawing's id needs to be unique
    return Number.isInteger(id) && !(element.name === "pic:cNvPr" && id === 0) ? id : undefined;
};

/**
 * Finds the id of every drawing in an element, at any depth, and of the shapes in them, such as in a group.
 *
 * @param element - The element to search, such as a part's root
 * @returns The ids, once for each element that has one
 */
export const findDrawingIds = (element: Element): readonly number[] => {
    const id = idOf(element, ID_ELEMENTS);
    return [...(id === undefined ? [] : [id]), ...(element.elements ?? []).flatMap(findDrawingIds)];
};

// The ids of a drawing and its shapes, without those of the drawings in its text boxes, which have ids of their own
const ownIdsOf = (drawing: Element): readonly number[] => {
    const idsIn = (element: Element): readonly number[] => {
        const id = idOf(element, ID_ELEMENTS);
        return [
            ...(id === undefined ? [] : [id]),
            ...(element.elements ?? []).flatMap((child) => (DRAWINGS.has(child.name ?? "") ? [] : idsIn(child))),
        ];
    };
    return idsIn(drawing);
};

/**
 * Creates a function that renumbers the drawings in content being inserted, so none has an id another drawing in the
 * document has. Word finds a document whose drawings share an id unreadable, even when they are in different parts,
 * such as a header and the body. A drawing's id is chosen when it is created, without knowing which ids the template
 * has, and content inserted more than once would have the same ids each time.
 *
 * Each drawing gets the ids after the highest one the document has, in the order the drawings are inserted, so the
 * ids don't depend on the drawings created before the patch. The connectors in a drawing still join the shapes they
 * did.
 *
 * @param idsInDocument - The ids of the drawings already in the document, and of the shapes in them
 * @returns A function that returns the elements with their drawings renumbered
 */
export const renumberDrawingsAvoiding = (idsInDocument: readonly number[]): RenumberDrawings => {
    // Always the highest id in use, so the one after it is free
    let highestId = idsInDocument.reduce((highest, id) => Math.max(highest, id), 0);

    const renumberDrawing = (drawing: Element): Element => {
        // A connector may come before the shapes it joins, so each id's new one is chosen before anything is renumbered
        const newIds = new Map([...new Set(ownIdsOf(drawing))].map((id) => [id, ++highestId]));

        const renumberIn = (element: Element): Element => {
            if (element !== drawing && DRAWINGS.has(element.name ?? "")) {
                return renumberDrawing(element);
            }
            const id = idOf(element, ID_ELEMENTS) ?? idOf(element, REFERENCE_ELEMENTS);
            const newId = id === undefined ? undefined : newIds.get(id);
            return {
                ...element,
                ...(newId === undefined ? {} : { attributes: { ...element.attributes, id: String(newId) } }),
                ...(element.elements === undefined ? {} : { elements: element.elements.map(renumberIn) }),
            };
        };

        return renumberIn(drawing);
    };

    const renumber = (element: Element): Element =>
        DRAWINGS.has(element.name ?? "")
            ? renumberDrawing(element)
            : { ...element, ...(element.elements === undefined ? {} : { elements: element.elements.map(renumber) }) };

    return (elements) => elements.map(renumber);
};
