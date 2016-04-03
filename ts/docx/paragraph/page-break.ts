import {XmlComponent, Attributes} from "../xml-components";
import {Run} from "../run";

class Break implements XmlComponent {
    private br: Array<XmlComponent>;

    xmlKeys = {
        br: 'w:br'
    }

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