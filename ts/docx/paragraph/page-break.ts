import {XmlComponent, Attributes, Run} from "../xml-components";

class Break implements XmlComponent {
    private br: Array<XmlComponent>;
    constructor() {
        this.br = new Array<XmlComponent>();
        this.br.push(new Attributes({
            type: "page"
        }))
    }
}

export class PageBreak extends Run {

    constructor() {
        super();
        this.r.push(new Break());
    }
}