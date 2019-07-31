import { Drawing } from "../../drawing";
import { IDrawingOptions } from "../../drawing/drawing";
import { IMediaData } from "../../media/data";
import { Run } from "../run";

export class PictureRun extends Run {
    constructor(imageData: IMediaData, drawingOptions?: IDrawingOptions) {
        super({});

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        const drawing = new Drawing(imageData, drawingOptions);

        this.root.push(drawing);
    }
}
