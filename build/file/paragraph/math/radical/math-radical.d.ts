import { XmlComponent } from "../../../../file/xml-components";
import { MathComponent } from "../math-component";
export interface IMathRadicalOptions {
    readonly children: MathComponent[];
    readonly degree?: MathComponent[];
}
export declare class MathRadical extends XmlComponent {
    constructor(options: IMathRadicalOptions);
}
