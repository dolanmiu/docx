/**
 * Relationships module for Open Packaging Conventions.
 *
 * This module provides support for managing relationships between
 * parts in an OPC package (DOCX file).
 *
 * Reference: http://officeopenxml.com/anatomyofOOXML.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { RelationshipsAttributes } from "./attributes";
import { Relationship, RelationshipType, TargetModeType } from "./relationship/relationship";

/**
 * Represents a collection of relationships in an OPC package.
 *
 * Relationships define connections between package parts, such as
 * linking the main document to its headers, footers, images, etc.
 *
 * Reference: http://officeopenxml.com/anatomyofOOXML.php
 *
 * @example
 * ```typescript
 * const relationships = new Relationships();
 * relationships.createRelationship(
 *   1,
 *   "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
 *   "media/image1.png"
 * );
 * ```
 */
export class Relationships extends XmlComponent {
    public constructor() {
        super("Relationships");
        this.root.push(
            new RelationshipsAttributes({
                xmlns: "http://schemas.openxmlformats.org/package/2006/relationships",
            }),
        );
    }

    /**
     * Creates a new relationship to another part in the package.
     *
     * @param id - Unique identifier for this relationship (will be prefixed with "rId")
     * @param type - Relationship type URI (e.g., image, header, hyperlink)
     * @param target - Path to the target part
     * @param targetMode - Optional mode indicating if target is external
     * @returns The created Relationship instance
     */
    public createRelationship(
        id: number | string,
        type: RelationshipType,
        target: string,
        targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType],
    ): Relationship {
        const relationship = new Relationship(`rId${id}`, type, target, targetMode);
        this.root.push(relationship);

        return relationship;
    }

    /**
     * Gets the count of relationships in this collection.
     * Excludes the attributes element from the count.
     */
    public get RelationshipCount(): number {
        return this.root.length - 1;
    }
}
