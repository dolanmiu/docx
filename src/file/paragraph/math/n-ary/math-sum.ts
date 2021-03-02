// http://www.datypic.com/sc/ooxml/e-m_nary-1.html
import { XmlComponent } from "file/xml-components";

import { MathComponent } from "../math-component";
import { MathBase } from "./math-base";
import { MathNArayProperties } from "./math-naray-properties";
import { MathSubScriptElement } from "./math-sub-script";
import { MathSuperScriptElement } from "./math-super-script";

export interface IMathSumOptions {
    readonly children: MathComponent[];
    readonly subScript?: MathComponent[];
    readonly superScript?: MathComponent[];
}

export class MathSum extends XmlComponent {
    constructor(options: IMathSumOptions) {
        super("m:nary");

        this.root.push(new MathNArayProperties("∑", !!options.superScript, !!options.subScript));

        if (!!options.subScript) {
            this.root.push(new MathSubScriptElement(options.subScript));
        }

        if (!!options.superScript) {
            this.root.push(new MathSuperScriptElement(options.superScript));
        }

        this.root.push(new MathBase(options.children));
    }
}
