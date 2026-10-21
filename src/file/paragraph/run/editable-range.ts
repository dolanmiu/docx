/**
 * Editable range module for WordprocessingML documents.
 *
 * An editable range is a part of a protected document that anyone can still change, as Word's Restrict Editing
 * exceptions for "Everyone" are. It runs from an `EditableRangeStart` to the `EditableRangeEnd` with the same id,
 * which can be in a later paragraph.
 *
 * Reference: ISO/IEC 29500-1 17.13.7 (permStart and permEnd)
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * @internal
 */
class EditableRangeStartAttributes extends XmlAttributeComponent<{ readonly id: number; readonly editorGroup: string }> {
    protected readonly xmlKeys = { id: "w:id", editorGroup: "w:edGrp" };
}

/**
 * @internal
 */
class EditableRangeEndAttributes extends XmlAttributeComponent<{ readonly id: number }> {
    protected readonly xmlKeys = { id: "w:id" };
}

/**
 * Represents the start of an editable range: where a part of a protected document that anyone can change begins.
 *
 * It must be paired with an `EditableRangeEnd` with the same id, which can be in the same paragraph or a later one.
 * The id must be different from every other editable range's. The document's `protection` option protects the rest.
 *
 * Reference: ISO/IEC 29500-1 17.13.7.3 (permStart)
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PermStart">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_Perm">
 *       <xsd:attribute name="edGrp" type="ST_EdGrp" use="optional"/>
 *       <xsd:attribute name="ed" type="s:ST_String" use="optional"/>
 *       <xsd:attribute name="colFirst" type="ST_DecimalNumber" use="optional"/>
 *       <xsd:attribute name="colLast" type="ST_DecimalNumber" use="optional"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   children: [new TextRun("Name: "), new EditableRangeStart(1), new TextRun("type your name"), new EditableRangeEnd(1)],
 * });
 * ```
 */
export class EditableRangeStart extends XmlComponent {
    // Only in the type: with no members of its own, any component, such as a Paragraph, would type check as one
    declare private readonly brand: "EditableRangeStart";

    public constructor(id: number) {
        super("w:permStart");

        this.root.push(new EditableRangeStartAttributes({ id, editorGroup: "everyone" }));
    }
}

/**
 * Represents the end of an editable range, which `EditableRangeStart` with the same id begins.
 *
 * Reference: ISO/IEC 29500-1 17.13.7.2 (permEnd)
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Perm">
 *   <xsd:attribute name="id" type="s:ST_String" use="required"/>
 *   <xsd:attribute name="displacedByCustomXml" type="ST_DisplacedByCustomXml" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new EditableRangeEnd(1);
 * ```
 */
export class EditableRangeEnd extends XmlComponent {
    // Only in the type: with no members of its own, any component, such as a Paragraph, would type check as one
    declare private readonly brand: "EditableRangeEnd";

    public constructor(id: number) {
        super("w:permEnd");

        this.root.push(new EditableRangeEndAttributes({ id }));
    }
}
