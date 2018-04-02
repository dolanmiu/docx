import { IMediaData } from "../../media/data";
import { Run } from "../run";
export declare class PictureRun extends Run {
    private drawing;
    constructor(imageData: IMediaData);
    scale(factorX: number, factorY?: number): void;
}
