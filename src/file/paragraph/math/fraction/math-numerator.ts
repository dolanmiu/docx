import { XmlComponent } from "file/xml-components";

import { MathRun } from "../math-run";

export class MathNumerator extends XmlComponent {
    constructor(text: string) {
        super("m:num");

        this.root.push(new MathRun(text));
    }
}
