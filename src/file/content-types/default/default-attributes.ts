import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for a Default content type element.
 *
 * Defines the mapping between a file extension and its MIME content type.
 *
 * @example
 * ```typescript
 * new DefaultAttributes({
 *   contentType: "image/png",
 *   extension: "png"
 * });
 * ```
 */
export class DefaultAttributes extends XmlAttributeComponent<{
    /** MIME content type for files with this extension */
    readonly contentType: string;
    /** File extension (without the dot) */
    readonly extension?: string;
}> {
    protected readonly xmlKeys = {
        contentType: "ContentType",
        extension: "Extension",
    };
}
