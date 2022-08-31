import { XmlComponent } from "@file/xml-components";
import { RelationshipsAttributes } from "./attributes";
import { Relationship, RelationshipType, TargetModeType } from "./relationship/relationship";

export class Relationships extends XmlComponent {
    public constructor() {
        super("Relationships");
        this.root.push(
            new RelationshipsAttributes({
                xmlns: "http://schemas.openxmlformats.org/package/2006/relationships",
            }),
        );
    }

    public addRelationship(relationship: Relationship): void {
        this.root.push(relationship);
    }

    public createRelationship(id: number | string, type: RelationshipType, target: string, targetMode?: TargetModeType): Relationship {
        const relationship = new Relationship(`rId${id}`, type, target, targetMode);
        this.addRelationship(relationship);

        return relationship;
    }

    public get RelationshipCount(): number {
        return this.root.length - 1;
    }
}
