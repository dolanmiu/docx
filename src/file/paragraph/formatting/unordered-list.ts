import { Attributes, XmlComponent } from "@file/xml-components";

export class NumberProperties extends XmlComponent {
    public constructor(numberId: number | string, indentLevel: number) {
        super("w:numPr");
        this.root.push(new IndentLevel(indentLevel));
        this.root.push(new NumberId(numberId));
    }
}

class IndentLevel extends XmlComponent {
    public constructor(level: number) {
        super("w:ilvl");

        if (level > 9) {
            throw new Error(
                "Level cannot be greater than 9. Read more here: https://answers.microsoft.com/en-us/msoffice/forum/all/does-word-support-more-than-9-list-levels/d130fdcd-1781-446d-8c84-c6c79124e4d7",
            );
        }

        this.root.push(
            new Attributes({
                val: level,
            }),
        );
    }
}

class NumberId extends XmlComponent {
    public constructor(id: number | string) {
        super("w:numId");
        this.root.push(
            new Attributes({
                val: typeof id === "string" ? `{${id}}` : id,
            }),
        );
    }
}
