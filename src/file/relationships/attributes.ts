import { XmlAttributeComponent } from "file/xml-components";

export interface IRelationshipsAttributesProperties {
    readonly xmlns: string;
}

export class RelationshipsAttributes extends XmlAttributeComponent<IRelationshipsAttributesProperties> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
    };
}
