/**
 * Hyperlink module for WordprocessingML documents.
 *
 * This module provides hyperlink functionality for internal and external links.
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";
import { uniqueId } from "@util/convenience-functions";

import { ParagraphChild } from "../paragraph";
import { HyperlinkAttributes, IHyperlinkAttributesProperties } from "./hyperlink-attributes";

/**
 * Hyperlink type enumeration.
 */
export const HyperlinkType = {
    /** Internal hyperlink to a bookmark within the document */
    INTERNAL: "INTERNAL",
    /** External hyperlink to a URL outside the document */
    EXTERNAL: "EXTERNAL",
} as const;

/**
 * Represents a hyperlink in a WordprocessingML document.
 *
 * The hyperlink element specifies a hyperlink that can be either internal
 * (to a bookmark) or external (to a URL).
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 */
export class ConcreteHyperlink extends XmlComponent {
    public readonly linkId: string;

    public constructor(children: readonly ParagraphChild[], relationshipId: string, anchor?: string) {
        super("w:hyperlink");

        this.linkId = relationshipId;

        const props: IHyperlinkAttributesProperties = {
            history: 1,
            anchor: anchor ? anchor : undefined,
            id: !anchor ? `rId${this.linkId}` : undefined,
        };

        const attributes = new HyperlinkAttributes(props);
        this.root.push(attributes);
        children.forEach((child) => {
            this.root.push(child);
        });
    }
}

/**
 * Represents an internal hyperlink to a bookmark within the document.
 *
 * @example
 * ```typescript
 * new InternalHyperlink({
 *   children: [new TextRun("Go to Section 1")],
 *   anchor: "section1",
 * });
 * ```
 */
export class InternalHyperlink extends ConcreteHyperlink {
    public constructor(options: { readonly children: readonly ParagraphChild[]; readonly anchor: string }) {
        super(options.children, uniqueId(), options.anchor);
    }
}

/**
 * Represents an external hyperlink to a URL outside the document.
 *
 * @example
 * ```typescript
 * new ExternalHyperlink({
 *   children: [new TextRun("Visit Example")],
 *   link: "https://example.com",
 * });
 * ```
 */
export class ExternalHyperlink extends XmlComponent {
    public constructor(
        public readonly options: {
            readonly children: readonly ParagraphChild[];
            readonly link: string;
        },
    ) {
        super("w:externalHyperlink");
    }
}
