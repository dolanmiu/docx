/**
 * Math Text module for Office MathML.
 *
 * This module provides the MathText class for text content within math runs.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_t-1.html
 *
 * @module
 */
import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

import { TextAttributes } from "../run/text-attributes";

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

        // Spaces at either end are kept only when marked. LibreOffice drops them otherwise, and zero-width spaces too, which
        // docx/math writes in empty arguments. Spaces matter in normal text
        if (/^[\s\u200B]|[\s\u200B]$/.test(text)) {
            this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        }

        this.root.push(text);
    }
}
