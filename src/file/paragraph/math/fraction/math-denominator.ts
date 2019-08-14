import { XmlComponent } from "file/xml-components";

import { MathRun } from "../math-run";

export class MathDenominator extends XmlComponent {
    constructor(readonly text: string) {
        super("m:den");

        this.root.push(new MathRun(text));
    }
}
