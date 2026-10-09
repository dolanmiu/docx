/**
 * Create Embedded Font module for WordprocessingML documents.
 *
 * Provides a helper to create a font the document embeds the faces of, with default font signature settings.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_font-1.html
 *
 * @module
 */
import type { XmlComponent } from "@file/xml-components";

import { type CharacterSet, type FontOptions, createFont } from "./font";

/**
 * A font the document embeds: its name, its character set, and the relationship to the file of each face it embeds.
 *
 * @property name - Font name
 * @property characterSet - Optional character set identifier
 * @property embedRegular - Relationship to the regular face's file
 * @property embedBold - Relationship to the bold face's file
 * @property embedItalic - Relationship to the italic face's file
 * @property embedBoldItalic - Relationship to the bold italic face's file
 */
export type EmbeddedFontOptions = Pick<FontOptions, "name" | "embedRegular" | "embedBold" | "embedItalic" | "embedBoldItalic"> & {
    readonly characterSet?: (typeof CharacterSet)[keyof typeof CharacterSet];
};

/**
 * Creates an embedded font with default settings.
 *
 * This helper function creates a font definition with standard font signature
 * values that work for most common fonts. The signature specifies Unicode
 * and code page ranges supported by the font.
 *
 * @returns XmlComponent representing the font definition
 *
 * @example
 * ```typescript
 * const font = createEmbeddedFont({
 *   name: "Arial",
 *   embedRegular: { id: "rId1", fontKey: "12345678-1234-1234-1234-123456789012" },
 *   embedBold: { id: "rId2", fontKey: "12345678-1234-1234-1234-123456789013" },
 * });
 * ```
 */
export const createEmbeddedFont = ({
    name,
    characterSet,
    embedRegular,
    embedBold,
    embedItalic,
    embedBoldItalic,
}: EmbeddedFontOptions): XmlComponent =>
    createFont({
        name,
        sig: {
            usb0: "E0002AFF",
            usb1: "C000247B",
            usb2: "00000009",
            usb3: "00000000",
            csb0: "000001FF",
            csb1: "00000000",
        },
        charset: characterSet,
        family: "auto",
        pitch: "variable",
        embedRegular,
        embedBold,
        embedItalic,
        embedBoldItalic,
    });
