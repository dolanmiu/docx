import { XmlComponent } from "@file/xml-components";

import { DefaultAttributes } from "./default-attributes";

/**
 * Represents a default content type mapping by file extension.
 *
 * Default elements map file extensions (e.g., "png", "xml") to MIME content types.
 * This tells the package reader what type of content to expect for files with
 * a given extension.
 *
 * @example
 * ```typescript
 * // Map .png files to image/png content type
 * new Default("image/png", "png");
 *
 * // Map .xml files to application/xml content type
 * new Default("application/xml", "xml");
 * ```
 */
export class Default extends XmlComponent {
    public constructor(contentType: string, extension?: string) {
        super("Default");

        this.root.push(
            new DefaultAttributes({
                contentType: contentType,
                extension: extension,
            }),
        );
    }
}
