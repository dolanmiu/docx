export interface XmlComponent {
    xmlKeys: Object;
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
    top?: string,
    right?: string,
    bottom?: string,
    left?: string,
    header?: string,
    footer?: string,
    gutter?: string,
    linePitch?: string
}

export class Attributes implements XmlComponent {
    private _attrs: Object;

    xmlKeys = {};

    constructor(properties?: AttributesProperties) {
        this._attrs = properties

        if (!properties) {
            this._attrs = {};
        }
    }
}

export class Text implements XmlComponent {
    private t: string;

    xmlKeys = {
        t: 'w:t'
    }

    constructor(text: string) {
        this.t = text;
    }
}