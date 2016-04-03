import {XmlComponent, Attributes} from "../xml-components";
import {RunProperties} from "./properties";
import {Bold, Italics, Underline} from "./emphasis";

export class Run implements XmlComponent {
    protected r: Array<XmlComponent>;
    private properties: RunProperties;
    
    xmlKeys = {
        r: 'w:r'
    }

    constructor() {
        this.r = new Array<XmlComponent>();
        this.properties = new RunProperties();
        this.r.push(this.properties);
    }

    bold(): Run {
        this.properties.push(new Bold());
        return this;
    }

    italics(): Run {
        this.properties.push(new Italics());
        return this;
    }

    underline(): Run {
        this.properties.push(new Underline());
        return this;
    }
}