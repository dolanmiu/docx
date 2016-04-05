import {XmlComponent, Attributes} from "../../xml-components";

export class SectionProperties implements XmlComponent {
    private sectPr: Array<XmlComponent>;
    
    xmlKeys = {
        sectPr: 'w:sectPr'
    }
    
    constructor() {
        this.sectPr = new Array<XmlComponent>();
        this.sectPr.push(new Attributes({
            rsidR: "00B64E8F",
            rsidRPr: "00D842E4",
            rsidSect: "000A6AD0"
        }));
    }
}