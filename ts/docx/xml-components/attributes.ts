import {XmlAttributeComponent} from "./default-attributes";

interface AttributesProperties {
    val?: any;
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
    pos?: string;
}

export class Attributes extends XmlAttributeComponent {

    constructor(properties?: AttributesProperties) {
        super({
            val: "w:val",
            color: "w:color",
            space: "w:space",
            sz: "w:sz",
            type: "w:type",
            rsidR: "w:rsidR",
            rsidRPr: "w:rsidRPr",
            rsidSect: "w:rsidSect",
            w: "w:w",
            h: "w:h",
            top: "w:top",
            right: "w:right",
            bottom: "w:bottom",
            left: "w:left",
            header: "w:header",
            footer: "w:footer",
            gutter: "w:gutter",
            linePitch: "w:linePitch"
        }, properties);
    }
}