import { XmlComponent } from "file/xml-components";
import { Level } from "./level";
export declare class AbstractNumbering extends XmlComponent {
    id: number;
    constructor(id: number);
    addLevel(level: Level): void;
    createLevel(num: number, format: string, text: string, align?: string): Level;
}
