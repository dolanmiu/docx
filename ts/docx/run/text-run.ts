import {Text} from "../xml-components";
import {Run} from "../run";

export class TextRun extends Run {

    constructor(text: string) {
        super();
        this.r.push(new Text(text));
    }
}