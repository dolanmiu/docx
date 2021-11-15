import { XmlAttributeComponent } from "../../../file/xml-components";
import { IDistance } from "../drawing";
export interface IAnchorAttributes extends IDistance {
    readonly allowOverlap?: "0" | "1";
    readonly behindDoc?: "0" | "1";
    readonly layoutInCell?: "0" | "1";
    readonly locked?: "0" | "1";
    readonly relativeHeight?: number;
    readonly simplePos?: "0" | "1";
}
export declare class AnchorAttributes extends XmlAttributeComponent<IAnchorAttributes> {
    protected readonly xmlKeys: {
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
