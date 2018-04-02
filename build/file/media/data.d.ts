/// <reference types="node" />
import * as fs from "fs";
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
    stream: fs.ReadStream;
    path: string;
    fileName: string;
    dimensions: IMediaDataDimensions;
}
export declare const WORKAROUND2 = "";
