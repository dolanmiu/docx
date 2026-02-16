import { XmlComponent } from "@file/xml-components";

import { OverrideAttributes } from "./override-attributes";

/**
 * Represents a content type override for a specific part.
 *
 * Override elements map specific part paths to MIME content types,
 * taking precedence over default extension mappings. This is used for
 * important parts like document.xml, styles.xml, etc.
 *
 * @example
 * ```typescript
 * // Override content type for the main document part
 * new Override(
 *   "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
 *   "/word/document.xml"
 * );
 *
 * // Override for a header part
 * new Override(
 *   "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
 *   "/word/header1.xml"
 * );
 * ```
 */
export class Override extends XmlComponent {
    public constructor(contentType: string, partName?: string) {
        super("Override");

        this.root.push(
            new OverrideAttributes({
                contentType: contentType,
                partName: partName,
            }),
        );
    }
}
