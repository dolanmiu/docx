import { XmlComponent } from "../../../../../file/xml-components";
import { MathComponent } from "../../math-component";
export interface IMathSubScriptOptions {
    readonly children: MathComponent[];
    readonly subScript: MathComponent[];
}
export declare class MathSubScript extends XmlComponent {
    constructor(options: IMathSubScriptOptions);
}
