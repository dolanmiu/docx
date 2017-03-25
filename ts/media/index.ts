import * as fs from "fs";
import * as path from "path";

interface IData {
    referenceId: number;
    stream: fs.ReadStream;
    path: string;
    fileName: string;
}

export class Media {
    private map: Map<string, IData>;

    constructor() {
        this.map = new Map<string, IData>();
    }

    public getMedia(key: string): IData | undefined {
        return this.map.get(key);
    }

    public addMedia(key: string, filePath: string): void {
        this.map.set(key, {
            referenceId: this.map.values.length,
            stream: fs.createReadStream(filePath),
            path: filePath,
            fileName: path.basename(filePath),
        });
    }

    public get array(): IData[] {
        const array = new Array<IData>();

        this.map.forEach((data) => {
            array.push(data);
        });

        return array;
    }
}
