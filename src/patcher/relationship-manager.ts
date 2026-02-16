/**
 * Relationship manager for OOXML .rels file management.
 *
 * @module
 */
import { Element } from "xml-js";

import { RelationshipType, TargetModeType } from "@file/relationships/relationship/relationship";

import { getFirstLevelElements } from "./util";

/**
 * Extracts the numeric ID from a relationship ID string.
 *
 * @param relationshipId - Relationship ID in format "rId123"
 * @returns The numeric portion of the ID
 */
const getIdFromRelationshipId = (relationshipId: string): number => {
    const output = parseInt(relationshipId.substring(3), 10);
    return isNaN(output) ? 0 : output;
};

/**
 * Determines the next available relationship ID number.
 *
 * Scans all existing relationships and returns the next sequential ID number
 * to use when adding a new relationship.
 *
 * @param relationships - The relationships XML element
 * @returns The next available relationship ID number
 *
 * @example
 * ```typescript
 * const nextId = getNextRelationshipIndex(relationshipsElement);
 * // If highest existing ID is rId5, returns 6
 * ```
 */
export const getNextRelationshipIndex = (relationships: Element): number => {
    const relationshipElements = getFirstLevelElements(relationships, "Relationships");

    return (
        relationshipElements
            .map((e) => getIdFromRelationshipId(e.attributes?.Id?.toString() ?? ""))
            .reduce((acc, curr) => Math.max(acc, curr), 0) + 1
    );
};

/**
 * Appends a new relationship to a .rels file structure.
 *
 * Relationships define connections between parts of an OOXML package,
 * such as linking documents to images, hyperlinks, or other resources.
 *
 * @param relationships - The relationships XML element
 * @param id - The relationship ID (number or string)
 * @param type - The relationship type URI
 * @param target - The target path or URI
 * @param targetMode - Optional target mode (Internal or External)
 * @returns The updated relationship elements array
 *
 * @example
 * ```typescript
 * appendRelationship(
 *   relationshipsElement,
 *   6,
 *   "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
 *   "media/image1.png"
 * );
 * ```
 */
export const appendRelationship = (
    relationships: Element,
    id: number | string,
    type: RelationshipType,
    target: string,
    targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType],
): readonly Element[] => {
    const relationshipElements = getFirstLevelElements(relationships, "Relationships");
    // eslint-disable-next-line functional/immutable-data
    relationshipElements.push({
        attributes: {
            Id: `rId${id}`,
            Type: type,
            Target: target,
            TargetMode: targetMode,
        },
        name: "Relationship",
        type: "element",
    });

    return relationshipElements;
};
