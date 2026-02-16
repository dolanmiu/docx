import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for a Relationship element.
 *
 * Defines the properties of a single relationship between package parts.
 *
 * @example
 * ```typescript
 * new RelationshipAttributes({
 *   id: "rId1",
 *   type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
 *   target: "media/image1.png"
 * });
 * ```
 */
export class RelationshipAttributes extends XmlAttributeComponent<{
    /** Unique identifier for this relationship (e.g., "rId1") */
    readonly id: string;
    /** Relationship type URI defining the kind of relationship */
    readonly type: string;
    /** Path to the target part or URI for external targets */
    readonly target: string;
    /** Optional mode indicating if target is external to the package */
    readonly targetMode?: string;
}> {
    protected readonly xmlKeys = {
        id: "Id",
        type: "Type",
        target: "Target",
        targetMode: "TargetMode",
    };
}
