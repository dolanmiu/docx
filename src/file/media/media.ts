/**
 * Media module for WordprocessingML documents.
 *
 * This module provides support for managing embedded media (images)
 * within a document.
 *
 * @module
 */
import type { IMediaData } from "./data";

/**
 * Transformation options for media display.
 *
 * Specifies how an image should be transformed when displayed in the document.
 */
export type IMediaTransformation = {
    readonly offset?: {
        readonly top?: number;
        readonly left?: number;
    };
    readonly width: number;
    /** Display height in pixels */
    readonly height: number;
    /** Optional flip transformations */
    readonly flip?: {
        /** Whether to flip the image vertically */
        readonly vertical?: boolean;
        /** Whether to flip the image horizontally */
        readonly horizontal?: boolean;
    };
    /** Optional rotation angle in degrees */
    readonly rotation?: number;
};

/**
 * Manages embedded media (images) in a document.
 *
 * Media stores all images referenced in the document and provides
 * access to their data for packaging into the DOCX file. Each image
 * is stored with a unique key for retrieval.
 *
 * @example
 * ```typescript
 * const media = new Media();
 * media.addImage("image1", {
 *   type: "png",
 *   fileName: "image1.png",
 *   transformation: {
 *     pixels: { x: 200, y: 100 },
 *     emus: { x: 1828800, y: 914400 }
 *   },
 *   data: imageBuffer
 * });
 * const allImages = media.Array;
 * ```
 */
export class Media {
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly map: Map<string, IMediaData>;

    public constructor() {
        this.map = new Map<string, IMediaData>();
    }

    /**
     * Adds an image to the media collection.
     *
     * @param key - Unique identifier for this image
     * @param mediaData - Complete image data including file name, transformation, and raw data
     */
    public addImage(key: string, mediaData: IMediaData): void {
        this.map.set(key, mediaData);
    }

    /**
     * Gets all images as an array.
     *
     * @returns Read-only array of all media data in the collection
     */
    public get Array(): readonly IMediaData[] {
        return Array.from(this.map.values());
    }
}
