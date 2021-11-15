import { XmlComponent } from "../../../../file/xml-components";
import { MathComponent } from "../math-component";
export interface IMathFractionOptions {
    readonly numerator: MathComponent[];
    readonly denominator: MathComponent[];
}
export declare class MathFraction extends XmlComponent {
    constructor(options: IMathFractionOptions);
}
