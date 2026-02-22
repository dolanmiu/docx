/**
 * Content types manager for OOXML [Content_Types].xml management.
 *
 * @module
 */
import type { Element } from "xml-js";

import { getFirstLevelElements } from "./util";

/**
 * Appends a content type definition to the [Content_Types].xml structure.
 *
 * The [Content_Types].xml file declares the MIME types for all file extensions
 * in the OOXML package. This function adds a new content type if it doesn't
 * already exist, ensuring that newly added media files are properly declared.
 *
 * @param element - The [Content_Types].xml root element
 * @param contentType - The MIME type (e.g., "image/png")
 * @param extension - The file extension (e.g., "png")
 *
 * @example
 * ```typescript
 * appendContentType(contentTypesElement, "image/png", "png");
 * appendContentType(contentTypesElement, "image/jpeg", "jpg");
 * ```
 */
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
