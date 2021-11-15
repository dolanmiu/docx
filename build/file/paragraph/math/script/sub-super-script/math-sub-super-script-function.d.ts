import { XmlComponent } from "../../../../../file/xml-components";
import { MathComponent } from "../../math-component";
export interface IMathSubSuperScriptOptions {
    readonly children: MathComponent[];
    readonly subScript: MathComponent[];
    readonly superScript: MathComponent[];
}
export declare class MathSubSuperScript extends XmlComponent {
    constructor(options: IMathSubSuperScriptOptions);
}
