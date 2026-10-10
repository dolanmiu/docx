/**
 * Hyperlink module for WordprocessingML documents.
 *
 * This module provides hyperlink functionality for internal and external links.
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 *
 * @module
 */
import { createHyperlinkClick } from "@file/drawing/doc-properties/doc-properties-children";
import { DrawingLink } from "@file/drawing/doc-properties/non-visual-drawing-properties";
import { type IContext, XmlComponent } from "@file/xml-components";
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
    // The link of the pictures in an external hyperlink whose fragment is its anchor. A picture's link has no anchor, so
    // it can't use the hyperlink's relationship, which is the address without the fragment: a picture pointed at that
    // relationship opens the page but not the place in it. It is made once, with the hyperlink, so its relationship id
    // stays the same when the document is written again, and `DrawingLink` adds that relationship to each part only once
    // however many pictures the hyperlink holds
    private readonly drawingLink?: DrawingLink;

    /**
     * @param children - Inline content of the hyperlink
     * @param relationshipId - Id of the external relationship, without the rId prefix
     * @param anchor - Bookmark name or external URL fragment
     * @param externalLink - The full address of an external hyperlink, so the relationship id is kept alongside its anchor
     */
    public constructor(children: readonly ParagraphChild[], relationshipId: string, anchor?: string, externalLink?: string) {
        super("w:hyperlink");

        this.linkId = relationshipId;
        // Only a split external link needs a second relationship. Without an anchor, the hyperlink's relationship already
        // holds the full address and pictures share it, and an internal link's anchor is a bookmark, which a picture's
        // link can't point to
        this.drawingLink = anchor && externalLink !== undefined ? new DrawingLink(externalLink) : undefined;

        const props: IHyperlinkAttributesProperties = {
            history: 1,
            anchor: anchor ? anchor : undefined,
            id: !anchor || externalLink !== undefined ? `rId${this.linkId}` : undefined,
        };

        const attributes = new HyperlinkAttributes(props);
        this.root.push(attributes);
        children.forEach((child) => {
            this.root.push(child);
        });
    }

    /**
     * Creates the `a:hlinkClick` of a picture in the hyperlink, which links to the same address.
     *
     * The hyperlink decides which relationship its pictures use, rather than the pictures reading `linkId`, because only it
     * knows whether that relationship has lost the fragment to `w:anchor`. The picture's relationship is added as the
     * picture is written, through the context's relationships, so it lands in the part the picture is in, both when
     * packing and when patching.
     *
     * @param context - The context the picture is written in, whose relationships get the picture's link if it has its own
     * @param declareNamespace - Declares the DrawingML namespace, for elements outside `a:graphic` such as `wp:docPr`
     */
    public createDrawingClick(context: IContext, declareNamespace: boolean): XmlComponent {
        if (!this.drawingLink) {
            return createHyperlinkClick(this.linkId, declareNamespace);
        }
        this.drawingLink.addRelationship(context);
        return this.drawingLink.createClick(declareNamespace);
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
 * URL fragments of at most 255 UTF-16 units are written as anchors, preserving any additional # characters.
 * Longer fragments stay in the original relationship URI to avoid exceeding Word's anchor limit;
 * those links retain the existing limitations for fragments with multiple # characters.
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
