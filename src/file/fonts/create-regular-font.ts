/**
 * Create Regular Font module for WordprocessingML documents.
 *
 * Provides a helper to create regular (non-bold, non-italic) embedded fonts
 * with default font signature settings.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_font-1.html
 *
 * @module
 */
import type { XmlComponent } from "@file/xml-components";

import { type CharacterSet, createFont } from "./font";

/**
 * Creates a regular embedded font with default settings.
 *
 * This helper function creates a font definition with standard font signature
 * values that work for most common fonts. The signature specifies Unicode
 * and code page ranges supported by the font.
 *
 * @param options - Font creation options
 * @param options.name - Font name
 * @param options.index - Font relationship index
 * @param options.fontKey - Unique font key (GUID) for obfuscation
 * @param options.characterSet - Optional character set identifier
 *
 * @returns XmlComponent representing the font definition
 *
 * @example
 * ```typescript
 * const font = createRegularFont({
 *   name: "Arial",
 *   index: 1,
 *   fontKey: "12345678-1234-1234-1234-123456789012"
 * });
 * ```
 */
export const createRegularFont = ({
    name,
    index,
    fontKey,
    characterSet,
}: {
    readonly name: string;
    readonly index: number;
    readonly fontKey: string;
    readonly characterSet?: (typeof CharacterSet)[keyof typeof CharacterSet];
}): XmlComponent =>
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
        embedRegular: {
            fontKey,
            id: `rId${index}`,
        },
    });
