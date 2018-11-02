import { XmlAttributeComponent } from "file/xml-components";

export interface IRelationshipAttributesProperties {
    readonly id: string;
    readonly type: string;
    readonly target: string;
    readonly targetMode?: string;
}

export class RelationshipAttributes extends XmlAttributeComponent<IRelationshipAttributesProperties> {
    protected readonly xmlKeys = {
        id: "Id",
        type: "Type",
        target: "Target",
        targetMode: "TargetMode",
    };
}
