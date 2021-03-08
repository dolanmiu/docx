// http://www.datypic.com/sc/ooxml/e-m_oMath-1.html
import { XmlComponent } from "file/xml-components";

import { MathComponent } from "./math-component";

export interface IMathOptions {
    readonly children: MathComponent[];
}

export class Math extends XmlComponent {
    constructor(options: IMathOptions) {
        super("m:oMath");

        for (const child of options.children) {
            this.root.push(child);
        }
    }
}
