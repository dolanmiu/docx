import { BuilderElement, type XmlComponent } from "@file/xml-components";

type IDefaultAttributes = {
    readonly contentType: string;
    readonly extension?: string;
};

/**
 * Creates a default content type mapping by file extension.
 *
 * Default elements map file extensions (e.g., "png", "xml") to MIME content types.
 * This tells the package reader what type of content to expect for files with
 * a given extension.
 *
 * @example
 * ```typescript
 * // Map .png files to image/png content type
 * createDefault("image/png", "png");
 *
 * // Map .xml files to application/xml content type
 * createDefault("application/xml", "xml");
 * ```
 */
export const createDefault = (contentType: string, extension?: string): XmlComponent =>
    new BuilderElement<IDefaultAttributes>({
        name: "Default",
        attributes: {
            contentType: { key: "ContentType", value: contentType },
            extension: { key: "Extension", value: extension },
        },
    });
