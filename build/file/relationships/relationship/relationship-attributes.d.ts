import { XmlAttributeComponent } from "../../../file/xml-components";
export interface IRelationshipAttributesProperties {
    id: string;
    type: string;
    target: string;
}
export declare class RelationshipAttributes extends XmlAttributeComponent<IRelationshipAttributesProperties> {
    protected xmlKeys: {
        id: string;
        type: string;
        target: string;
    };
}
