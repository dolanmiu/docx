import { XmlAttributeComponent } from "file/xml-components";
import { IDistance } from "../drawing";
export interface IAnchorAttributes extends IDistance {
    allowOverlap?: "0" | "1";
    behindDoc?: "0" | "1";
    layoutInCell?: "0" | "1";
    locked?: "0" | "1";
    relativeHeight?: number;
    simplePos?: "0" | "1";
}
export declare class AnchorAttributes extends XmlAttributeComponent<IAnchorAttributes> {
    protected xmlKeys: {
        distT: string;
        distB: string;
        distL: string;
        distR: string;
        allowOverlap: string;
        behindDoc: string;
        layoutInCell: string;
        locked: string;
        relativeHeight: string;
        simplePos: string;
    };
}
