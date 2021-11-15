import { XmlComponent } from "../../../../../file/xml-components";
import { MathComponent } from "../../math-component";
export interface IMathPreSubSuperScriptOptions {
    readonly children: MathComponent[];
    readonly subScript: MathComponent[];
    readonly superScript: MathComponent[];
}
export declare class MathPreSubSuperScript extends XmlComponent {
    constructor(options: IMathPreSubSuperScriptOptions);
}
