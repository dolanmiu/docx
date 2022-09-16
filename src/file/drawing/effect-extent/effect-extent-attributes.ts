import { XmlAttributeComponent } from "@file/xml-components";

export class EffectExtentAttributes extends XmlAttributeComponent<{
    readonly b?: number;
    readonly l?: number;
    readonly r?: number;
    readonly t?: number;
}> {
    protected readonly xmlKeys = {
        b: "b",
        l: "l",
        r: "r",
        t: "t",
    };
}
