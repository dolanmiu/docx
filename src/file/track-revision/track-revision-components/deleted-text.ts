/**
 * Deleted text element module for track changes.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @module
 */
import { TextAttributes } from "@file/paragraph/run/text-attributes";
import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

/**
 * Represents deleted text content within a tracked deletion.
 *
 * This element contains the actual text that was deleted. Unlike regular text
 * (w:t), deleted text uses the w:delText element to distinguish it as part of
 * a deletion. The xml:space="preserve" attribute ensures whitespace is maintained.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="delText" type="CT_Text"/>
 *
 * <xsd:complexType name="CT_Text">
 *   <xsd:simpleContent>
 *     <xsd:extension base="s:ST_String">
 *       <xsd:attribute ref="xml:space" use="optional"/>
 *     </xsd:extension>
 *   </xsd:simpleContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Used internally within DeletedTextRun
 * new DeletedText("This text was removed");
 * ```
 */
export class DeletedText extends XmlComponent {
    public constructor(text: string) {
        super("w:delText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));

        this.root.push(text);
    }
}
