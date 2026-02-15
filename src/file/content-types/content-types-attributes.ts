import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for the Types (Content Types) element.
 *
 * Defines the XML namespace for the content types part.
 *
 * @example
 * ```typescript
 * new ContentTypeAttributes({
 *   xmlns: "http://schemas.openxmlformats.org/package/2006/content-types"
 * });
 * ```
 */
export class ContentTypeAttributes extends XmlAttributeComponent<{
    /** XML namespace for content types */
    readonly xmlns?: string;
}> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
    };
}
