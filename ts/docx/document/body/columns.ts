import {XmlComponent, Attributes} from "../../xml-components";

export class Columns {
    private cols: Array<XmlComponent>;

    constructor() {
        this.cols = new Array<XmlComponent>();
        this.cols.push(new Attributes({
            space: "708"
        }));
    }
}