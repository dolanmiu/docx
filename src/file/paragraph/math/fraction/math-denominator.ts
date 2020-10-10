import { XmlComponent } from "file/xml-components";

import { MathRun } from "../math-run";

export class MathDenominator extends XmlComponent {
    constructor(text: string) {
        super("m:den");

        this.root.push(new MathRun(text));
    }
}
