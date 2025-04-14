// http://www.datypic.com/sc/ooxml/e-m_sSub-1.html
import { XmlComponent } from "@file/xml-components";

import { createMathSubScriptProperties } from "./math-sub-script-function-properties";
import { MathComponent } from "../../math-component";
import { createMathBase, createMathSubScriptElement } from "../../n-ary";

export type IMathSubScriptOptions = {
    readonly children: readonly MathComponent[];
    readonly subScript: readonly MathComponent[];
};

export class MathSubScript extends XmlComponent {
    public constructor(options: IMathSubScriptOptions) {
        super("m:sSub");

        this.root.push(createMathSubScriptProperties());
        this.root.push(createMathBase({ children: options.children }));
        this.root.push(createMathSubScriptElement({ children: options.subScript }));
    }
}
