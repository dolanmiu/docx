import { XmlAttributeComponent } from "./default-attributes";
export interface IAttributesProperties {
    val?: string | number | boolean;
    color?: string;
    space?: string;
    sz?: string;
    type?: string;
    rsidR?: string;
    rsidRPr?: string;
    rsidSect?: string;
    w?: string;
    h?: string;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    header?: string;
    footer?: string;
    gutter?: string;
    linePitch?: string;
    pos?: string | number;
}
export declare class Attributes extends XmlAttributeComponent<IAttributesProperties> {
    protected xmlKeys: {
        val: string;
        color: string;
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
