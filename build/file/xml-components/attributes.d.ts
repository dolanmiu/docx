import { XmlAttributeComponent } from "./default-attributes";
export declare class Attributes extends XmlAttributeComponent<{
    readonly val?: string | number | boolean;
    readonly color?: string;
    readonly fill?: string;
    readonly space?: string;
    readonly sz?: string;
    readonly type?: string;
    readonly rsidR?: string;
    readonly rsidRPr?: string;
    readonly rsidSect?: string;
    readonly w?: string;
    readonly h?: string;
    readonly top?: string;
    readonly right?: string;
    readonly bottom?: string;
    readonly left?: string;
    readonly header?: string;
    readonly footer?: string;
    readonly gutter?: string;
    readonly linePitch?: string;
    readonly pos?: string | number;
}> {
    protected readonly xmlKeys: {
        val: string;
        color: string;
        fill: string;
        space: string;
        sz: string;
        type: string;
        rsidR: string;
        rsidRPr: string;
        rsidSect: string;
        w: string;
        h: string;
        top: string;
        right: string;
        bottom: string;
        left: string;
        header: string;
        footer: string;
        gutter: string;
        linePitch: string;
        pos: string;
    };
}
