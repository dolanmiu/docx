import {XmlComponent, Attributes} from "../xml-components";

class Border implements XmlComponent {
    private bottom: Array<XmlComponent>;

    xmlKeys = {
        bottom: 'w:bottom'
    }

    constructor() {
        this.bottom = new Array<XmlComponent>();
        this.bottom.push(new Attributes({
            color: "auto",
            space: "1",
            val: "single",
            sz: "6"
        }));
    }
}

export class ThematicBreak implements XmlComponent {
    private pBdr: Array<XmlComponent>;

    xmlKeys = {
        pBdr: 'w:pBdr'
    }
    
    constructor() {
        this.pBdr = new Array<XmlComponent>();
        this.pBdr.push(new Border());
    }
}