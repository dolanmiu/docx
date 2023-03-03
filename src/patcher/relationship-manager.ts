import { Element } from "xml-js";

import { RelationshipType } from "@file/relationships/relationship/relationship";
import { getFirstLevelElements } from "./util";

const getIdFromRelationshipId = (relationshipId: string): number => parseInt(relationshipId.substring(3), 10);

export const getNextRelationshipIndex = (relationships: Element): number => {
    const relationshipElements = getFirstLevelElements(relationships, "Relationships");

    return (
        (relationshipElements
            .map((e) => getIdFromRelationshipId(e.attributes?.Id?.toString() ?? ""))
            .reduce((acc, curr) => Math.max(acc, curr), 0) ?? 0) + 1
    );
};

export const appendRelationship = (relationships: Element, id: number, type: RelationshipType, target: string): void => {
    const relationshipElements = getFirstLevelElements(relationships, "Relationships");
    // eslint-disable-next-line functional/immutable-data
    relationshipElements.push({
        attributes: {
            Id: `rId${id}`,
            Type: type,
            Target: target,
        },
        name: "Relationship",
        type: "element",
    });
};
