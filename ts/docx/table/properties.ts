import {XmlComponent, Attributes} from "../xml-components";

export class TableProperties extends XmlComponent {
    private width: PreferredTableWidth;

    constructor() {
        super('w:tblPr');
    }

    setWidth(type: string, w: string) {
        this.width = new PreferredTableWidth(type, w);
        this.root.push(this.width);
    }
}

class PreferredTableWidth extends XmlComponent {
    constructor(type: string, w: string) {
        super('w:tblW');
        this.root.push(new Attributes({
            type,
            w,
        }))
    }
}
