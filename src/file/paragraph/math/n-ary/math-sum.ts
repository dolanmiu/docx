// http://www.datypic.com/sc/ooxml/e-m_nary-1.html
import { XmlComponent } from "file/xml-components";

import { MathRun } from "../math-run";
import { MathBase } from "./math-base";
import { MathNArayProperties } from "./math-naray-properties";
import { MathSubScript } from "./math-sub-script";
import { MathSuperScript } from "./math-super-script";

export interface IMathSumOptions {
    readonly child: MathRun;
    readonly subScript?: MathRun;
    readonly superScript?: MathRun;
}

export class MathSum extends XmlComponent {
    constructor(readonly options: IMathSumOptions) {
        super("m:nary");

        this.root.push(new MathNArayProperties("∑"));
        this.root.push(new MathSubScript(options.child));
        this.root.push(new MathSuperScript(options.child));
        this.root.push(new MathBase(options.child));
    }
}
