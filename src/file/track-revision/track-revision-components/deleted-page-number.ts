/**
 * Deleted instruction text elements for field codes in track changes.
 *
 * Provides deleted versions of page number and page count field instructions.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @module
 */
import { TextAttributes } from "@file/paragraph/run/text-attributes";
import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

/**
 * Represents a deleted PAGE field instruction.
 *
 * This element contains the field instruction code for the current page number
 * within a deletion. Uses w:delInstrText instead of w:instrText to mark it as
 * part of a tracked deletion.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="delInstrText" type="CT_Text"/>
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
 * // Used internally within DeletedTextRun for page number fields
 * new DeletedPage(); // Creates <w:delInstrText>PAGE</w:delInstrText>
 * ```
 */
export class DeletedPage extends XmlComponent {
    public constructor() {
        super("w:delInstrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("PAGE");
    }
}

/**
 * Represents a deleted NUMPAGES field instruction.
 *
 * This element contains the field instruction code for the total number of pages
 * in the document within a deletion. Uses w:delInstrText instead of w:instrText
 * to mark it as part of a tracked deletion.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="delInstrText" type="CT_Text"/>
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
 * // Used internally within DeletedTextRun for total pages field
 * new DeletedNumberOfPages(); // Creates <w:delInstrText>NUMPAGES</w:delInstrText>
 * ```
 */
export class DeletedNumberOfPages extends XmlComponent {
    public constructor() {
        super("w:delInstrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("NUMPAGES");
    }
}

/**
 * Represents a deleted SECTIONPAGES field instruction.
 *
 * This element contains the field instruction code for the total number of pages
 * in the current section within a deletion. Uses w:delInstrText instead of
 * w:instrText to mark it as part of a tracked deletion.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="delInstrText" type="CT_Text"/>
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
 * // Used internally within DeletedTextRun for section pages field
 * new DeletedNumberOfPagesSection(); // Creates <w:delInstrText>SECTIONPAGES</w:delInstrText>
 * ```
 */
export class DeletedNumberOfPagesSection extends XmlComponent {
    public constructor() {
        super("w:delInstrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("SECTIONPAGES");
    }
}
