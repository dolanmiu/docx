/// <reference types="request-promise" />
import * as request from "request-promise";
export interface IConvertOutput {
    data: string;
}
export declare class PdfConvertWrapper {
    convert(filePath: string): request.RequestPromise;
}
