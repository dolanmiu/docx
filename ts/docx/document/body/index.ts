import {XmlComponent, Attributes} from "../../xml-components";
import {SectionProperties} from "./section-properties";
import {PageSize} from "./page-size";
import {PageMargin} from "./page-margin";
import {Columns} from "./columns";
import {DocumentGrid} from "./doc-grid";

export class Body {
    private body: Array<XmlComponent>;
    
    constructor() {
        this.body = new Array<XmlComponent>();
        this.body.push(new SectionProperties());
        this.body.push(new PageSize());
        this.body.push(new PageMargin());
        this.body.push(new Columns());
        this.body.push(new DocumentGrid());
    }
    
    push(component: XmlComponent) {
        this.body.push(component);
    }
}
