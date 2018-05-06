import * as fs from "fs";
import * as sizeOf from "image-size";
import * as path from "path";

import { IMediaData } from "./data";

export class Media {
    private readonly map: Map<string, IMediaData>;

    constructor() {
        this.map = new Map<string, IMediaData>();
    }

    private createMedia(key: string, relationshipsCount, dimensions,  data: fs.ReadStream | Buffer, filePath?: string, ) {
        const imageData = {
            referenceId: this.map.size + relationshipsCount + 1,
            stream: data,
            path: filePath,
            fileName: key,
            dimensions: {
                pixels: {
                    x: dimensions.width,
                    y: dimensions.height,
                },
                emus: {
                    x: dimensions.width * 9525,
                    y: dimensions.height * 9525,
                },
            },
        };
        this.map.set(key, imageData);

        return imageData;
    }
    public getMedia(key: string): IMediaData {
        const data = this.map.get(key);

        if (data === undefined) {
            throw new Error(`Cannot find image with the key ${key}`);
        }

        return data;
    }

    public addMedia(filePath: string, relationshipsCount: number): IMediaData {
        const key = path.basename(filePath);
        const dimensions = sizeOf(filePath);
        return this.createMedia(key, relationshipsCount, dimensions, fs.createReadStream(filePath), filePath);
    }

    public addMediaWithData(fileName: string, data: Buffer, relationshipsCount: number, width?, height?): IMediaData {
        const key = fileName;
        let dimensions;
        if (width && height) {
            dimensions = {
                width: width,
                height: height
            }
        } else {
            dimensions = sizeOf(data);
        }
        
        return this.createMedia(key, relationshipsCount, dimensions, data);
    }

    public get array(): IMediaData[] {
        const array = new Array<IMediaData>();

        this.map.forEach((data) => {
            array.push(data);
        });

        return array;
    }
}
