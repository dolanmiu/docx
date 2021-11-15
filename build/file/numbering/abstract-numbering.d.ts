import { XmlComponent } from "../../file/xml-components";
import { ILevelsOptions } from "./level";
export declare class AbstractNumbering extends XmlComponent {
    readonly id: number;
    constructor(id: number, levelOptions: ILevelsOptions[]);
}
