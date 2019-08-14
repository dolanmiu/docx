import { XmlComponent } from "file/xml-components";

import { MathText } from "./math-text";

export class MathRun extends XmlComponent {
    constructor(readonly text: string) {
        super("m:r");

        this.root.push(new MathText(text));
    }
}
