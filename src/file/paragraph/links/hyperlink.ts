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

import type { ParagraphChild } from "../paragraph";
import { HyperlinkAttributes, type IHyperlinkAttributesProperties } from "./hyperlink-attributes";

/**
 * Hyperlink type enumeration.
 *
 * Defines the types of hyperlinks supported in WordprocessingML documents.
 *
 * @publicApi
 */
export const HyperlinkType = {
    /** Internal hyperlink to a bookmark within the document */
    INTERNAL: "INTERNAL",
    /** External hyperlink to a URL outside the document */
    EXTERNAL: "EXTERNAL",
} as const;

/**
 * Options for creating an internal hyperlink.
 *
 * @property children - Array of paragraph children (usually TextRun elements) that form the hyperlink text
 * @property anchor - Name of the bookmark to link to within the document
 */
export type IInternalHyperlinkOptions = {
    /** Array of paragraph children that form the hyperlink text */
    readonly children: readonly ParagraphChild[];
    /** Name of the bookmark to link to within the document */
    readonly anchor: string;
};

/**
 * Options for creating an external hyperlink.
 *
 * @property children - Array of paragraph children (usually TextRun elements) that form the hyperlink text
 * @property link - URL to link to outside the document
 */
export type IExternalHyperlinkOptions = {
    /** Array of paragraph children that form the hyperlink text */
    readonly children: readonly ParagraphChild[];
    /** URL to link to outside the document */
    readonly link: string;
};

/**
 * Represents a concrete hyperlink in a WordprocessingML document.
 *
 * This class is the low-level implementation of hyperlinks used internally.
 * Use InternalHyperlink or ExternalHyperlink for creating hyperlinks in documents.
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="hyperlink" type="CT_Hyperlink"/>
 *
 * <xsd:complexType name="CT_Hyperlink">
 *   <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   <xsd:attribute name="tgtFrame" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="tooltip" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="docLocation" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="history" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="anchor" type="s:ST_String" use="optional"/>
 *   <xsd:attribute ref="r:id"/>
 * </xsd:complexType>
 * ```
 */
export class ConcreteHyperlink extends XmlComponent {
    public readonly linkId: string;

    /**
     * @param children - Inline content of the hyperlink
     * @param relationshipId - Id of the external relationship, without the rId prefix
     * @param anchor - Bookmark name or external URL fragment
     * @param external - Keep the relationship id when an external hyperlink also has an anchor
     */
    public constructor(children: readonly ParagraphChild[], relationshipId: string, anchor?: string, external: boolean = false) {
        super("w:hyperlink");

        this.linkId = relationshipId;

        const props: IHyperlinkAttributesProperties = {
            history: 1,
            anchor: anchor ? anchor : undefined,
            id: !anchor || external ? `rId${this.linkId}` : undefined,
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
 * Internal hyperlinks use the anchor attribute to reference a bookmark by name.
 * The bookmark must exist in the document for the hyperlink to function.
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="hyperlink" type="CT_Hyperlink"/>
 *
 * <xsd:complexType name="CT_Hyperlink">
 *   <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   <xsd:attribute name="anchor" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="history" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a bookmark
 * new Bookmark({
 *   id: "section1",
 *   children: [new TextRun("Section 1")],
 * });
 *
 * // Link to the bookmark
 * new InternalHyperlink({
 *   children: [new TextRun({ text: "Go to Section 1", style: "Hyperlink" })],
 *   anchor: "section1",
 * });
 * ```
 */
export class InternalHyperlink extends ConcreteHyperlink {
    public constructor(options: IInternalHyperlinkOptions) {
        super(options.children, uniqueId(), options.anchor);
    }
}

/**
 * Represents an external hyperlink to a URL outside the document.
 *
 * External hyperlinks create a relationship to an external resource (URL).
 * The relationship is created during document preparation and the hyperlink
 * is converted to a ConcreteHyperlink with the relationship ID.
 * URL fragments are written as anchors, preserving any additional # characters.
 * Word appends the anchor to the relationship target as described in MS-OI29500 §17.16.22:
 * https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/df06e423-11a6-4a36-bfb3-82139e531781
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="hyperlink" type="CT_Hyperlink"/>
 *
 * <xsd:complexType name="CT_Hyperlink">
 *   <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   <xsd:attribute ref="r:id"/>
 *   <xsd:attribute name="history" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="anchor" type="s:ST_String" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new ExternalHyperlink({
 *   children: [new TextRun({ text: "Visit Example", style: "Hyperlink" })],
 *   link: "https://example.com",
 * });
 * ```
 */
export class ExternalHyperlink extends XmlComponent {
    public constructor(public readonly options: IExternalHyperlinkOptions) {
        super("w:externalHyperlink");
    }
}
