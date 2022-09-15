// http://www.datypic.com/sc/ooxml/e-m_e-1.html
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

export class MathBase extends XmlComponent {
    public constructor(children: readonly MathComponent[]) {
        super("m:e");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
