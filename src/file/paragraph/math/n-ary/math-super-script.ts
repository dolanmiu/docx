// http://www.datypic.com/sc/ooxml/e-m_e-1.html
import { XmlComponent } from "file/xml-components";

import { MathRun } from "../math-run";

export class MathSuperScript extends XmlComponent {
    constructor(readonly run: MathRun) {
        super("m:sup");

        this.root.push(run);
    }
}
