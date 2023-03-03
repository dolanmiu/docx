import { Element } from "xml-js";

import { getFirstLevelElements } from "./util";

export const appendContentType = (element: Element, contentType: string, extension: string): void => {
    const relationshipElements = getFirstLevelElements(element, "Types");
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
