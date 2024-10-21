// http://www.datypic.com/sc/ooxml/e-m_lim-1.html
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

export class MathLimit extends XmlComponent {
    public constructor(children: readonly MathComponent[]) {
        super("m:lim");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
