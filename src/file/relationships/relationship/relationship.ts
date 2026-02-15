import { XmlComponent } from "@file/xml-components";

import { RelationshipAttributes } from "./relationship-attributes";

/**
 * Supported relationship type URIs.
 *
 * These URIs define the type of relationship between parts in an OPC package.
 * Each type corresponds to a specific kind of document component or resource.
 */
export type RelationshipType =
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    | "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/font";

/**
 * Target mode types for relationships.
 *
 * Indicates whether a relationship target is external to the package.
 */
export const TargetModeType = {
    /** Target is external to the package (e.g., hyperlink to a URL) */
    EXTERNAL: "External",
} as const;

/**
 * Represents a single relationship between parts in an OPC package.
 *
 * A relationship defines a typed connection from a source part to a target part,
 * identified by a unique ID within the relationships collection.
 *
 * @example
 * ```typescript
 * // Internal relationship to an image
 * new Relationship("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", "media/image1.png");
 *
 * // External relationship to a hyperlink
 * new Relationship("rId2", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", "https://example.com", TargetModeType.EXTERNAL);
 * ```
 */
export class Relationship extends XmlComponent {
    public constructor(
        id: string,
        type: RelationshipType,
        target: string,
        targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType],
    ) {
        super("Relationship");

        this.root.push(
            new RelationshipAttributes({
                id,
                type,
                target,
                targetMode,
            }),
        );
    }
}
