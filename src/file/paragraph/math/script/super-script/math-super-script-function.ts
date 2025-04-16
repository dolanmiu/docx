// http://www.datypic.com/sc/ooxml/e-m_sSup-1.html
import { XmlComponent } from "@file/xml-components";

import { createMathSuperScriptProperties } from "./math-super-script-function-properties";
import { MathComponent } from "../../math-component";
import { createMathBase, createMathSuperScriptElement } from "../../n-ary";

export type IMathSuperScriptOptions = {
    readonly children: readonly MathComponent[];
    readonly superScript: readonly MathComponent[];
};

export class MathSuperScript extends XmlComponent {
    public constructor(options: IMathSuperScriptOptions) {
        super("m:sSup");

        this.root.push(createMathSuperScriptProperties());
        this.root.push(createMathBase({ children: options.children }));
        this.root.push(createMathSuperScriptElement({ children: options.superScript }));
    }
}
