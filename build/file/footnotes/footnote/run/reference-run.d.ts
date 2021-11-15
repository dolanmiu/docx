import { Run } from "../../../../file/paragraph/run";
import { XmlAttributeComponent, XmlComponent } from "../../../../file/xml-components";
export declare class FootNoteReferenceRunAttributes extends XmlAttributeComponent<{
    readonly id: number;
}> {
    protected readonly xmlKeys: {
        id: string;
    };
}
export declare class FootnoteReference extends XmlComponent {
    constructor(id: number);
}
export declare class FootnoteReferenceRun extends Run {
    constructor(id: number);
}
