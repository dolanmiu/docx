// http://www.datypic.com/sc/ooxml/e-m_sub-3.html
import { XmlComponent } from "file/xml-components";

import { MathComponent } from "../math-component";

export class MathSubScriptElement extends XmlComponent {
    constructor(child: MathComponent) {
        super("m:sub");

        this.root.push(child);
    }
}
