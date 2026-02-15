/**
 * CheckBox module for WordprocessingML documents.
 *
 * This module provides interactive checkbox controls using
 * structured document tags (content controls).
 *
 * @module
 */
import { SymbolRun } from "@file/paragraph/run/symbol-run";
import { StructuredDocumentTagContent } from "@file/table-of-contents/sdt-content";
import { StructuredDocumentTagProperties } from "@file/table-of-contents/sdt-properties";
import { XmlComponent } from "@file/xml-components";

import { CheckBoxUtil, ICheckboxSymbolOptions } from "./checkbox-util";

/**
 * Represents an interactive checkbox in a WordprocessingML document.
 *
 * CheckBox creates a content control with checkbox functionality,
 * displaying a checked or unchecked symbol based on its state. The checkbox
 * is implemented using structured document tags (w:sdt) with checkbox-specific
 * properties.
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtCheckbox">
 *   <xsd:sequence>
 *     <xsd:element name="checked" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="checkedState" type="CT_SdtCheckboxSymbol" minOccurs="0"/>
 *     <xsd:element name="uncheckedState" type="CT_SdtCheckboxSymbol" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * <xsd:element name="checkbox" type="CT_SdtCheckbox"/>
 * ```
 *
 * @example
 * ```typescript
 * // Simple checkbox
 * new CheckBox({ checked: true });
 *
 * // Checkbox with custom alias
 * new CheckBox({
 *   checked: false,
 *   alias: "Accept Terms",
 * });
 *
 * // Checkbox with custom symbols
 * new CheckBox({
 *   checked: true,
 *   checkedState: { value: "2611", font: "Wingdings" },
 *   uncheckedState: { value: "2610", font: "Wingdings" },
 * });
 * ```
 */
export class CheckBox extends XmlComponent {
    // default values per Microsoft
    private readonly DEFAULT_UNCHECKED_SYMBOL: string = "2610";
    private readonly DEFAULT_CHECKED_SYMBOL: string = "2612";
    private readonly DEFAULT_FONT: string = "MS Gothic";
    public constructor(options?: ICheckboxSymbolOptions) {
        super("w:sdt");

        const properties = new StructuredDocumentTagProperties(options?.alias);
        properties.addChildElement(new CheckBoxUtil(options));
        this.root.push(properties);

        const content = new StructuredDocumentTagContent();
        const checkedFont: string | undefined = options?.checkedState?.font;
        const checkedText: string | undefined = options?.checkedState?.value;
        const uncheckedFont: string | undefined = options?.uncheckedState?.font;
        const uncheckedText: string | undefined = options?.uncheckedState?.value;
        let symbolFont: string;
        let char: string;

        if (options?.checked) {
            symbolFont = checkedFont ? checkedFont : this.DEFAULT_FONT;
            char = checkedText ? checkedText : this.DEFAULT_CHECKED_SYMBOL;
        } else {
            symbolFont = uncheckedFont ? uncheckedFont : this.DEFAULT_FONT;
            char = uncheckedText ? uncheckedText : this.DEFAULT_UNCHECKED_SYMBOL;
        }

        const initialRenderedChar = new SymbolRun({
            char: char,
            symbolfont: symbolFont,
        });

        content.addChildElement(initialRenderedChar);
        this.root.push(content);
    }
}
