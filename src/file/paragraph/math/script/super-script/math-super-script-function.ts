// http://www.datypic.com/sc/ooxml/e-m_sSup-1.html
import { XmlComponent } from "@file/xml-components";

import { MathSuperScriptProperties } from "./math-super-script-function-properties";
import { MathComponent } from "../../math-component";
import { MathBase, MathSuperScriptElement } from "../../n-ary";

export type IMathSuperScriptOptions = {
    readonly children: readonly MathComponent[];
    readonly superScript: readonly MathComponent[];
};

export class MathSuperScript extends XmlComponent {
    public constructor(options: IMathSuperScriptOptions) {
        super("m:sSup");

        this.root.push(new MathSuperScriptProperties());
        this.root.push(new MathBase(options.children));
        this.root.push(new MathSuperScriptElement(options.superScript));
    }
}
