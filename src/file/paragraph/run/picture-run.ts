import { Drawing } from "../../drawing";
import { IMediaData } from "../../media/data";
import { Run } from "../run";
import { DrawingOptions } from "../../drawing/drawing";

export class PictureRun extends Run {
    constructor(imageData: IMediaData, drawingOptions?: DrawingOptions) {
        super();

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        this.root.push(new Drawing(imageData, drawingOptions));
    }
}
