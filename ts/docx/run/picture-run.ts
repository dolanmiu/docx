import { Run } from "../run";
import { Drawing } from "./run-components/drawing";

export class PictureRun extends Run {

    constructor(imagePath: string) {
        super();
        this.root.push(new Drawing(imagePath));
    }
}
