/**
 * VML shape types in content inserted into an existing part.
 *
 * @module
 */
import type { XmlElement as Element } from "@util/xml";

/**
 * Leaves out of content that is about to be inserted into a part the VML shape types the part has already.
 */
export type RemoveShapeTypes = (elements: readonly Element[]) => readonly Element[];

const shapeTypeIdOf = (element: Element): string | undefined =>
    element.name === "v:shapetype" && element.attributes?.id !== undefined ? String(element.attributes.id) : undefined;

/**
 * Finds the id of every VML shape type (`v:shapetype`) in an element, at any depth.
 *
 * @param element - The element to search, such as a part's root
 * @returns The ids, once for each shape type
 */
export const findShapeTypeIds = (element: Element): readonly string[] => {
    const id = shapeTypeIdOf(element);
    return [...(id === undefined ? [] : [id]), ...(element.elements ?? []).flatMap(findShapeTypeIds)];
};

/**
 * Creates a function that leaves out of the content inserted into a part each VML shape type (`v:shapetype`) the part
 * has already, such as the picture frame (`_x0000_t75`) an embedded file or a picture watermark is drawn in. Content is
 * written with the shape types its shapes use, without knowing which the template has, but a part can't have two
 * elements with the same id. The shapes inserted use the part's own, which Word and LibreOffice find anywhere in the
 * part, as Word writes each shape type once in a part, in its first shape.
 *
 * A shape type with the id of one the part has is the same shape type: docx writes Office's preset ones, whose ids, such
 * as `_x0000_t75` for preset 75, name the preset.
 *
 * @param part - The root of the part the content is inserted into
 * @returns A function that returns the elements without the shape types the part has, including those inserted before
 */
export const removeShapeTypesIn = (part: Element): RemoveShapeTypes => {
    const idsInPart = new Set(findShapeTypeIds(part));

    const remove = (element: Element): readonly Element[] => {
        const id = shapeTypeIdOf(element);
        if (id !== undefined) {
            if (idsInPart.has(id)) {
                return [];
            }
            // eslint-disable-next-line functional/immutable-data
            idsInPart.add(id);
            return [element];
        }
        return [element.elements === undefined ? element : { ...element, elements: element.elements.flatMap(remove) }];
    };

    return (elements) => elements.flatMap(remove);
};
