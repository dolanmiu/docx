import { BuilderElement, type XmlComponent } from "@file/xml-components";

type IOverrideAttributes = {
    readonly contentType: string;
    readonly partName?: string;
};

/**
 * Creates a content type override for a specific part.
 *
 * Override elements map specific part paths to MIME content types,
 * taking precedence over default extension mappings. This is used for
 * important parts like document.xml, styles.xml, etc.
 *
 * @example
 * ```typescript
 * // Override content type for the main document part
 * createOverride(
 *   "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
 *   "/word/document.xml"
 * );
 *
 * // Override for a header part
 * createOverride(
 *   "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
 *   "/word/header1.xml"
 * );
 * ```
 */
export const createOverride = (contentType: string, partName?: string): XmlComponent =>
    new BuilderElement<IOverrideAttributes>({
        name: "Override",
        attributes: {
            contentType: { key: "ContentType", value: contentType },
            partName: { key: "PartName", value: partName },
        },
    });
