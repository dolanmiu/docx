/// <reference types="node" />
import { IContext, IXmlableObject } from "../../../file/xml-components";
import { IFloating } from "../../drawing";
import { IMediaTransformation } from "../../media";
import { Run } from "../run";
export interface IImageOptions {
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    readonly transformation: IMediaTransformation;
    readonly floating?: IFloating;
}
export declare class ImageRun extends Run {
    private readonly key;
    private readonly imageData;
    constructor(options: IImageOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
    private convertDataURIToBinary;
}
