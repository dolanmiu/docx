import { XmlAttributeComponent } from "../../../file/xml-components";
export declare class RelationshipAttributes extends XmlAttributeComponent<{
    readonly id: string;
    readonly type: string;
    readonly target: string;
    readonly targetMode?: string;
}> {
    protected readonly xmlKeys: {
        id: string;
        type: string;
        target: string;
        targetMode: string;
    };
}
