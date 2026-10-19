/**
 * Simple field module for WordprocessingML documents.
 *
 * This module provides support for simple fields, which are self-contained field
 * elements that include both the field code and optional cached result in a single element.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_fldSimple-1.html
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @module
 */
import { SpaceType } from "@file/shared";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { createBegin, createEnd } from "./field";
import { TextAttributes } from "./text-attributes";
import { TextRun } from "./text-run";

/**
 * The fields that mark a place in the document and have no result: index entries (`XE`), table of contents entries
 * (`TC`), table of authorities entries (`TA`), referenced documents (`RD`) and `PRIVATE`. Word misreads them as a
 * `w:fldSimple`, moving the text around them to other places in the document, so they are written as a complex field.
 */
const MARKER_FIELD = /^\s*(?:XE|TC|TA|RD|PRIVATE)\b/i;

/**
 * @internal
 */
class FieldInstructionText extends XmlComponent {
    public constructor(instruction: string) {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push(instruction);
    }
}

/**
 * @internal
 */
class FldSimpleAttrs extends XmlAttributeComponent<{ readonly instr: string; readonly fldLock?: boolean }> {
    protected readonly xmlKeys = { instr: "w:instr", fldLock: "w:fldLock" };
}

/**
 * Options for a simple field.
 */
export type ISimpleFieldOptions = {
    /** Locks the field so Word keeps the cached value when fields are updated. Not locked by default. */
    readonly locked?: boolean;
};

/**
 * Represents a simple field in a WordprocessingML document.
 *
 * A simple field (fldSimple) contains both the field code and the optional cached value
 * in a single element, unlike complex fields which use separate begin/end markers.
 * Simple fields are typically used for fields that don't require complex nesting.
 *
 * Fields that mark a place and have no result, such as an index entry (`XE`) or a table of contents entry (`TC`), are
 * written as a complex field in a run (`w:r`), as Word writes them, because Word moves the text around them when it
 * reads them as a `w:fldSimple`. They have no cached value, so one given isn't written.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_fldSimple-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SimpleField">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="instr" type="s:ST_String" use="required"/>
 *   <xsd:attribute name="fldLock" type="s:ST_OnOff"/>
 *   <xsd:attribute name="dirty" type="s:ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Simple field with instruction
 * new SimpleField("DATE");
 *
 * // Simple field with cached value
 * new SimpleField("DATE", "2024-01-01");
 *
 * // Locked field, Word keeps the cached value when fields are updated
 * new SimpleField("DATE", "2024-01-01", { locked: true });
 *
 * // Index entry, for an INDEX field to list
 * new SimpleField('XE "Apples"');
 * ```
 */
export class SimpleField extends XmlComponent {
    // Only in the type: with no members of its own, any component, such as a Paragraph, would type check as one
    declare private readonly brand: "SimpleField";

    public constructor(instruction: string, cachedValue?: string, options: ISimpleFieldOptions = {}) {
        const marker = MARKER_FIELD.test(instruction);
        super(marker ? "w:r" : "w:fldSimple");
        if (marker) {
            this.root.push(createBegin(undefined, options.locked ? true : undefined));
            this.root.push(new FieldInstructionText(instruction));
            this.root.push(createEnd());
            return;
        }
        this.root.push(new FldSimpleAttrs({ instr: instruction, fldLock: options.locked ? true : undefined }));
        if (cachedValue !== undefined) {
            this.root.push(new TextRun(cachedValue));
        }
    }
}

/**
 * Represents a mail merge field in a WordprocessingML document.
 *
 * SimpleMailMergeField is a specialized simple field for mail merge operations.
 * It creates a MERGEFIELD that will be populated with data during mail merge.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @example
 * ```typescript
 * // Creates a merge field for "FirstName"
 * new SimpleMailMergeField("FirstName");
 * // Renders as: MERGEFIELD FirstName with placeholder «FirstName»
 * ```
 */
export class SimpleMailMergeField extends SimpleField {
    public constructor(fieldName: string) {
        super(` MERGEFIELD ${fieldName} `, `«${fieldName}»`);
    }
}
