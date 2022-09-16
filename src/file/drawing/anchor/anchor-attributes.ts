import { XmlAttributeComponent } from "@file/xml-components";
import { IDistance } from "../drawing";

export interface IAnchorAttributes extends IDistance {
    readonly allowOverlap?: "0" | "1";
    readonly behindDoc?: "0" | "1";
    readonly layoutInCell?: "0" | "1";
    readonly locked?: "0" | "1";
    readonly relativeHeight?: number;
    readonly simplePos?: "0" | "1";
}

export class AnchorAttributes extends XmlAttributeComponent<IAnchorAttributes> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
        distL: "distL",
        distR: "distR",
        allowOverlap: "allowOverlap",
        behindDoc: "behindDoc",
        layoutInCell: "layoutInCell",
        locked: "locked",
        relativeHeight: "relativeHeight",
        simplePos: "simplePos",
    };
}
