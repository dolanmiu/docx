export interface XmlComponent {

}

interface AttributesProperties {
    val?: string;
    color?: string;
    space?: string;
    sz?: string;
}

export class Attributes implements XmlComponent {
    private _attrs: Object;

    constructor(properties?: AttributesProperties) {
        this._attrs = properties

        if (!properties) {
            this._attrs = {};
        }
    }
}

export class ParagraphProperties implements XmlComponent {
    private pPr: Array<XmlComponent>;

    constructor() {
        this.pPr = new Array<XmlComponent>();
        this.pPr.push(new Attributes());
    }

    push(item: XmlComponent) {
        this.pPr.push(item);
    }
}

export class Run implements XmlComponent {
    private r: Array<XmlComponent>;

    constructor(text: string) {
        this.r = new Array<XmlComponent>();
        this.r.push(new ParagraphProperties());
        this.r.push(new Text(text));
    }
}

export class Text implements XmlComponent {
    private t: string;

    constructor(text: string) {
        this.t = text;
    }
}