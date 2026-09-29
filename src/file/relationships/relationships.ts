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
import { type RelationshipType, type TargetModeType, createRelationship } from "./relationship/relationship";

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
 * relationships.addRelationship(
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
     */
    public addRelationship(
        id: number | string,
        type: RelationshipType,
        target: string,
        targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType],
    ): void {
        this.root.push(createRelationship(`rId${id}`, type, target, targetMode));
    }

    /**
     * Creates a copy of these relationships. Relationships added to the copy aren't added to these, so the compiler
     * adds the ones it writes for a part, such as to its images, to a copy, and packing a document again doesn't add
     * them a second time.
     */
    public copy(): Relationships {
        const copy = new Relationships();
        copy.root.push(...this.root.slice(1));
        return copy;
    }

    /**
     * Gets the count of relationships in this collection.
     * Excludes the attributes element from the count.
     */
    public get RelationshipCount(): number {
        return this.root.length - 1;
    }
}
