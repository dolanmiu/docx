import { Run } from "file/paragraph/run";
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
export interface IFootNoteReferenceRunAttributesProperties {
    id: number;
}
export declare class FootNoteReferenceRunAttributes extends XmlAttributeComponent<IFootNoteReferenceRunAttributesProperties> {
    protected xmlKeys: {
        id: string;
    };
}
export declare class FootnoteReference extends XmlComponent {
    constructor(id: number);
}
export declare class FootnoteReferenceRun extends Run {
    constructor(id: number);
}
