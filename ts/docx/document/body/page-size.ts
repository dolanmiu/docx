import {XmlComponent, Attributes} from "../../xml-components";

export class PageSize implements XmlComponent {
    private pgSz: Array<XmlComponent>;
    
    xmlKeys = {
        pgSz: 'w:pgSz'
    }

    constructor() {
        this.pgSz = new Array<XmlComponent>();
        this.pgSz.push(new Attributes({
            w: "11906",
            h: "16838"
        }));
    }
}