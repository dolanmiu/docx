// http://www.datypic.com/sc/ooxml/e-m_sSub-1.html
import { XmlComponent } from "file/xml-components";

import { MathComponent } from "../../math-component";
import { MathBase, MathSubScriptElement } from "../../n-ary";
import { MathSubScriptProperties } from "./math-sub-script-function-properties";

export interface IMathSubScriptOptions {
    readonly children: MathComponent[];
    readonly subScript: MathComponent[];
}

export class MathSubScript extends XmlComponent {
    constructor(options: IMathSubScriptOptions) {
        super("m:sSub");

        this.root.push(new MathSubScriptProperties());
        this.root.push(new MathBase(options.children));
        this.root.push(new MathSubScriptElement(options.subScript));
    }
}
