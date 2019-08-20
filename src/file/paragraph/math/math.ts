// http://www.datypic.com/sc/ooxml/e-m_oMath-1.html
import { XmlComponent } from "file/xml-components";

import { MathFraction } from "./fraction";
import { MathRun } from "./math-run";
import { MathSum } from "./n-ary";

export interface IMathOptions {
    readonly children: Array<MathRun | MathFraction | MathSum>;
}

export class Math extends XmlComponent {
    constructor(readonly options: IMathOptions) {
        super("m:oMath");

        for (const child of options.children) {
            this.root.push(child);
        }
    }
}
