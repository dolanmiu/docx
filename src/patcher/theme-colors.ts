/**
 * Reads the colors of a document's theme, so that theme colors in patches are written with the hex color they come to
 * in the document's own theme.
 *
 * @module
 */
// cspell:ignore hlink Hlink
import type JSZip from "jszip";
import type { Element } from "xml-js";

import { type ThemeColorValues, themeColorValues } from "@file/theme/color-scheme";
import type { ThemeColorName } from "@file/theme/theme-color";

import { toJson } from "./util";

const THEME_RELATIONSHIP_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme";

/* cspell:disable */
const COLOR_NAMES: ReadonlyMap<string, ThemeColorName> = new Map([
    ["dk1", "dark1"],
    ["lt1", "light1"],
    ["dk2", "dark2"],
    ["lt2", "light2"],
    ["accent1", "accent1"],
    ["accent2", "accent2"],
    ["accent3", "accent3"],
    ["accent4", "accent4"],
    ["accent5", "accent5"],
    ["accent6", "accent6"],
    ["hlink", "hyperlink"],
    ["folHlink", "followedHyperlink"],
]);
/* cspell:enable */

// An element's name without its namespace prefix, which a document may choose
const localName = (element: Element): string | undefined => element.name?.slice(element.name.indexOf(":") + 1);

const child = (element: Element | undefined, name: string): Element | undefined =>
    element?.elements?.find((item) => localName(item) === name);

/**
 * The hex value of a theme's color: an RGB color's value, or the last value of a system color, as Word writes them.
 * Other kinds of color aren't read.
 */
const hexValue = (color: Element): string | undefined => {
    const value = color.elements
        ?.map((item) =>
            localName(item) === "srgbClr" ? item.attributes?.val : localName(item) === "sysClr" ? item.attributes?.lastClr : undefined,
        )
        .find((item) => item !== undefined);
    return typeof value === "string" && /^[0-9A-Fa-f]{6}$/.test(value) ? value.toUpperCase() : undefined;
};

// The patcher leaves parts in UTF-16 as they are, so they aren't read here either
const isUtf16 = (bytes: Uint8Array): boolean => (bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff);

const readPart = async (zip: JSZip, path: string): Promise<Element | undefined> => {
    const part = zip.file(path);
    if (part === null) {
        return undefined;
    }
    return isUtf16(await part.async("uint8array")) ? undefined : toJson(await part.async("text"));
};

/**
 * The document's theme part, found from the document's relationships.
 */
const readTheme = async (zip: JSZip): Promise<Element | undefined> => {
    const relationships = await readPart(zip, "word/_rels/document.xml.rels");
    const theme = child(relationships, "Relationships")?.elements?.find((item) => item.attributes?.Type === THEME_RELATIONSHIP_TYPE);
    const target = theme?.attributes?.Target;
    return typeof target === "string" ? readPart(zip, target.startsWith("/") ? target.slice(1) : `word/${target}`) : undefined;
};

/**
 * Reads the colors of the document's theme. Colors it doesn't give, or gives in a way that isn't read, are Office's.
 *
 * @returns The theme's colors, or `undefined` if the document has no theme that can be read
 */
export const readThemeColors = async (zip: JSZip): Promise<ThemeColorValues | undefined> => {
    const theme = await readTheme(zip);
    if (theme === undefined) {
        return undefined;
    }
    const scheme = child(child(child(theme, "theme"), "themeElements"), "clrScheme");
    const colors = (scheme?.elements ?? []).flatMap((color) => {
        const name = COLOR_NAMES.get(localName(color) ?? "");
        const value = hexValue(color);
        return name && value ? [[name, value] as const] : [];
    });
    return themeColorValues(Object.fromEntries(colors));
};
