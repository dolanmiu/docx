import { Element } from "xml-js";

import { RelationshipType, TargetModeType } from "@file/relationships/relationship/relationship";
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

export const appendRelationship = (
    relationships: Element,
    id: number | string,
    type: RelationshipType,
    target: string,
    targetMode?: TargetModeType,
): void => {
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
};
