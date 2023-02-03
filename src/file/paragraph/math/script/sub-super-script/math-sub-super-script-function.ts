// http://www.datypic.com/sc/ooxml/e-m_sSubSup-1.html
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../../math-component";
import { MathBase, MathSubScriptElement, MathSuperScriptElement } from "../../n-ary";
import { MathSubSuperScriptProperties } from "./math-sub-super-script-function-properties";

export interface IMathSubSuperScriptOptions {
    readonly children: readonly MathComponent[];
    readonly subScript: readonly MathComponent[];
    readonly superScript: readonly MathComponent[];
}

export class MathSubSuperScript extends XmlComponent {
    public constructor(options: IMathSubSuperScriptOptions) {
        super("m:sSubSup");

        this.root.push(new MathSubSuperScriptProperties());
        this.root.push(new MathBase(options.children));
        this.root.push(new MathSubScriptElement(options.subScript));
        this.root.push(new MathSuperScriptElement(options.superScript));
    }
}
