import { Attributes, XmlComponent } from "file/xml-components";

export class NumberProperties extends XmlComponent {
    constructor(numberId: number, indentLevel: number) {
        super("w:numPr");
        this.root.push(new IndentLevel(indentLevel));
        this.root.push(new NumberId(numberId));
    }
}

class IndentLevel extends XmlComponent {
    constructor(level: number) {
        super("w:ilvl");
        this.root.push(
            new Attributes({
                val: level,
            }),
        );
    }
}

class NumberId extends XmlComponent {
    constructor(id: number) {
        super("w:numId");
        this.root.push(
            new Attributes({
                val: id,
            }),
        );
    }
}
