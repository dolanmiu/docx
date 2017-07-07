import { XmlAttributeComponent } from "../docx/xml-components";

export interface IRelationshipsAttributesProperties {
    xmlns: string;
}

export class RelationshipsAttributes extends XmlAttributeComponent<IRelationshipsAttributesProperties> {
    protected xmlKeys = {
        xmlns: "xmlns",
    };
}
