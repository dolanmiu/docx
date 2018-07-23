import { IDrawingOptions } from "../../drawing/drawing";
import { IMediaData } from "../../media/data";
import { Run } from "../run";
export declare class PictureRun extends Run {
    private drawing;
    constructor(imageData: IMediaData, drawingOptions?: IDrawingOptions);
    scale(factorX: number, factorY?: number): void;
}
