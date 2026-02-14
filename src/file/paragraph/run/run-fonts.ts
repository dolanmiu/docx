/**
 * Run fonts module for WordprocessingML documents.
 *
 * This module provides support for specifying fonts for different character sets
 * within a run. Fonts can be specified separately for ASCII, complex script (CS),
 * East Asian, and high ANSI character ranges.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Options for font attributes across different character sets.
 *
 * @property ascii - Font for ASCII characters (0x00-0x7F)
 * @property cs - Font for complex script characters
 * @property eastAsia - Font for East Asian characters
 * @property hAnsi - Font for high ANSI characters (0x80-0xFF)
 * @property hint - Hint for font selection algorithm
 */
export type IFontAttributesProperties = {
    /** Font for ASCII characters (0x00-0x7F) */
    readonly ascii?: string;
    /** Font for complex script characters */
    readonly cs?: string;
    /** Font for East Asian characters */
    readonly eastAsia?: string;
    /** Font for high ANSI characters (0x80-0xFF) */
    readonly hAnsi?: string;
    /** Hint for font selection algorithm */
    readonly hint?: string;
};

/**
 * @internal
 */
class RunFontAttributes extends XmlAttributeComponent<IFontAttributesProperties> {
    protected readonly xmlKeys = {
        ascii: "w:ascii",
        cs: "w:cs",
        eastAsia: "w:eastAsia",
        hAnsi: "w:hAnsi",
        hint: "w:hint",
    };
}

/**
 * Represents font settings for a run in a WordprocessingML document.
 *
 * The RunFonts element specifies which fonts should be used for different character
 * ranges in a run. This allows documents to use different fonts for ASCII, complex
 * script, East Asian, and high ANSI characters.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Fonts">
 *   <xsd:attribute name="hint" type="ST_Hint"/>
 *   <xsd:attribute name="ascii" type="s:ST_String"/>
 *   <xsd:attribute name="hAnsi" type="s:ST_String"/>
 *   <xsd:attribute name="eastAsia" type="s:ST_String"/>
 *   <xsd:attribute name="cs" type="s:ST_String"/>
 *   <xsd:attribute name="asciiTheme" type="ST_Theme"/>
 *   <xsd:attribute name="hAnsiTheme" type="ST_Theme"/>
 *   <xsd:attribute name="eastAsiaTheme" type="ST_Theme"/>
 *   <xsd:attribute name="cstheme" type="ST_Theme"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Use same font for all character sets
 * new RunFonts("Arial");
 *
 * // Specify different fonts for different character sets
 * new RunFonts({
 *   ascii: "Arial",
 *   eastAsia: "MS Mincho",
 *   cs: "Arial",
 *   hAnsi: "Arial",
 * });
 * ```
 */
export class RunFonts extends XmlComponent {
    public constructor(name: string, hint?: string);
    public constructor(attrs: string | IFontAttributesProperties);
    public constructor(nameOrAttrs: string | IFontAttributesProperties, hint?: string) {
        super("w:rFonts");
        if (typeof nameOrAttrs === "string") {
            // use public constructor(name: string, hint?: string);
            const name = nameOrAttrs;
            this.root.push(
                new RunFontAttributes({
                    ascii: name,
                    cs: name,
                    eastAsia: name,
                    hAnsi: name,
                    hint: hint,
                }),
            );
        } else {
            // use public constructor(attrs: IRunFontAttributesProperties);
            const attrs = nameOrAttrs;
            this.root.push(new RunFontAttributes(attrs));
        }
    }
}
