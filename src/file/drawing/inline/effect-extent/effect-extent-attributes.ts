import { XmlAttributeComponent } from "file/xml-components";

export interface IEffectExtentAttributes {
    b?: number;
    l?: number;
    r?: number;
    t?: number;
}

export class EffectExtentAttributes extends XmlAttributeComponent<IEffectExtentAttributes> {
    protected xmlKeys = {
        b: "b",
        l: "l",
        r: "r",
        t: "t",
    };
}
