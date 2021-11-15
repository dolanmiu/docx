import { XmlComponent } from "../../../../../file/xml-components";
import { MathComponent } from "../../math-component";
export interface IMathSuperScriptOptions {
    readonly children: MathComponent[];
    readonly superScript: MathComponent[];
}
export declare class MathSuperScript extends XmlComponent {
    constructor(options: IMathSuperScriptOptions);
}
