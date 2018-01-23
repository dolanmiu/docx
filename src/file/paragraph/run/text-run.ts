import { Run } from "../run";
import { Text } from "./run-components/text";

export class TextRun extends Run {
    constructor(text: string) {
        super();
        this.root.push(new Text(text));
    }
}
