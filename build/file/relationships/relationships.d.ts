import { XmlComponent } from "../../file/xml-components";
import { Relationship, RelationshipType, TargetModeType } from "./relationship/relationship";
export declare class Relationships extends XmlComponent {
    constructor();
    addRelationship(relationship: Relationship): void;
    createRelationship(id: number | string, type: RelationshipType, target: string, targetMode?: TargetModeType): Relationship;
    get RelationshipCount(): number;
}
