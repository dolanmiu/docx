import {Run, Text} from "../xml-components";
import {ParagraphProperties} from "./properties";

export class TextRun extends Run {

    constructor(text: string) {
        super();
        this.r.push(new ParagraphProperties());
        this.r.push(new Text(text));
    }
}