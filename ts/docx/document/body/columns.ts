import {XmlComponent, Attributes} from "../../xml-components";

export class Columns implements XmlComponent {
    private cols: Array<XmlComponent>;
    
    xmlKeys = {
        cols: 'w:cols'
    }

    constructor() {
        this.cols = new Array<XmlComponent>();
        this.cols.push(new Attributes({
            space: "708"
        }));
    }
}