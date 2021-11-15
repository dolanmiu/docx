import { XmlComponent } from "../../../../file/xml-components";
import { MathComponent } from "../math-component";
export interface IMathSumOptions {
    readonly children: MathComponent[];
    readonly subScript?: MathComponent[];
    readonly superScript?: MathComponent[];
}
export declare class MathSum extends XmlComponent {
    constructor(options: IMathSumOptions);
}
