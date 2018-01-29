import * as fs from "fs";
import * as sizeOf from "image-size";
import * as path from "path";

import { Relationships } from "file/relationships/relationships";
import { IMediaData } from "./data";

export class Media {
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

    public addMedia(filePath: string, relationshipsCount: number): IMediaData {
        const key = path.basename(filePath);
        const dimensions = sizeOf(filePath);

        const imageData = {
            referenceId: this.map.size + relationshipsCount,
            stream: fs.createReadStream(filePath),
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

    public get array(): IMediaData[] {
        const array = new Array<IMediaData>();

        this.map.forEach((data) => {
            array.push(data);
        });

        return array;
    }
}
