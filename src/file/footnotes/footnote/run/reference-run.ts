import { Run } from "@file/paragraph/run";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export class FootNoteReferenceRunAttributes extends XmlAttributeComponent<{
    readonly id: number;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
    };
}

export class FootnoteReference extends XmlComponent {
    public constructor(id: number) {
        super("w:footnoteReference");

        this.root.push(
            new FootNoteReferenceRunAttributes({
                id: id,
            }),
        );
    }
}

export class FootnoteReferenceRun extends Run {
    public constructor(id: number) {
        super({ style: "FootnoteReference" });

        this.root.push(new FootnoteReference(id));
    }
}
