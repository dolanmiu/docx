/**
 * Break module for WordprocessingML documents.
 *
 * This module provides support for line breaks within a run. A break element
 * represents a line break (line feed) within text content.
 *
 * Reference: http://officeopenxml.com/WPtextSpecialContent-break.php
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Br">
 *   <xsd:attribute name="type" type="ST_BrType" use="optional"/>
 *   <xsd:attribute name="clear" type="ST_BrClear" use="optional"/>
 * </xsd:complexType>
 *
 * <xsd:simpleType name="ST_BrType">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="page"/>
 *     <xsd:enumeration value="column"/>
 *     <xsd:enumeration value="textWrapping"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 *
 * <xsd:simpleType name="ST_BrClear">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="none"/>
 *     <xsd:enumeration value="left"/>
 *     <xsd:enumeration value="right"/>
 *     <xsd:enumeration value="all"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Creates a line break element for a WordprocessingML document.
 *
 * The Break element inserts a line break (carriage return/line feed) within a run.
 * This forces text to continue on the next line without starting a new paragraph.
 *
 * Reference: http://officeopenxml.com/WPtextSpecialContent-break.php
 *
 * @example
 * ```typescript
 * // Add line breaks in a run
 * new Run({
 *   children: [
 *     "First line",
 *     createBreak(),
 *     "Second line",
 *     createBreak(),
 *     "Third line",
 *   ],
 * });
 * ```
 */
export const createBreak = (): XmlComponent =>
    new BuilderElement({
        name: "w:br",
    });
