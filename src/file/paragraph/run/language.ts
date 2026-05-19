/**
 * Language module for WordprocessingML run properties.
 *
 * This module provides support for specifying the language of text content,
 * which affects spell checking, grammar checking, and hyphenation.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Options for language settings.
 *
 * Specifies the language for different text types within a run.
 * Language codes should follow RFC 1766 (e.g., "en-US", "fr-FR", "ja-JP").
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Language">
 *   <xsd:attribute name="val" type="s:ST_Lang" use="optional"/>
 *   <xsd:attribute name="eastAsia" type="s:ST_Lang" use="optional"/>
 *   <xsd:attribute name="bidi" type="s:ST_Lang" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @property value - Language for Latin and complex script text (e.g., "en-US")
 * @property eastAsia - Language for East Asian text (e.g., "ja-JP", "zh-CN")
 * @property bidirectional - Language for bidirectional text (e.g., "ar-SA", "he-IL")
 */
export type ILanguageOptions = {
    /** Language for Latin and complex script text (RFC 1766 format, e.g., "en-US") */
    readonly value?: string;
    /** Language for East Asian text (RFC 1766 format, e.g., "ja-JP") */
    readonly eastAsia?: string;
    /** Language for bidirectional text (RFC 1766 format, e.g., "ar-SA") */
    readonly bidirectional?: string;
};

/**
 * Creates a language component for run properties.
 *
 * This function creates a language element that specifies the language for text content.
 * The language setting affects spell checking, grammar checking, and hyphenation.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @param options - Language options for different text types
 * @returns XmlComponent representing the language element
 *
 * @example
 * ```typescript
 * // Set language for English (US)
 * createLanguageComponent({ value: "en-US" });
 *
 * // Set different languages for different scripts
 * createLanguageComponent({
 *   value: "en-US",
 *   eastAsia: "ja-JP",
 *   bidirectional: "ar-SA",
 * });
 * ```
 */
export const createLanguageComponent = (options: ILanguageOptions): XmlComponent =>
    new BuilderElement<{
        readonly value?: string;
        readonly eastAsia?: string;
        readonly bidirectional?: string;
    }>({
        name: "w:lang",
        attributes: {
            value: {
                key: "w:val",
                value: options.value,
            },
            eastAsia: {
                key: "w:eastAsia",
                value: options.eastAsia,
            },
            bidirectional: {
                key: "w:bidi",
                value: options.bidirectional,
            },
        },
    });
