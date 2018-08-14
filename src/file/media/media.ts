import * as fs from "fs";
import * as sizeOf from "image-size";
import * as path from "path";

import { IDrawingOptions } from "../drawing";
import { File } from "../file";
import { ImageParagraph } from "../paragraph";
import { IMediaData } from "./data";
import { Image } from "./image";

interface IHackedFile {
    currentRelationshipId: number;
}

export class Media {
    public static addImage(file: File, filePath: string, drawingOptions?: IDrawingOptions): Image {
        // Workaround to expose id without exposing to API
        const exposedFile = (file as {}) as IHackedFile;
        const mediaData = file.Media.addMedia(filePath, exposedFile.currentRelationshipId++);
        file.DocumentRelationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        return new Image(new ImageParagraph(mediaData, drawingOptions));
    }

    public static addImageFromBuffer(file: File, buffer: Buffer, width?: number, height?: number, drawingOptions?: IDrawingOptions): Image {
        // Workaround to expose id without exposing to API
        const exposedFile = (file as {}) as IHackedFile;
        const mediaData = file.Media.addMediaFromBuffer(
            `${Media.generateId()}.png`,
            buffer,
            exposedFile.currentRelationshipId++,
            width,
            height,
        );
        file.DocumentRelationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );

        return new Image(new ImageParagraph(mediaData, drawingOptions));
    }

    private static generateId(): string {
        // https://gist.github.com/6174/6062387
        return (
            Math.random()
                .toString(36)
                .substring(2, 15) +
            Math.random()
                .toString(36)
                .substring(2, 15)
        );
    }

    private readonly map: Map<string, IMediaData>;

    constructor() {
        this.map = new Map<string, IMediaData>();
    }

    public getMedia(key: string): IMediaData {
        const data = this.map.get(key);

        if (data === undefined) {
            throw new Error(`Cannot find image with the key ${key}`);
        }

        return data;
    }

    public addMedia(filePath: string, referenceId: number): IMediaData {
        const key = path.basename(filePath);
        const dimensions = sizeOf(filePath);
        return this.createMedia(key, referenceId, dimensions, fs.createReadStream(filePath), filePath);
    }

    public addMediaFromBuffer(fileName: string, buffer: Buffer, referenceId: number, width?: number, height?: number): IMediaData {
        const key = fileName;
        let dimensions;
        if (width && height) {
            dimensions = {
                width: width,
                height: height,
            };
        } else {
            dimensions = sizeOf(buffer);
        }

        return this.createMedia(key, referenceId, dimensions, buffer);
    }

    private createMedia(
        key: string,
        relationshipsCount: number,
        dimensions: { width: number; height: number },
        data: fs.ReadStream | Buffer,
        filePath?: string,
    ): IMediaData {
        const imageData = {
            referenceId: this.map.size + relationshipsCount + 1,
            stream: data,
            path: filePath,
            fileName: key,
            dimensions: {
                pixels: {
                    x: Math.round(dimensions.width),
                    y: Math.round(dimensions.height),
                },
                emus: {
                    x: Math.round(dimensions.width * 9525),
                    y: Math.round(dimensions.height * 9525),
                },
            },
        };

        this.map.set(key, imageData);

        return imageData;
    }

    public get Array(): IMediaData[] {
        const array = new Array<IMediaData>();

        this.map.forEach((data) => {
            array.push(data);
        });

        return array;
    }
}
