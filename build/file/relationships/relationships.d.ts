import { XmlComponent } from "../../file/xml-components";
import { Relationship, RelationshipType } from "./relationship/relationship";
export declare class Relationships extends XmlComponent {
    constructor();
    addRelationship(relationship: Relationship): void;
    createRelationship(id: number, type: RelationshipType, target: string): Relationship;
    readonly RelationshipCount: number;
}
