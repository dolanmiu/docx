// http://www.datypic.com/sc/ooxml/e-m_sSubSup-1.html
import { XmlComponent } from "@file/xml-components";

import { createMathSubSuperScriptProperties } from "./math-sub-super-script-function-properties";
import { MathComponent } from "../../math-component";
import { createMathBase, createMathSubScriptElement, createMathSuperScriptElement } from "../../n-ary";

export type IMathSubSuperScriptOptions = {
    readonly children: readonly MathComponent[];
    readonly subScript: readonly MathComponent[];
    readonly superScript: readonly MathComponent[];
};

export class MathSubSuperScript extends XmlComponent {
    public constructor(options: IMathSubSuperScriptOptions) {
        super("m:sSubSup");

        this.root.push(createMathSubSuperScriptProperties());
        this.root.push(createMathBase({ children: options.children }));
        this.root.push(createMathSubScriptElement({ children: options.subScript }));
        this.root.push(createMathSuperScriptElement({ children: options.superScript }));
    }
}
