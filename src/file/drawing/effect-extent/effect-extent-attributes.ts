import { XmlAttributeComponent } from "file/xml-components";

export interface IEffectExtentAttributes {
    readonly b?: number;
    readonly l?: number;
    readonly r?: number;
    readonly t?: number;
}

export class EffectExtentAttributes extends XmlAttributeComponent<IEffectExtentAttributes> {
    protected readonly xmlKeys = {
        b: "b",
        l: "l",
        r: "r",
        t: "t",
    };
}
