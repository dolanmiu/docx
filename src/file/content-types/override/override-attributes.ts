import { XmlAttributeComponent } from "file/xml-components";

export interface IOverrideAttributes {
    contentType: string;
    partName?: string;
}

export class OverrideAttributes extends XmlAttributeComponent<IOverrideAttributes> {
    protected xmlKeys = {
        contentType: "ContentType",
        partName: "PartName",
    };
}
