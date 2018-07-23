import { XmlComponent } from "file/xml-components";
import { LevelForOverride } from "./level";
export declare class Num extends XmlComponent {
    id: number;
    constructor(numId: number, abstractNumId: number);
    overrideLevel(num: number, start?: number): LevelOverride;
}
export declare class LevelOverride extends XmlComponent {
    private readonly levelNum;
    private lvl?;
    constructor(levelNum: number, start?: number);
    readonly level: LevelForOverride;
}
