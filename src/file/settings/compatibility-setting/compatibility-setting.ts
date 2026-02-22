/**
 * Compatibility setting module for WordprocessingML documents.
 *
 * This module provides the compatibility mode version setting that controls
 * which Word version's behavior the document should emulate.
 *
 * Reference: https://docs.microsoft.com/en-us/openspecs/office_standards/ms-docx/90138c4d-eb18-4edc-aa6c-dfb799cb1d0d
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

// Currently, this is hard-coded for Microsoft word compatSettings.
// Theoretically, we could add compatSettings for other programs, but
// currently there isn't a need.

// <xsd:complexType name="CT_CompatSetting">
//     <xsd:attribute name="name" type="s:ST_String"/>
//     <xsd:attribute name="uri" type="s:ST_String"/>
//     <xsd:attribute name="val" type="s:ST_String"/>
// </xsd:complexType>

type ICompatibilitySettingAttributes = {
    readonly version: number;
    readonly name: string;
    readonly uri: string;
};

/**
 * Creates a compatibility setting for a WordprocessingML document.
 *
 * Currently hard-coded to set Microsoft Word compatibility mode version.
 * This controls which Word version's formatting and layout behavior the document emulates.
 *
 * Common version values:
 * - 11: Word 2003
 * - 12: Word 2007
 * - 14: Word 2010
 * - 15: Word 2013+
 *
 * Reference: https://docs.microsoft.com/en-us/openspecs/office_standards/ms-docx/90138c4d-eb18-4edc-aa6c-dfb799cb1d0d
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_CompatSetting">
 *   <xsd:attribute name="name" type="s:ST_String"/>
 *   <xsd:attribute name="uri" type="s:ST_String"/>
 *   <xsd:attribute name="val" type="s:ST_String"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Set compatibility mode to Word 2013+
 * createCompatibilitySetting(15);
 *
 * // Set compatibility mode to Word 2010
 * createCompatibilitySetting(14);
 * ```
 */
export const createCompatibilitySetting = (version: number): XmlComponent =>
    new BuilderElement<ICompatibilitySettingAttributes>({
        name: "w:compatSetting",
        attributes: {
            version: { key: "w:val", value: version },
            name: { key: "w:name", value: "compatibilityMode" },
            uri: { key: "w:uri", value: "http://schemas.microsoft.com/office/word" },
        },
    });
