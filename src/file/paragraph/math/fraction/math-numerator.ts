import { XmlComponent } from "file/xml-components";

import { MathComponent } from "../math-component";

export class MathNumerator extends XmlComponent {
    constructor(child: MathComponent) {
        super("m:num");

        this.root.push(child);
    }
}
