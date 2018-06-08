import { XmlAttributeComponent } from "file/xml-components";
import { Distance } from "../drawing";

export interface IAnchorAttributes extends Distance {
    allowOverlap?: "0" | "1";
    behindDoc?: "0" | "1";
    layoutInCell?: "0" | "1";
    locked?: "0" | "1";
    relativeHeight?: number;
    simplePos?: "0" | "1";
}

export class AnchorAttributes extends XmlAttributeComponent<IAnchorAttributes> {
    protected xmlKeys = {
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
