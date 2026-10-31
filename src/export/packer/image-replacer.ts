/**
 * Image replacer module for substituting image placeholders in XML.
 *
 * @module
 */
import type { Media } from "@file/media";

import { findPlaceholders, replacePlaceholders } from "./placeholders";

/**
 * An image a part's XML refers to: the key its placeholders have, such as `rId{key}`, which is the key it was added to
 * the media under, and the file name it is written with in word/media, such as image1.png, which the relationship to
 * it targets.
 */
export type ImageReference = {
    readonly key: string;
    readonly fileName: string;
};

/**
 * Replaces image placeholders with relationship IDs in XML content.
 *
 * During document compilation, images are referenced using placeholder tokens
 * like {4bf7547c9322fd2143bd3e8dfa84109d9d3fed14.png}, the key the image was
 * added to the media under. This class replaces those placeholders with the
 * actual relationship IDs used in the OOXML structure.
 *
 * @example
 * ```typescript
 * const replacer = new ImageReplacer();
 * const images = replacer.getMediaData(xmlString, media);
 * const updatedXml = replacer.replace(xmlString, images, 1);
 * ```
 */
export class ImageReplacer {
    /**
     * Replaces image placeholder tokens with relationship IDs.
     *
     * @param xmlData - The XML string containing image placeholders
     * @param images - The images the XML refers to, in the order their relationships are numbered
     * @param offset - Starting offset for relationship IDs
     * @returns XML string with placeholders replaced by relationship IDs
     */
    public replace(xmlData: string, images: readonly ImageReference[], offset: number): string {
        return replacePlaceholders(xmlData, new Map(images.map((image, i) => [image.key, (offset + i).toString()])));
    }

    /**
     * Finds the images referenced in the XML content.
     *
     * @param xmlData - The XML string to search for image references
     * @param media - The media collection to search within
     * @returns The images found in the XML, in the order they were added to the media
     */
    public getMediaData(xmlData: string, media: Media): readonly ImageReference[] {
        const placeholders = findPlaceholders(xmlData);
        return media.Entries.filter(([key]) => placeholders.has(key)).map(([key, { fileName }]) => ({ key, fileName }));
    }
}
