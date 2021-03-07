import { XmlComponent } from "file/xml-components";

import { MathComponent } from "../math-component";

export class MathDenominator extends XmlComponent {
    constructor(children: MathComponent[]) {
        super("m:den");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
