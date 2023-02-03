// http://www.datypic.com/sc/ooxml/e-m_deg-1.html
import { XmlComponent } from "@file/xml-components";
import { MathComponent } from "../math-component";

export class MathDegree extends XmlComponent {
    public constructor(children?: readonly MathComponent[]) {
        super("m:deg");

        if (!!children) {
            for (const child of children) {
                this.root.push(child);
            }
        }
    }
}
