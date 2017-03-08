import { Run } from "../run";
import { Text } from "./text";

export class TextRun extends Run {

    constructor(text: string) {
        super();
        this.root.push(new Text(text));
    }
}
