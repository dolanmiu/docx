// http://www.datypic.com/sc/ooxml/e-m_nary-1.html
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { MathBase } from "./math-base";
import { MathNAryProperties } from "./math-n-ary-properties";
import { MathSubScriptElement } from "./math-sub-script";
import { MathSuperScriptElement } from "./math-super-script";

export interface IMathSumOptions {
    readonly children: readonly MathComponent[];
    readonly subScript?: readonly MathComponent[];
    readonly superScript?: readonly MathComponent[];
}

export class MathSum extends XmlComponent {
    public constructor(options: IMathSumOptions) {
        super("m:nary");

        this.root.push(new MathNAryProperties("∑", !!options.superScript, !!options.subScript));

        if (!!options.subScript) {
            this.root.push(new MathSubScriptElement(options.subScript));
        }

        if (!!options.superScript) {
            this.root.push(new MathSuperScriptElement(options.superScript));
        }

        this.root.push(new MathBase(options.children));
    }
}
