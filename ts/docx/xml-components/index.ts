export abstract class XmlComponent {
    protected root: Array<XmlComponent>;
    protected rootKey: string;

    constructor(rootKey: string) {
        this.root = new Array<XmlComponent>();
        this.rootKey = rootKey;
    }
}

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
}

export class Attributes extends XmlComponent {
    private _attr: Object;

    xmlKeys = {
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
    };

    constructor(properties?: AttributesProperties) {
        super("_attr");
        this._attr = properties

        if (!properties) {
            this._attr = {};
        }

        this._attr["xmlKeys"] = this.xmlKeys;
    }
}

export class Text extends XmlComponent {
    private t: string;

    xmlKeys = {
        t: 'w:t'
    }

    constructor(text: string) {
        super("w:t");
        this.t = text;
    }
}