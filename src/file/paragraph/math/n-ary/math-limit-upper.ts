// http://www.datypic.com/sc/ooxml/e-m_limUpp-1.html
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { createMathBase } from "./math-base";
import { MathLimit } from "./math-limit";

export type IMathLimitUpperOptions = {
    readonly children: readonly MathComponent[];
    readonly limit: readonly MathComponent[];
};

export class MathLimitUpper extends XmlComponent {
    public constructor(options: IMathLimitUpperOptions) {
        super("m:limUpp");

        this.root.push(createMathBase({ children: options.children }));
        this.root.push(new MathLimit(options.limit));
    }
}
