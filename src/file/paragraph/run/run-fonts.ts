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
import { BuilderElement, type XmlComponent } from "@file/xml-components";

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
 * Creates font settings for a run in a WordprocessingML document.
 *
 * The rFonts element specifies which fonts should be used for different character
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
 * createRunFonts("Arial");
 *
 * // Specify different fonts for different character sets
 * createRunFonts({
 *   ascii: "Arial",
 *   eastAsia: "MS Mincho",
 *   cs: "Arial",
 *   hAnsi: "Arial",
 * });
 * ```
 */
export const createRunFonts = (nameOrAttrs: string | IFontAttributesProperties, hint?: string): XmlComponent => {
    if (typeof nameOrAttrs === "string") {
        const name = nameOrAttrs;
        return new BuilderElement<IFontAttributesProperties>({
            name: "w:rFonts",
            attributes: {
                ascii: { key: "w:ascii", value: name },
                cs: { key: "w:cs", value: name },
                eastAsia: { key: "w:eastAsia", value: name },
                hAnsi: { key: "w:hAnsi", value: name },
                hint: { key: "w:hint", value: hint },
            },
        });
    }

    const attrs = nameOrAttrs;
    return new BuilderElement<IFontAttributesProperties>({
        name: "w:rFonts",
        attributes: {
            ascii: { key: "w:ascii", value: attrs.ascii },
            cs: { key: "w:cs", value: attrs.cs },
            eastAsia: { key: "w:eastAsia", value: attrs.eastAsia },
            hAnsi: { key: "w:hAnsi", value: attrs.hAnsi },
            hint: { key: "w:hint", value: attrs.hint },
        },
    });
};
