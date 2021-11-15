import { XmlComponent } from "../../../file/xml-components";
import { MathComponent } from "./math-component";
export interface IMathOptions {
    readonly children: MathComponent[];
}
export declare class Math extends XmlComponent {
    constructor(options: IMathOptions);
}
