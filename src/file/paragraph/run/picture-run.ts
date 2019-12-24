import { Drawing } from "../../drawing";
import { IDrawingOptions } from "../../drawing/drawing";
import { IMediaData } from "../../media/data";
import { Run } from "../run";

export class PictureRun extends Run {
    constructor(imageData: IMediaData, drawingOptions?: IDrawingOptions) {
        super({});

        const drawing = new Drawing(imageData, drawingOptions);

        this.root.push(drawing);
    }
}
