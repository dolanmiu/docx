import { XmlComponent } from "../../../../file/xml-components";
import { MathComponent } from "../math-component";
export interface IMathFunctionOptions {
    readonly children: MathComponent[];
    readonly name: MathComponent[];
}
export declare class MathFunction extends XmlComponent {
    constructor(options: IMathFunctionOptions);
}
