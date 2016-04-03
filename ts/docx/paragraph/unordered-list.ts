import {XmlComponent, Attributes} from "../xml-components";
import {Style} from "./style";

export class NumberProperties implements XmlComponent {
    private numPr: Array<XmlComponent>;

    xmlKeys = {
        numPr: 'w:numPr'
    }

    constructor() {
        this.numPr = new Array<XmlComponent>();
        this.numPr.push(new IndentLevel(0));
        this.numPr.push(new NumberId(1));
    }
}

export class IndentLevel implements XmlComponent {
    private ilvl: Array<XmlComponent>;

    xmlKeys = {
        ilvl: 'w:ilvl'
    }

    constructor(level: number) {
        this.ilvl = new Array<XmlComponent>();
        this.ilvl.push(new Attributes({
            val: level
        }));
    }
}

export class NumberId implements XmlComponent {
    private ilvl: Array<XmlComponent>;

    xmlKeys = {
        ilvl: 'w:ilvl'
    }

    constructor(id: number) {
        this.ilvl = new Array<XmlComponent>();
        this.ilvl.push(new Attributes({
            val: id
        }));
    }
}