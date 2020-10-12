import { XmlComponent } from "file/xml-components";

import { MathComponent } from "../math-component";

export class MathDenominator extends XmlComponent {
    constructor(child: MathComponent) {
        super("m:den");

        this.root.push(child);
    }
}
