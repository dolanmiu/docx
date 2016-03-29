import {P, Attributes} from "./xml-components";

class Border implements P {
    private bottom: Array<P>;

    constructor() {
        this.bottom = new Array<P>();
        this.bottom.push(new Attributes({
            color: "auto",
            space: "1",
            val: "single",
            sz: "6"
        }));
    }
}

export class ThematicBreak {
    private pBdr: Array<P>;

    constructor() {
        this.pBdr = new Array<P>();
        this.pBdr.push(new Border());
    }
}