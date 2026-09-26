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

/**
 * Appends a content type for one part of the package to the [Content_Types].xml structure, such as a chart a patch
 * adds, unless the part already has one.
 *
 * @param element - The [Content_Types].xml root element
 * @param contentType - The part's MIME type (e.g., "application/vnd.openxmlformats-officedocument.drawingml.chart+xml")
 * @param partName - The part's path in the package (e.g., "/word/charts/chart1.xml")
 */
export const appendContentTypeOverride = (element: Element, contentType: string, partName: string): void => {
    const contentTypeElements = getFirstLevelElements(element, "Types");

    if (contentTypeElements.some((el) => el.type === "element" && el.name === "Override" && el.attributes?.PartName === partName)) {
        return;
    }

    // eslint-disable-next-line functional/immutable-data
    contentTypeElements.push({
        attributes: {
            ContentType: contentType,
            PartName: partName,
        },
        name: "Override",
        type: "element",
    });
};
