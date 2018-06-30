import { Run } from "file/paragraph";
import { FootnoteRef } from "./footnote-ref";

export class FootnoteRefRun extends Run {
    constructor() {
        super();

        this.style("FootnoteReference");
        this.root.push(new FootnoteRef());
    }
}
