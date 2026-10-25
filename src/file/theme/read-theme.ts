/**
 * Reads themes: the theme of a Word document or template, of another Office file, or of a theme file, as the options of
 * a document's `theme`, so a document `docx` writes can have it, and the colors of a document's theme for the patcher.
 *
 * @module
 */
// cspell:ignore hlink Hlink purl oclc thmx dotm
import { relationshipsPathOf, resolveTarget } from "@util/package-paths";
import { type XmlElement, parseXml } from "@util/xml";
import { unzipFiles } from "@util/zip";

import type { IThemeColorsOptions } from "./color-scheme";
import type { IThemeFontOptions, IThemeFontsOptions } from "./font-scheme";
import type { IThemeOptions } from "./theme";
import type { ThemeColorName } from "./theme-color";

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

// The system colors a theme's first dark and light colors are by default, which `docx` writes when they aren't given
const DEFAULT_SYSTEM_COLORS: ReadonlyMap<ThemeColorName, string> = new Map([
    ["dark1", "windowText"],
    ["light1", "window"],
]);

// The types of the relationships to a package's main part and to a theme, as Transitional and Strict OOXML name them
const MAIN_PART_TYPES: ReadonlySet<string> = new Set([
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
    "http://purl.oclc.org/ooxml/officeDocument/relationships/officeDocument",
]);
const THEME_TYPES: ReadonlySet<string> = new Set([
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme",
    "http://purl.oclc.org/ooxml/officeDocument/relationships/theme",
]);

// An element's name without its namespace prefix, which a file may choose
const localName = (element: XmlElement | undefined): string => element?.name?.slice(element.name.indexOf(":") + 1) ?? "";

const childElements = (element: XmlElement | undefined): readonly XmlElement[] =>
    element?.elements?.filter((item) => item.type === "element") ?? [];

const child = (element: XmlElement | undefined, name: string): XmlElement | undefined =>
    childElements(element).find((item) => localName(item) === name);

const attribute = (element: XmlElement | undefined, name: string): string | undefined => {
    const value = element?.attributes?.[name];
    return value === undefined ? undefined : String(value);
};

// A zip file starts with the signature of its first file's header, "PK\x03\x04"
const isZip = (bytes: Uint8Array): boolean => bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

// The object without its properties that are undefined
const defined = <T extends object>(object: T): T =>
    Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined)) as T;

/**
 * The part that a part's relationship of one of `types` refers to, such as the package's main part, which the package
 * itself (`""`) refers to.
 */
const relatedPart = (files: ReadonlyMap<string, Uint8Array>, from: string, types: ReadonlySet<string>): string | undefined => {
    const relationships = files.get(relationshipsPathOf(from));
    const relationship =
        relationships &&
        childElements(child(parseXml(decode(relationships)), "Relationships")).find((item) => types.has(attribute(item, "Type") ?? ""));
    const target = attribute(relationship, "Target");
    return target === undefined ? undefined : resolveTarget(from, target);
};

/**
 * The path of the theme a part of a package refers to, such as word/theme/theme1.xml for a Word document's
 * word/document.xml.
 */
export const themePathOf = (files: ReadonlyMap<string, Uint8Array>, part: string): string | undefined =>
    relatedPart(files, part, THEME_TYPES);

/**
 * The XML of a package's theme: the theme its main part refers to, such as word/theme/theme1.xml in a Word document.
 *
 * @throws If the package has no main part, or its main part has no theme
 */
const packageThemeXml = (bytes: Uint8Array): string => {
    const files = unzipFiles(bytes, (path) => path.endsWith(".rels") || path.endsWith(".xml"));
    const mainPart = relatedPart(files, "", MAIN_PART_TYPES);
    if (mainPart === undefined) {
        throw new Error("Invalid file: a zip file that isn't a Word, PowerPoint or Excel file or an Office theme (.thmx)");
    }
    const themePath = themePathOf(files, mainPart);
    const theme = themePath === undefined ? undefined : files.get(themePath);
    if (theme === undefined) {
        throw new Error(`The file has no theme: its main part, ${mainPart}, refers to none`);
    }
    return decode(theme);
};

/**
 * A theme color's 6-digit hex color: an RGB color's value, or a system color's last value. Unless `withSystemColors`,
 * the first dark and light colors are left out when they are the system's window text and window colors, as `docx`
 * writes them then.
 */
const colorValue = (name: ThemeColorName, color: XmlElement, withSystemColors: boolean): string | undefined => {
    // A theme's color is one color, of one of the kinds DrawingML has
    const [value] = childElements(color);
    const hex =
        localName(value) === "srgbClr"
            ? attribute(value, "val")
            : localName(value) === "sysClr" && (withSystemColors || attribute(value, "val") !== DEFAULT_SYSTEM_COLORS.get(name))
              ? attribute(value, "lastClr")
              : undefined;
    return hex !== undefined && /^[0-9A-Fa-f]{6}$/.test(hex) ? hex.toUpperCase() : undefined;
};

const readColors = (scheme: XmlElement, withSystemColors = false): IThemeColorsOptions =>
    Object.fromEntries(
        childElements(scheme).flatMap((color) => {
            const name = COLOR_NAMES.get(localName(color));
            const value = name && colorValue(name, color, withSystemColors);
            return name && value ? [[name, value]] : [];
        }),
    );

/**
 * The colors of a theme's XML, each a 6-digit hex color, with the first dark and light colors as their last values when
 * they are system colors. The patcher writes theme colors in patches with the hex colors they come to in them.
 */
export const readThemeColorValues = (xml: string): IThemeColorsOptions => {
    const [root] = childElements(parseXml(xml));
    const scheme = localName(root) === "theme" ? child(child(root, "themeElements"), "clrScheme") : undefined;
    return scheme ? readColors(scheme, true) : {};
};

// A font's typeface, or `undefined` for none, which a theme writes as ""
const typefaceOf = (font: XmlElement | undefined): string | undefined => attribute(font, "typeface") || undefined;

const readFont = (collection: XmlElement | undefined): IThemeFontOptions => {
    const scripts = childElements(collection)
        .filter((font) => localName(font) === "font")
        .flatMap((font) => {
            const script = attribute(font, "script");
            const typeface = attribute(font, "typeface");
            return script && typeface !== undefined ? [[script, typeface] as const] : [];
        });
    return defined({
        latin: typefaceOf(child(collection, "latin")),
        eastAsia: typefaceOf(child(collection, "ea")),
        complexScript: typefaceOf(child(collection, "cs")),
        scripts: scripts.length > 0 ? Object.fromEntries(scripts) : undefined,
    });
};

const readFonts = (scheme: XmlElement): IThemeFontsOptions => ({
    headings: readFont(child(scheme, "majorFont")),
    body: readFont(child(scheme, "minorFont")),
});

/**
 * The XML of the theme the data is or has: the XML itself, as text or bytes, or the theme of a package.
 */
const xmlOf = (data: string | Uint8Array | ArrayBuffer): string => {
    if (typeof data === "string") {
        return data;
    }
    const bytes = ArrayBuffer.isView(data) ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
    return isZip(bytes) ? packageThemeXml(bytes) : decode(bytes);
};

/**
 * Reads a theme, such as the theme of a Word document or template, as the options of a document's `theme`. The new
 * document then has the theme's colors and fonts, so the styles, tables and text that use them look as they do in the
 * file the theme came from:
 *
 * - its name;
 * - its colors, each an RGB color or a system color's last value;
 * - its fonts for headings and body text, with their fonts for East Asian text, complex scripts and each other script.
 *
 * The fills, lines and effects of shapes styled by the theme are Office's in the new document, as `docx` writes them.
 *
 * It reads the colors or fonts Word saves on their own too, from Design > Colors > Customize Colors or Design > Fonts >
 * Customize Fonts, as the theme's `colors` or `fonts`.
 *
 * @param data - A Word document or template (.docx, .docm, .dotx or .dotm), a PowerPoint presentation (.pptx), an Excel
 * workbook (.xlsx), an Office theme (.thmx), or the XML of a theme, such as a document's word/theme/theme1.xml, or of a
 * theme's colors or fonts, as text or bytes
 * @returns The theme's options, to give `Document`'s `theme`, or to change before giving it
 * @throws If the data isn't one of those, or the file has no theme
 *
 * @example
 * ```typescript
 * import * as fs from "fs";
 * import { Document, readTheme } from "docx";
 *
 * // The template's styles, and its theme, whose colors and fonts its styles use
 * const doc = new Document({
 *   theme: readTheme(fs.readFileSync("template.dotx")),
 *   externalStyles: fs.readFileSync("styles.xml", "utf-8"),
 *   sections: [],
 * });
 * ```
 */
export const readTheme = (data: string | Uint8Array | ArrayBuffer): IThemeOptions => {
    const [root] = childElements(parseXml(xmlOf(data)));
    // The colors or fonts of a theme, on their own
    if (localName(root) === "clrScheme") {
        return { colors: readColors(root) };
    }
    if (localName(root) === "fontScheme") {
        return { fonts: readFonts(root) };
    }
    if (localName(root) !== "theme") {
        throw new Error(
            `Invalid theme: expected the XML of a theme, such as a document's word/theme/theme1.xml, but its root element is ${root?.name ?? "missing"}`,
        );
    }
    const elements = child(root, "themeElements");
    const colorScheme = child(elements, "clrScheme");
    const fontScheme = child(elements, "fontScheme");
    return defined({
        name: attribute(root, "name") || undefined,
        colors: colorScheme && readColors(colorScheme),
        fonts: fontScheme && readFonts(fontScheme),
    });
};
