import { XmlAttributeComponent } from "file/xml-components";
export interface IEffectExtentAttributes {
    b?: number;
    l?: number;
    r?: number;
    t?: number;
}
export declare class EffectExtentAttributes extends XmlAttributeComponent<IEffectExtentAttributes> {
    protected xmlKeys: {
        b: string;
        l: string;
        r: string;
        t: string;
    };
}
