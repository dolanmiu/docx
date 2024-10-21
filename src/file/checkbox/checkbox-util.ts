// <xsd:complexType name="CT_SdtCheckbox">
//    <xsd:sequence>
//        <xsd:element name="checked" type="CT_OnOff" minOccurs="0"/>
//        <xsd:element name="checkedState" type="CT_SdtCheckboxSymbol" minOccurs="0"/>
//        <xsd:element name="uncheckedState" type="CT_SdtCheckboxSymbol" minOccurs="0"/>
//    </xsd:sequence>
// </xsd:complexType>
// <xsd:element name="checkbox" type="CT_SdtCheckbox"/>

import { CheckBoxSymbolElement } from "@file/checkbox/checkbox-symbol";
import { XmlComponent } from "@file/xml-components";

export type ICheckboxSymbolProperties = {
    readonly value?: string;
    readonly font?: string;
};

export type ICheckboxSymbolOptions = {
    readonly alias?: string;
    readonly checked?: boolean;
    readonly checkedState?: ICheckboxSymbolProperties;
    readonly uncheckedState?: ICheckboxSymbolProperties;
};

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
