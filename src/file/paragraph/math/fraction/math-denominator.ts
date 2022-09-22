import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

export class MathDenominator extends XmlComponent {
    public constructor(children: readonly MathComponent[]) {
        super("m:den");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
