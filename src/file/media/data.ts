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

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND2 = "";
