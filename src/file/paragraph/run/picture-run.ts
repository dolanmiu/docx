import { Drawing } from "../../drawing";
import { IDrawingOptions } from "../../drawing/drawing";
import { IMediaData } from "../../media/data";
import { Run } from "../run";

export class PictureRun extends Run {
    private drawing: Drawing;

    constructor(imageData: IMediaData, drawingOptions?: IDrawingOptions) {
        super();

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        this.drawing = new Drawing(imageData, drawingOptions);

        this.root.push(this.drawing);
    }

    public scale(factorX: number, factorY?: number): void {
        if (!factorX) {
            factorX = 1;
        }

        if (!factorY) {
            factorY = factorX;
        }

        this.drawing.scale(factorX, factorY);
    }
}
