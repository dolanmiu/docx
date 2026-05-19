/**
 * Math Text module for Office MathML.
 *
 * This module provides the MathText class for text content within math runs.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_t-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Represents text content within a math run.
 *
 * MathText is the leaf element containing actual text characters
 * within a MathRun. It corresponds to the `<m:t>` element.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_t-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Text">
 *   <xsd:simpleContent>
 *     <xsd:extension base="s:ST_String">
 *       <xsd:attribute ref="xml:space" use="optional"/>
 *     </xsd:extension>
 *   </xsd:simpleContent>
 * </xsd:complexType>
 * ```
 */
export class MathText extends XmlComponent {
    public constructor(text: string) {
        super("m:t");

        this.root.push(text);
    }
}
