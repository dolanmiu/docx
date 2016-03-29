export interface P {

}

interface AttributesProperties {
    val?: string;
    color?: string;
    space?: string;
    sz?: string;
}

export class Attributes implements P {
    private _attrs: Object;

    constructor(properties?: AttributesProperties) {
        this._attrs = properties
        
        if (!properties) {
            this._attrs = {};
        }
    }
}

export class ParagraphProperties implements P {
    private pPr: Array<P>;

    constructor() {
        this.pPr = new Array<P>();
        this.pPr.push(new Attributes());
    }

    push(item: P) {
        this.pPr.push(item);
    }
}

export class Run implements P {
    private r: Array<P>;

    constructor(text: string) {
        this.r = new Array<P>();
        this.r.push(new ParagraphProperties());
        this.r.push(new Text(text));
    }
}

export class Text implements P {
    private t: string;

    constructor(text: string) {
        this.t = text;
    }
}