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
    /** Display width in pixels, at 96 to the inch, not EMUs. Word won't open a drawing more than 225457 pixels wide */
    readonly width: number;
    /** Display height in pixels, at 96 to the inch, not EMUs. Word won't open a drawing more than 225457 pixels tall */
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
 * The path under word/ of a file to write, by its extension, which no other file has: Media takes an image's path with
 * it as `PackageParts.takePath("media", "image", extension)` does, so an image's name isn't taken by another part.
 */
export type MediaPathTaker = (extension: string) => string;

/**
 * Numbers images by type, media/image1.png, media/image2.png and media/image1.jpg, as `PackageParts.takePath` does,
 * when the images aren't in a package with other parts.
 */
const sequentialMediaPaths = (): MediaPathTaker => {
    const counts = new Map<string, number>();
    return (extension) => {
        const count = (counts.get(extension) ?? 0) + 1;
        // eslint-disable-next-line functional/immutable-data
        counts.set(extension, count);
        return `media/image${count}.${extension}`;
    };
};

/**
 * Manages embedded media (images) in a document.
 *
 * Media stores all images referenced in the document and provides access to their data for packaging into the DOCX
 * file. Each image is stored under a unique key, such as a hash of its data, so an image used twice is stored once.
 *
 * In the package, images are named as Word names them: image1.png, image2.png and so on in word/media, numbered in
 * the order they are added. The numbering is by type, so a document with a PNG and a JPEG has image1.png and
 * image1.jpg. Word for the web shows images with Word's own names, and has been seen to show an empty box in place of
 * an image whose name isn't like them. The {@link IMediaData.fileName} of an image in {@link Array}
 * is the name it is written with, not the key it was added under.
 *
 * @example
 * ```typescript
 * const media = new Media();
 * media.addImage("4bf7547c9322fd2143bd3e8dfa84109d9d3fed14.png", {
 *   type: "png",
 *   fileName: "4bf7547c9322fd2143bd3e8dfa84109d9d3fed14.png",
 *   transformation: {
 *     pixels: { x: 200, y: 100 },
 *     emus: { x: 1828800, y: 914400 }
 *   },
 *   data: imageBuffer
 * });
 * const [image] = media.Array; // image.fileName is "image1.png"
 * ```
 */
export class Media {
    // The images by the keys they were added under, with the file names they are written with
    private readonly map = new Map<string, IMediaData>();
    private readonly takePath: MediaPathTaker;

    /**
     * @param takePath - Gives each image its path under word/, by its extension, so that it doesn't take the path of
     * another part of the package, such as a template's image. Default numbers them by type, media/image1.png,
     * media/image2.png and so on
     */
    public constructor(takePath: MediaPathTaker = sequentialMediaPaths()) {
        this.takePath = takePath;
    }

    /**
     * Adds an image to the media collection, once: an image added again under the same key, such as one used in the
     * body and in a header, keeps the file name it was given the first time.
     *
     * @param key - Unique identifier for this image, which the XML refers to it by until it is packed
     * @param mediaData - Complete image data including type, transformation, and raw data
     */
    public addImage(key: string, mediaData: IMediaData): void {
        if (this.map.has(key)) {
            return;
        }
        const path = this.takePath(mediaData.type);
        // eslint-disable-next-line functional/immutable-data
        this.map.set(key, { ...mediaData, fileName: path.slice(path.lastIndexOf("/") + 1) });
    }

    /**
     * Gets all images as an array, in the order they were added, each with the file name it is written with.
     *
     * @returns Read-only array of all media data in the collection
     */
    public get Array(): readonly IMediaData[] {
        return Array.from(this.map.values());
    }

    /**
     * Gets all images with the keys they were added under, in the order they were added.
     *
     * @returns Read-only array of each image's key and media data, whose file name is the one it is written with
     */
    public get Entries(): readonly (readonly [key: string, mediaData: IMediaData])[] {
        return Array.from(this.map.entries());
    }
}
