import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { MathDenominator } from "./math-denominator";
import { MathNumerator } from "./math-numerator";

export interface IMathFractionOptions {
    readonly numerator: readonly MathComponent[];
    readonly denominator: readonly MathComponent[];
}

export class MathFraction extends XmlComponent {
    public constructor(options: IMathFractionOptions) {
        super("m:f");

        this.root.push(new MathNumerator(options.numerator));
        this.root.push(new MathDenominator(options.denominator));
    }
}
