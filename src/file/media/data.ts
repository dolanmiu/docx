export type IMediaDataTransformation = {
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
};

type CoreMediaData = {
    readonly fileName: string;
    readonly transformation: IMediaDataTransformation;
    readonly data: Buffer | Uint8Array | ArrayBuffer;
};

type RegularMediaData = {
    readonly type: "jpg" | "png" | "gif" | "bmp";
};

type SvgMediaData = {
    readonly type: "svg";
    /**
     * Required in case the Word processor does not support SVG.
     */
    readonly fallback: RegularMediaData & CoreMediaData;
};

export type IMediaData = (RegularMediaData | SvgMediaData) & CoreMediaData;

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND2 = "";
