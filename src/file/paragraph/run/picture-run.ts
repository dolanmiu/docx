import { Drawing } from "../../drawing";
import { IData } from "../../media/data";
import { Run } from "../run";

export class PictureRun extends Run {

    constructor(imageData: IData) {
        super();

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        this.root.push(new Drawing(imageData));
    }
}
