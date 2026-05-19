import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for the Relationships element.
 *
 * Defines the XML namespace for the relationships part.
 *
 * @example
 * ```typescript
 * new RelationshipsAttributes({
 *   xmlns: "http://schemas.openxmlformats.org/package/2006/relationships"
 * });
 * ```
 */
export class RelationshipsAttributes extends XmlAttributeComponent<{
    /** XML namespace for relationships */
    readonly xmlns: string;
}> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
    };
}
