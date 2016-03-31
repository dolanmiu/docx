import {XmlComponent, Attributes} from "../../xml-components";

export class SectionProperties {
    private sectPr: Array<XmlComponent>;
    
    constructor() {
        this.sectPr = new Array<XmlComponent>();
        this.sectPr.push(new Attributes({
            rsidR: "00B64E8F",
            rsidRPr: "00D842E4",
            rsidSect: "000A6AD0"
        }));
    }
}