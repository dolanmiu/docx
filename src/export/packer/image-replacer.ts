/**
 * Image replacer module for substituting image placeholders in XML.
 *
 * @module
 */
import type { IMediaData, Media } from "@file/media";

/**
 * Replaces image placeholders with relationship IDs in XML content.
 *
 * During document compilation, images are referenced using placeholder tokens
 * like {image1.png}. This class replaces those placeholders with the actual
 * relationship IDs used in the OOXML structure.
 *
 * @example
 * ```typescript
 * const replacer = new ImageReplacer();
 * const mediaData = replacer.getMediaData(xmlString, media);
 * const updatedXml = replacer.replace(xmlString, mediaData, 1);
 * ```
 */
export class ImageReplacer {
    /**
     * Replaces image placeholder tokens with relationship IDs.
     *
     * @param xmlData - The XML string containing image placeholders
     * @param mediaData - Array of media data to replace
     * @param offset - Starting offset for relationship IDs
     * @returns XML string with placeholders replaced by relationship IDs
     */
    public replace(xmlData: string, mediaData: readonly IMediaData[], offset: number): string {
        let currentXmlData = xmlData;

        mediaData.forEach((image, i) => {
            currentXmlData = currentXmlData.replace(new RegExp(`{${image.fileName}}`, "g"), (offset + i).toString());
        });

        return currentXmlData;
    }

    /**
     * Extracts media data referenced in the XML content.
     *
     * @param xmlData - The XML string to search for media references
     * @param media - The media collection to search within
     * @returns Array of media data found in the XML
     */
    public getMediaData(xmlData: string, media: Media): readonly IMediaData[] {
        return media.Array.filter((image) => xmlData.search(`{${image.fileName}}`) > 0);
    }
}
