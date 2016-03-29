import {XmlComponent, Attributes} from "../xml-components";

class Border implements XmlComponent {
    private bottom: Array<XmlComponent>;

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

export class ThematicBreak {
    private pBdr: Array<XmlComponent>;

    constructor() {
        this.pBdr = new Array<XmlComponent>();
        this.pBdr.push(new Border());
    }
}