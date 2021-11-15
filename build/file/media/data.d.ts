/// <reference types="node" />
export interface IMediaDataTransformation {
    readonly pixels: {
        readonly x: number;
        readonly y: number;
    };
    readonly emus: {
        readonly x: number;
        readonly y: number;
    };
    readonly flip?: {
        readonly vertical?: boolean;
        readonly horizontal?: boolean;
    };
    readonly rotation?: number;
}
export interface IMediaData {
    readonly stream: Buffer | Uint8Array | ArrayBuffer;
    readonly fileName: string;
    readonly transformation: IMediaDataTransformation;
}
export declare const WORKAROUND2 = "";
