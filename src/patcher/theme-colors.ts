/**
 * Reads the colors of a document's theme, so that theme colors in patches are written with the hex color they come to
 * in the document's own theme.
 *
 * @module
 */
import { type ThemeColorValues, themeColorValues } from "@file/theme/color-scheme";
import { readThemeColorValues, themePathOf } from "@file/theme/read-theme";

import { decodeUtf8 } from "./util";

// The patcher leaves parts in UTF-16 as they are, so they aren't read here either
const isUtf16 = (bytes: Uint8Array): boolean => (bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff);

/**
 * Reads the colors of the document's theme. Colors it doesn't give, or gives in a way that isn't read, are Office's.
 *
 * @returns The theme's colors, or `undefined` if the document has no theme that can be read
 */
export const readThemeColors = (files: ReadonlyMap<string, Uint8Array>): ThemeColorValues | undefined => {
    const path = themePathOf(files, "word/document.xml");
    const theme = path === undefined ? undefined : files.get(path);
    return theme === undefined || isUtf16(theme) ? undefined : themeColorValues(readThemeColorValues(decodeUtf8(theme)));
};
