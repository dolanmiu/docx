// http://www.datypic.com/sc/ooxml/e-m_e-1.html
import { XmlComponent } from "file/xml-components";

import { MathRun } from "../math-run";

export class MathSubScript extends XmlComponent {
    constructor(readonly run: MathRun) {
        super("m:sub");

        this.root.push(run);
    }
}
