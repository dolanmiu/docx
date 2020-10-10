// http://www.datypic.com/sc/ooxml/e-m_deg-1.html
import { XmlComponent } from "file/xml-components";
import { MathComponent } from "../math-component";

export class MathDegree extends XmlComponent {
    constructor(child?: MathComponent) {
        super("m:deg");

        if (!!child) {
            this.root.push(child);
        }
    }
}
