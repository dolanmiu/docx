import { XmlAttributeComponent } from "../docx/xml-components";

interface IRelationshipsAttributesProperties {
    xmlns: string;
}

export class RelationshipsAttributes extends XmlAttributeComponent<IRelationshipsAttributesProperties> {
    protected xmlKeys = {
        xmlns: "xmlns",
    };
}
