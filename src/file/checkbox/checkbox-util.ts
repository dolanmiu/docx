/**
 * CheckBox utility module for WordprocessingML documents.
 *
 * Provides the internal XML structure for checkbox content controls.
 *
 * @module
 */
import { CheckBoxSymbolElement } from "@file/checkbox/checkbox-symbol";
import { XmlComponent } from "@file/xml-components";

/**
 * Configuration for a checkbox symbol state (checked or unchecked).
 *
 * @property value - Hexadecimal character code for the symbol (e.g., "2612" for ☒)
 * @property font - Font family to use for rendering the symbol
 */
export type ICheckboxSymbolProperties = {
    /** Hexadecimal character code for the symbol (e.g., "2612" for ☒). */
    readonly value?: string;
    /** Font family to use for rendering the symbol. */
    readonly font?: string;
};

/**
 * Options for configuring a checkbox control.
 *
 * @property alias - Display name for the checkbox control
 * @property checked - Whether the checkbox is initially checked
 * @property checkedState - Symbol properties for the checked state
 * @property uncheckedState - Symbol properties for the unchecked state
 */
export type ICheckboxSymbolOptions = {
    /** Display name for the checkbox control. */
    readonly alias?: string;
    /** Whether the checkbox is initially checked. */
    readonly checked?: boolean;
    /** Symbol properties for the checked state. */
    readonly checkedState?: ICheckboxSymbolProperties;
    /** Symbol properties for the unchecked state. */
    readonly uncheckedState?: ICheckboxSymbolProperties;
};

/**
 * Represents the checkbox element within a structured document tag.
 *
 * This class generates the w14:checkbox element that defines the checkbox behavior,
 * including its checked state and the symbols used for checked and unchecked states.
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
 * // Default checkbox (unchecked with default symbols)
 * new CheckBoxUtil();
 *
 * // Checked checkbox with defaults
 * new CheckBoxUtil({ checked: true });
 *
 * // Custom symbols
 * new CheckBoxUtil({
 *   checked: false,
 *   checkedState: { value: "2611", font: "Wingdings" },
 *   uncheckedState: { value: "2610", font: "Wingdings" },
 * });
 * ```
 */
export class CheckBoxUtil extends XmlComponent {
    private readonly DEFAULT_UNCHECKED_SYMBOL: string = "2610";
    private readonly DEFAULT_CHECKED_SYMBOL: string = "2612";
    private readonly DEFAULT_FONT: string = "MS Gothic";
    public constructor(options?: ICheckboxSymbolOptions) {
        super("w14:checkbox");

        const value = options?.checked ? "1" : "0";
        let symbol: string;
        let font: string;
        this.root.push(new CheckBoxSymbolElement("w14:checked", value));

        symbol = options?.checkedState?.value ? options?.checkedState?.value : this.DEFAULT_CHECKED_SYMBOL;
        font = options?.checkedState?.font ? options?.checkedState?.font : this.DEFAULT_FONT;
        this.root.push(new CheckBoxSymbolElement("w14:checkedState", symbol, font));

        symbol = options?.uncheckedState?.value ? options?.uncheckedState?.value : this.DEFAULT_UNCHECKED_SYMBOL;
        font = options?.uncheckedState?.font ? options?.uncheckedState?.font : this.DEFAULT_FONT;
        this.root.push(new CheckBoxSymbolElement("w14:uncheckedState", symbol, font));
    }
}
