import {XmlComponent, Attributes} from "../xml-components";

export class Bold {
    private b: Array<XmlComponent>;
    
    constructor() {
        this.b = new Array<XmlComponent>();
        this.b.push(new Attributes({
            val: true
        }));
    }
}

export class Italics {
    private i: Array<XmlComponent>;
    
    constructor() {
        this.i = new Array<XmlComponent>();
        this.i.push(new Attributes({
            val: true
        }));
    }
}

export class Underline {
    private u: Array<XmlComponent>;
    
    constructor() {
        this.u = new Array<XmlComponent>();
        this.u.push(new Attributes({
            val: true
        }));
    }
}