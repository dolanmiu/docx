// http://www.datypic.com/sc/ooxml/e-m_sup-3.html
import { XmlComponent } from "file/xml-components";

import { MathComponent } from "../math-component";

export class MathSuperScriptElement extends XmlComponent {
    constructor(child: MathComponent) {
        super("m:sup");

        this.root.push(child);
    }
}
