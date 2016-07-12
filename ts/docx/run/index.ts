import {XmlComponent, Attributes} from "../xml-components";
import {RunProperties} from "./properties";
import {Bold, Italics, Underline} from "./formatting";
import {Tab} from "./tab";
import {Break} from "./break";
import {SmallCaps, Caps} from "./caps";
import {Strike, DoubleStrike} from "./strike";
import {SubScript, SuperScript} from "./script";

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

    italic(): Run {
        this.properties.push(new Italics());
        return this;
    }

    underline(): Run {
        this.properties.push(new Underline());
        return this;
    }

    break(): Run {
        this.root.splice(1, 0, new Break());
        return this;
    }

    tab(): Run {
        this.root.splice(1, 0, new Tab());
        return this;
    }

    smallCaps(): Run {
        this.properties.push(new SmallCaps());
        return this;
    }

    allCaps(): Run {
        this.properties.push(new Caps());
        return this;
    }

    strike(): Run {
        this.properties.push(new Strike());
        return this;
    }

    doubleStrike(): Run {
        this.properties.push(new DoubleStrike());
        return this;
    }

    subScript(): Run {
        this.properties.push(new SubScript());
        return this;
    }

    superScript(): Run {
        this.properties.push(new SuperScript());
        return this;
    }
}