import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for an Override content type element.
 *
 * Defines the content type override for a specific part path.
 *
 * @example
 * ```typescript
 * new OverrideAttributes({
 *   contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
 *   partName: "/word/document.xml"
 * });
 * ```
 */
export class OverrideAttributes extends XmlAttributeComponent<{
    /** MIME content type for this specific part */
    readonly contentType: string;
    /** Full path to the part in the package (e.g., "/word/document.xml") */
    readonly partName?: string;
}> {
    protected readonly xmlKeys = {
        contentType: "ContentType",
        partName: "PartName",
    };
}
