import { XmlAttributeComponent } from "file/xml-components";

export interface IOverrideAttributes {
    readonly contentType: string;
    readonly partName?: string;
}

export class OverrideAttributes extends XmlAttributeComponent<IOverrideAttributes> {
    protected readonly xmlKeys = {
        contentType: "ContentType",
        partName: "PartName",
    };
}
