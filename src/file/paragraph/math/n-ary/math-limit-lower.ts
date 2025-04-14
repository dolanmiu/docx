// http://www.datypic.com/sc/ooxml/e-m_limLow-1.html
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { createMathBase } from "./math-base";
import { MathLimit } from "./math-limit";

export type IMathLimitLowerOptions = {
    readonly children: readonly MathComponent[];
    readonly limit: readonly MathComponent[];
};

export class MathLimitLower extends XmlComponent {
    public constructor(options: IMathLimitLowerOptions) {
        super("m:limLow");

        this.root.push(createMathBase({ children: options.children }));
        this.root.push(new MathLimit(options.limit));
    }
}
