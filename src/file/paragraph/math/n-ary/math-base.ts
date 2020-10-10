// http://www.datypic.com/sc/ooxml/e-m_e-1.html
import { XmlComponent } from "file/xml-components";

import { MathComponent } from "../math-component";

export class MathBase extends XmlComponent {
    constructor(run: MathComponent) {
        super("m:e");

        this.root.push(run);
    }
}
