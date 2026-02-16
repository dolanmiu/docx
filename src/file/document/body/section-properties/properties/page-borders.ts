/**
 * Page borders module for WordprocessingML section properties.
 *
 * Defines borders around pages in a document section.
 *
 * Reference: http://officeopenxml.com/WPsectionBorders.php
 *
 * @module
 */
import { IBorderOptions, createBorderElement } from "@file/border";
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent } from "@file/xml-components";

/**
 * Specifies which pages display the page border.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PageBorderDisplay">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="allPages"/>
 *     <xsd:enumeration value="firstPage"/>
 *     <xsd:enumeration value="notFirstPage"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const PageBorderDisplay = {
    /** Display border on all pages */
    ALL_PAGES: "allPages",
    /** Display border only on first page */
    FIRST_PAGE: "firstPage",
    /** Display border on all pages except first page */
    NOT_FIRST_PAGE: "notFirstPage",
} as const;

/**
 * Specifies whether page border is positioned relative to page edge or text.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PageBorderOffset">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="page"/>
 *     <xsd:enumeration value="text"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const PageBorderOffsetFrom = {
    /** Position border relative to page edge */
    PAGE: "page",
    /** Position border relative to text (default) */
    TEXT: "text",
} as const;

/**
 * Specifies z-order of page border relative to intersecting objects.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PageBorderZOrder">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="front"/>
 *     <xsd:enumeration value="back"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const PageBorderZOrder = {
    /** Display border behind page contents */
    BACK: "back",
    /** Display border in front of page contents (default) */
    FRONT: "front",
} as const;

/**
 * Attributes for configuring page border behavior.
 *
 * @property display - Which pages display the border
 * @property offsetFrom - Whether border is positioned relative to page or text
 * @property zOrder - Whether border appears in front or behind page contents
 */
export type IPageBorderAttributes = {
    /** Which pages display the border */
    readonly display?: (typeof PageBorderDisplay)[keyof typeof PageBorderDisplay];
    /** Whether border is positioned relative to page or text (default: text) */
    readonly offsetFrom?: (typeof PageBorderOffsetFrom)[keyof typeof PageBorderOffsetFrom];
    /** Whether border appears in front or behind page contents (default: front) */
    readonly zOrder?: (typeof PageBorderZOrder)[keyof typeof PageBorderZOrder];
};

/**
 * Options for configuring page borders.
 *
 * @property pageBorders - General page border attributes (display, offset, z-order)
 * @property pageBorderTop - Top border styling
 * @property pageBorderRight - Right border styling
 * @property pageBorderBottom - Bottom border styling
 * @property pageBorderLeft - Left border styling
 */
export type IPageBordersOptions = {
    /** General page border attributes (display, offset, z-order) */
    readonly pageBorders?: IPageBorderAttributes;
    /** Top border styling */
    readonly pageBorderTop?: IBorderOptions;
    /** Right border styling */
    readonly pageBorderRight?: IBorderOptions;
    /** Bottom border styling */
    readonly pageBorderBottom?: IBorderOptions;
    /** Left border styling */
    readonly pageBorderLeft?: IBorderOptions;
};

class PageBordersAttributes extends XmlAttributeComponent<IPageBorderAttributes> {
    protected readonly xmlKeys = {
        display: "w:display",
        offsetFrom: "w:offsetFrom",
        zOrder: "w:zOrder",
    };
}

/**
 * Represents page borders (pgBorders) for a document section.
 *
 * This element specifies the borders to display around pages in a section,
 * including which pages display the borders and how they are positioned.
 *
 * Reference: http://officeopenxml.com/WPsectionBorders.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PageBorders">
 *   <xsd:sequence>
 *     <xsd:element name="top" type="CT_TopPageBorder" minOccurs="0"/>
 *     <xsd:element name="left" type="CT_PageBorder" minOccurs="0"/>
 *     <xsd:element name="bottom" type="CT_BottomPageBorder" minOccurs="0"/>
 *     <xsd:element name="right" type="CT_PageBorder" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="zOrder" type="ST_PageBorderZOrder" use="optional" default="front"/>
 *   <xsd:attribute name="display" type="ST_PageBorderDisplay" use="optional"/>
 *   <xsd:attribute name="offsetFrom" type="ST_PageBorderOffset" use="optional" default="text"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Add page borders to all pages
 * new PageBorders({
 *   pageBorders: {
 *     display: PageBorderDisplay.ALL_PAGES,
 *     offsetFrom: PageBorderOffsetFrom.PAGE,
 *     zOrder: PageBorderZOrder.FRONT
 *   },
 *   pageBorderTop: { style: BorderStyle.SINGLE, size: 24, color: "000000" },
 *   pageBorderBottom: { style: BorderStyle.SINGLE, size: 24, color: "000000" }
 * });
 * ```
 */
export class PageBorders extends IgnoreIfEmptyXmlComponent {
    public constructor(options?: IPageBordersOptions) {
        super("w:pgBorders");

        if (!options) {
            return this;
        }

        if (options.pageBorders) {
            this.root.push(
                new PageBordersAttributes({
                    display: options.pageBorders.display,
                    offsetFrom: options.pageBorders.offsetFrom,
                    zOrder: options.pageBorders.zOrder,
                }),
            );
        } else {
            this.root.push(new PageBordersAttributes({}));
        }

        if (options.pageBorderTop) {
            this.root.push(createBorderElement("w:top", options.pageBorderTop));
        }
        if (options.pageBorderLeft) {
            this.root.push(createBorderElement("w:left", options.pageBorderLeft));
        }
        if (options.pageBorderBottom) {
            this.root.push(createBorderElement("w:bottom", options.pageBorderBottom));
        }
        if (options.pageBorderRight) {
            this.root.push(createBorderElement("w:right", options.pageBorderRight));
        }
    }
}
