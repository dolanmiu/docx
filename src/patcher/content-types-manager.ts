import { Element } from "xml-js";

import { getFirstLevelElements } from "./util";

export const appendContentType = (element: Element, contentType: string, extension: string): void => {
    const relationshipElements = getFirstLevelElements(element, "Types");

    const exist = relationshipElements.some(
        (el) =>
            el.type === "element" &&
            el.name === "Default" &&
            el?.attributes?.ContentType === contentType &&
            el?.attributes?.Extension === extension,
    );
    if (exist) {
        return;
    }

    // eslint-disable-next-line functional/immutable-data
    relationshipElements.push({
        attributes: {
            ContentType: contentType,
            Extension: extension,
        },
        name: "Default",
        type: "element",
    });
};
