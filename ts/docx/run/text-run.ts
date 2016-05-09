import {Text} from "./text";
import {Run} from "../run";

export class TextRun extends Run {

    constructor(text: string) {
        super();
        this.root.push(new Text(text));
    }
}