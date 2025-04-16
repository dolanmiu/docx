// http://www.datypic.com/sc/ooxml/e-m_sPre-1.html
import { BuilderElement } from "@file/xml-components";

import { createMathPreSubSuperScriptProperties } from "./math-pre-sub-super-script-function-properties";
import type { MathComponent } from "../../math-component";
import { createMathBase, createMathSubScriptElement, createMathSuperScriptElement } from "../../n-ary";

export type IMathPreSubSuperScriptOptions = {
    readonly children: readonly MathComponent[];
    readonly subScript: readonly MathComponent[];
    readonly superScript: readonly MathComponent[];
};

export class MathPreSubSuperScript extends BuilderElement {
    public constructor({ children, subScript, superScript }: IMathPreSubSuperScriptOptions) {
        super({
            name: "m:sPre",
            children: [
                createMathPreSubSuperScriptProperties(),
                createMathBase({ children: children }),
                createMathSubScriptElement({ children: subScript }),
                createMathSuperScriptElement({ children: superScript }),
            ],
        });
    }
}
