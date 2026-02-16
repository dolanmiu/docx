import { Run } from "@file/paragraph/run";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export class EndnoteReferenceRunAttributes extends XmlAttributeComponent<{
    readonly id: number;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
    };
}

export class EndnoteIdReference extends XmlComponent {
    public constructor(id: number) {
        super("w:endnoteReference");

        this.root.push(
            new EndnoteReferenceRunAttributes({
                id: id,
            }),
        );
    }
}

export class EndnoteReferenceRun extends Run {
    public constructor(id: number) {
        super({ style: "EndnoteReference" });

        this.root.push(new EndnoteIdReference(id));
    }
}
