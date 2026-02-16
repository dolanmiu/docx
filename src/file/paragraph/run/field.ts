/**
 * Field module for WordprocessingML documents.
 *
 * This module provides support for complex fields, which are regions of text
 * that can contain dynamic content such as page numbers, dates, or mail merge fields.
 * Fields are delimited by field character elements (begin, separate, end).
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Field character types that delimit field regions.
 *
 * @internal
 */
const FieldCharacterType = {
    BEGIN: "begin",
    END: "end",
    SEPARATE: "separate",
} as const;

/**
 * @internal
 */
class FidCharAttrs extends XmlAttributeComponent<{
    readonly type: (typeof FieldCharacterType)[keyof typeof FieldCharacterType];
    readonly dirty?: boolean;
}> {
    protected readonly xmlKeys = { type: "w:fldCharType", dirty: "w:dirty" };
}

/**
 * Represents the beginning of a complex field in a WordprocessingML document.
 *
 * The Begin element marks the start of a field. A field consists of a begin character,
 * field instructions, an optional separate character, field result, and an end character.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FldChar">
 *   <xsd:sequence>
 *     <xsd:element name="fldData" type="CT_Text" minOccurs="0"/>
 *     <xsd:element name="ffData" type="CT_FFData" minOccurs="0"/>
 *     <xsd:element name="numberingChange" type="CT_TrackChangeNumbering" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="fldCharType" type="ST_FldCharType" use="required"/>
 *   <xsd:attribute name="fldLock" type="s:ST_OnOff"/>
 *   <xsd:attribute name="dirty" type="s:ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Used internally by field implementations
 * new Begin();
 * ```
 */
export class Begin extends XmlComponent {
    public constructor(dirty?: boolean) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: FieldCharacterType.BEGIN, dirty }));
    }
}

/**
 * Represents the separator between field code and field result in a complex field.
 *
 * The Separate element divides the field code (instructions) from the field result
 * (the computed value). It appears between the field code and the field result.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FldChar">
 *   <xsd:attribute name="fldCharType" type="ST_FldCharType" use="required"/>
 *   <xsd:attribute name="dirty" type="s:ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Used internally by field implementations
 * new Separate();
 * ```
 */
export class Separate extends XmlComponent {
    public constructor(dirty?: boolean) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: FieldCharacterType.SEPARATE, dirty }));
    }
}

/**
 * Represents the end of a complex field in a WordprocessingML document.
 *
 * The End element marks the end of a field. Every field that begins with a Begin
 * element must be terminated with an End element.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FldChar">
 *   <xsd:attribute name="fldCharType" type="ST_FldCharType" use="required"/>
 *   <xsd:attribute name="dirty" type="s:ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Used internally by field implementations
 * new End();
 * ```
 */
export class End extends XmlComponent {
    public constructor(dirty?: boolean) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: FieldCharacterType.END, dirty }));
    }
}
