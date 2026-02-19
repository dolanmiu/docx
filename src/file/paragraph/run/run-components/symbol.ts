/**
 * Symbol module for WordprocessingML run content.
 *
 * This module provides support for inserting symbol characters
 * from symbol fonts like Wingdings or Symbol.
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Attributes for the symbol element.
 * @internal
 */
class SymbolAttributes extends XmlAttributeComponent<{
    readonly char: string;
    readonly symbolfont?: string;
}> {
    protected readonly xmlKeys = {
        char: "w:char",
        symbolfont: "w:font",
    };
}

/**
 * Represents a symbol character in a run.
 *
 * Symbol inserts a character from a symbol font using its
 * character code (hex value).
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Sym">
 *   <xsd:attribute name="font" type="s:ST_String"/>
 *   <xsd:attribute name="char" type="s:ST_ShortHexNumber"/>
 * </xsd:complexType>
 * ```
 */
export class Symbol extends XmlComponent {
    public constructor(char: string = "", symbolfont: string = "Wingdings") {
        super("w:sym");
        this.root.push(new SymbolAttributes({ char: char, symbolfont: symbolfont }));
    }
}
