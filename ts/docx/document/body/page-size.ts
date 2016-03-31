import {XmlComponent, Attributes} from "../../xml-components";

export class PageSize {
    private pgSz: Array<XmlComponent>;

    constructor() {
        this.pgSz = new Array<XmlComponent>();
        this.pgSz.push(new Attributes({
            w: "11906",
            h: "16838"
        }));
    }
}