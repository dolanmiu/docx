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
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { TextRun } from "./text-run";

/**
 * @internal
 */
class FldSimpleAttrs extends XmlAttributeComponent<{ readonly instr: string }> {
    protected readonly xmlKeys = { instr: "w:instr" };
}

/**
 * Represents a simple field in a WordprocessingML document.
 *
 * A simple field (fldSimple) contains both the field code and the optional cached value
 * in a single element, unlike complex fields which use separate begin/end markers.
 * Simple fields are typically used for fields that don't require complex nesting.
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
 * ```
 */
export class SimpleField extends XmlComponent {
    public constructor(instruction: string, cachedValue?: string) {
        super("w:fldSimple");
        this.root.push(new FldSimpleAttrs({ instr: instruction }));
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
