/// <reference types="node" />
import { IMediaData } from "./data";
export interface IMediaTransformation {
    readonly width: number;
    readonly height: number;
    readonly flip?: {
        readonly vertical?: boolean;
        readonly horizontal?: boolean;
    };
    readonly rotation?: number;
}
export declare class Media {
    private readonly map;
    constructor();
    addMedia(data: Buffer | string | Uint8Array | ArrayBuffer, transformation: IMediaTransformation): IMediaData;
    addImage(key: string, mediaData: IMediaData): void;
    get Array(): readonly IMediaData[];
    private convertDataURIToBinary;
}
