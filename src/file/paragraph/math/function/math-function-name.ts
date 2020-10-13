// http://www.datypic.com/sc/ooxml/e-m_fName-1.html
import { XmlComponent } from "file/xml-components";
import { MathComponent } from "../math-component";

export class MathFunctionName extends XmlComponent {
    constructor(children: MathComponent[]) {
        super("m:fName");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
