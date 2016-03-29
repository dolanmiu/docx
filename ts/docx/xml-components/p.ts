export interface P {

}

export class Attributes implements P {
    private _attrs: Object;

    constructor(value?: string) {
        this._attrs = {
            val: value
        };
    }
}

export class ParagraphProperties implements P{
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