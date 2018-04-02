import { IMediaData } from "./data";
export declare class Media {
    private readonly map;
    constructor();
    getMedia(key: string): IMediaData;
    addMedia(filePath: string, relationshipsCount: number): IMediaData;
    readonly array: IMediaData[];
}
