import { XmlAttributeComponent } from "../../../file/xml-components";
export declare class OverrideAttributes extends XmlAttributeComponent<{
    readonly contentType: string;
    readonly partName?: string;
}> {
    protected readonly xmlKeys: {
        contentType: string;
        partName: string;
    };
}
