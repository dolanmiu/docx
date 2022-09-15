import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

export class MathNumerator extends XmlComponent {
    public constructor(children: readonly MathComponent[]) {
        super("m:num");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
