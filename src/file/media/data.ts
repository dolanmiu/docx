export interface IMediaDataDimensions {
    pixels: {
        x: number;
        y: number;
    };
    emus: {
        x: number;
        y: number;
    };
}

export interface IMediaData {
    referenceId: number;
    path: string;
    fileName: string;
    dimensions: IMediaDataDimensions;
}

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
export const WORKAROUND2 = "";
