// http://www.datypic.com/sc/ooxml/e-m_e-1.html
import { XmlComponent } from "file/xml-components";

import { MathRun } from "../math-run";

export class MathBase extends XmlComponent {
    constructor(readonly run: MathRun) {
        super("m:e");

        this.root.push(run);
    }
}
