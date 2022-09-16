import { XmlAttributeComponent } from "@file/xml-components";

export class RelationshipAttributes extends XmlAttributeComponent<{
    readonly id: string;
    readonly type: string;
    readonly target: string;
    readonly targetMode?: string;
}> {
    protected readonly xmlKeys = {
        id: "Id",
        type: "Type",
        target: "Target",
        targetMode: "TargetMode",
    };
}
