import {XmlComponent, Attributes} from "../xml-components";
import {RunProperties} from "./properties";
import {Bold, Italics, Underline} from "../../styles/formatting/run";

export class Run extends XmlComponent {
    private properties: RunProperties;
    

    constructor() {
        super("w:r");
        this.properties = new RunProperties();
        this.root.push(this.properties);
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