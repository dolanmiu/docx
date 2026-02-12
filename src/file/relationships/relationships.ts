import { XmlComponent } from "@file/xml-components";

import { RelationshipsAttributes } from "./attributes";
import { RelationshipType, TargetModeType, createRelationship } from "./relationship/relationship";

export class Relationships extends XmlComponent {
    public constructor() {
        super("Relationships");
        this.root.push(
            new RelationshipsAttributes({
                xmlns: "http://schemas.openxmlformats.org/package/2006/relationships",
            }),
        );
    }

    public addRelationship(
        id: number | string,
        type: RelationshipType,
        target: string,
        targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType],
    ): void {
        this.root.push(createRelationship(`rId${id}`, type, target, targetMode));
    }

    public get RelationshipCount(): number {
        return this.root.length - 1;
    }
}
