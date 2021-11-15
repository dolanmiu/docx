import { XmlAttributeComponent } from "../../../file/xml-components";
export declare class EffectExtentAttributes extends XmlAttributeComponent<{
    readonly b?: number;
    readonly l?: number;
    readonly r?: number;
    readonly t?: number;
}> {
    protected readonly xmlKeys: {
        b: string;
        l: string;
        r: string;
        t: string;
    };
}
