import {XmlComponent, Attributes} from "../xml-components";

export class Bold implements XmlComponent {
    private b: Array<XmlComponent>;

    xmlKeys = {
        b: 'w:b'
    }

    constructor() {
        this.b = new Array<XmlComponent>();
        this.b.push(new Attributes({
            val: true
        }));
    }
}

export class Italics {
    private i: Array<XmlComponent>;

    xmlKeys = {
        i: 'w:i'
    }

    constructor() {
        this.i = new Array<XmlComponent>();
        this.i.push(new Attributes({
            val: true
        }));
    }
}

export class Underline {
    private u: Array<XmlComponent>;

    xmlKeys = {
        u: 'w:u'
    }

    constructor() {
        this.u = new Array<XmlComponent>();
        this.u.push(new Attributes({
            val: true
        }));
    }
}