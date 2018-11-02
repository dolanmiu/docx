import { Run } from "file/paragraph/run";
import { Style } from "file/paragraph/run/style";
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export interface IFootNoteReferenceRunAttributesProperties {
    readonly id: number;
}

export class FootNoteReferenceRunAttributes extends XmlAttributeComponent<IFootNoteReferenceRunAttributesProperties> {
    protected readonly xmlKeys = {
        id: "w:id",
    };
}

export class FootnoteReference extends XmlComponent {
    constructor(id: number) {
        super("w:footnoteReference");

        this.root.push(
            new FootNoteReferenceRunAttributes({
                id: id,
            }),
        );
    }
}

export class FootnoteReferenceRun extends Run {
    constructor(id: number) {
        super();

        this.properties.push(new Style("FootnoteReference"));

        this.root.push(new FootnoteReference(id));
    }
}
