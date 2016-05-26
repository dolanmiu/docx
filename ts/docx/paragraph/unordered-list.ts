import {XmlComponent, Attributes} from "../xml-components";
import {Style} from "./style";

export class NumberProperties extends XmlComponent {

    constructor() {
        super("w:numPr");
        this.root.push(new IndentLevel(0));
        this.root.push(new NumberId(1));
    }
}

export class IndentLevel extends XmlComponent {

    constructor(level: number) {
        super("w:ilvl");
        this.root.push(new Attributes({
            val: level
        }));
    }
}

export class NumberId extends XmlComponent {
    constructor(id: number) {
        super("w:numId");
        this.root.push(new Attributes({
            val: id
        }));
    }
}