/**
 * Media module for WordprocessingML documents.
 *
 * This module provides support for managing embedded media (images)
 * within a document.
 *
 * @module
 */
import { IMediaData } from "./data";

/**
 * Transformation options for media display.
 *
 * Specifies how an image should be transformed when displayed.
 */
export type IMediaTransformation = {
    /** Display width in pixels */
    readonly width: number;
    /** Display height in pixels */
    readonly height: number;
    /** Optional flip transformations */
    readonly flip?: {
        readonly vertical?: boolean;
        readonly horizontal?: boolean;
    };
    /** Optional rotation in degrees */
    readonly rotation?: number;
};

/**
 * Manages embedded media (images) in a document.
 *
 * Media stores all images referenced in the document and provides
 * access to their data for packaging into the DOCX file.
 */
export class Media {
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly map: Map<string, IMediaData>;

    public constructor() {
        this.map = new Map<string, IMediaData>();
    }

    public addImage(key: string, mediaData: IMediaData): void {
        this.map.set(key, mediaData);
    }

    public get Array(): readonly IMediaData[] {
        return Array.from(this.map.values());
    }
}
