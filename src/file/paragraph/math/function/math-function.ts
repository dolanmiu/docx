// http://www.datypic.com/sc/ooxml/e-m_func-1.html
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { MathBase } from "../n-ary";
import { MathFunctionName } from "./math-function-name";
import { MathFunctionProperties } from "./math-function-properties";

export interface IMathFunctionOptions {
    readonly children: readonly MathComponent[];
    readonly name: readonly MathComponent[];
}

export class MathFunction extends XmlComponent {
    public constructor(options: IMathFunctionOptions) {
        super("m:func");

        this.root.push(new MathFunctionProperties());
        this.root.push(new MathFunctionName(options.name));
        this.root.push(new MathBase(options.children));
    }
}
