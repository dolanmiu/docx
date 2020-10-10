import { XmlComponent } from "file/xml-components";

import { MathDenominator } from "./math-denominator";
import { MathNumerator } from "./math-numerator";

export interface IMathFractionOptions {
    readonly numerator: MathNumerator;
    readonly denominator: MathDenominator;
}

export class MathFraction extends XmlComponent {
    constructor(options: IMathFractionOptions) {
        super("m:f");

        this.root.push(options.numerator);
        this.root.push(options.denominator);
    }
}
