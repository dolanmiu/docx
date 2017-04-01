import { IData } from "../../media/data";
import { Run } from "../run";
import { Drawing } from "./run-components/drawing";

export class PictureRun extends Run {

    constructor(imageData: IData) {
        super();

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        this.root.push(new Drawing(imageData));
    }
}
