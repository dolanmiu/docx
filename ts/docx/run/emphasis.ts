import {XmlComponent, Attributes} from "../xml-components";

export class Bold extends XmlComponent {
    
    constructor() {
        super("w:b");
        this.root.push(new Attributes({
            val: true
        }));
    }
}

export class Italics extends XmlComponent {

    constructor() {
        super("w:i");
        this.root.push(new Attributes({
            val: true
        }));
    }
}

export class Underline extends XmlComponent {

    constructor() {
        super("w:u");
        this.root.push(new Attributes({
            val: true
        }));
    }
}