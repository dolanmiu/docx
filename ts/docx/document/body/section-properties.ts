import {XmlComponent, Attributes} from "../../xml-components";
import {PageSize} from "./page-size";
import {PageMargin} from "./page-margin";
import {Columns} from "./columns";
import {DocumentGrid} from "./doc-grid";

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
        this.sectPr.push(new PageSize());
        this.sectPr.push(new PageMargin());
        this.sectPr.push(new Columns());
        this.sectPr.push(new DocumentGrid());
    }
}