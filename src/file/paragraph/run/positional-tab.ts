/**
 * Positional tab module for WordprocessingML documents.
 *
 * This module provides support for positional tabs, which are absolute position
 * tab stops used primarily in paragraphs with bidirectional text.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Positional tab alignment types.
 *
 * Specifies how text is aligned at the positional tab stop.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PTabAlignment">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="left" />
 *     <xsd:enumeration value="center" />
 *     <xsd:enumeration value="right" />
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const PositionalTabAlignment = {
    /** Left-aligned tab */
    LEFT: "left",
    /** Center-aligned tab */
    CENTER: "center",
    /** Right-aligned tab */
    RIGHT: "right",
} as const;

/**
 * Positional tab relative positioning types.
 *
 * Specifies what the positional tab position is relative to.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PTabRelativeTo">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="margin" />
 *     <xsd:enumeration value="indent" />
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const PositionalTabRelativeTo = {
    /** Position relative to margin */
    MARGIN: "margin",
    /** Position relative to indent */
    INDENT: "indent",
} as const;

/**
 * Positional tab leader character types.
 *
 * Specifies the character used to fill the space before the tab.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_PTabLeader">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="none" />
 *     <xsd:enumeration value="dot" />
 *     <xsd:enumeration value="hyphen" />
 *     <xsd:enumeration value="underscore" />
 *     <xsd:enumeration value="middleDot" />
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const PositionalTabLeader = {
    /** No leader character */
    NONE: "none",
    /** Dot leader (...) */
    DOT: "dot",
    /** Hyphen leader (---) */
    HYPHEN: "hyphen",
    /** Underscore leader (___) */
    UNDERSCORE: "underscore",
    /** Middle dot leader (···) */
    MIDDLE_DOT: "middleDot",
} as const;

/**
 * Options for creating a PositionalTab.
 *
 * @property alignment - How text is aligned at the tab stop
 * @property relativeTo - What the tab position is relative to
 * @property leader - Character used to fill space before the tab
 */
export type PositionalTabOptions = {
    /** How text is aligned at the tab stop */
    readonly alignment: (typeof PositionalTabAlignment)[keyof typeof PositionalTabAlignment];
    /** What the tab position is relative to */
    readonly relativeTo: (typeof PositionalTabRelativeTo)[keyof typeof PositionalTabRelativeTo];
    /** Character used to fill space before the tab */
    readonly leader: (typeof PositionalTabLeader)[keyof typeof PositionalTabLeader];
};

/**
 * Creates a positional tab element for a WordprocessingML document.
 *
 * A positional tab is an absolute position tab stop that is typically used
 * in bidirectional text scenarios. Unlike normal tabs, positional tabs specify
 * an exact alignment and position within the paragraph.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PTab">
 *   <xsd:attribute name="alignment" type="ST_PTabAlignment" use="required" />
 *   <xsd:attribute name="relativeTo" type="ST_PTabRelativeTo" use="required" />
 *   <xsd:attribute name="leader" type="ST_PTabLeader" use="required" />
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a centered positional tab
 * createPositionalTab({
 *   alignment: PositionalTabAlignment.CENTER,
 *   relativeTo: PositionalTabRelativeTo.MARGIN,
 *   leader: PositionalTabLeader.DOT,
 * });
 * ```
 */
export const createPositionalTab = (options: PositionalTabOptions): XmlComponent =>
    new BuilderElement<PositionalTabOptions>({
        name: "w:ptab",
        attributes: {
            alignment: { key: "w:alignment", value: options.alignment },
            relativeTo: { key: "w:relativeTo", value: options.relativeTo },
            leader: { key: "w:leader", value: options.leader },
        },
    });
