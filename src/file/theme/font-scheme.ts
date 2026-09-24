/**
 * Font scheme module for DrawingML themes.
 *
 * The two fonts of a document's theme: one for headings and one for body text. Styles and text that use a theme font
 * change when the theme's fonts change.
 *
 * Reference: http://officeopenxml.com/drwTheme.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * The fonts of one of a theme's fonts for each kind of script.
 *
 * @publicApi
 */
export type IThemeFontOptions = {
    /** The font for Latin text, such as English */
    readonly latin?: string;
    /** The font for East Asian text. By default Word picks a font for each East Asian language */
    readonly eastAsia?: string;
    /** The font for complex scripts, such as Arabic and Hebrew. By default Word picks a font for each script */
    readonly complexScript?: string;
};

/**
 * The fonts of a document's theme: a font name for Latin text, or fonts for each kind of script.
 *
 * Word lists them at the top of its font menu, as "(Headings)" and "(Body)". Text uses them when its font is
 * `{ theme: "headings" }` or `{ theme: "body" }`.
 *
 * @publicApi
 */
export type IThemeFontsOptions = {
    /** The font for headings (`majorFont`). Default is Calibri Light */
    readonly headings?: string | IThemeFontOptions;
    /** The font for body text (`minorFont`). Default is Calibri */
    readonly body?: string | IThemeFontOptions;
};

type OfficeFont = {
    readonly latin: string;
    readonly panose: string;
};

// Office's fonts, from Office 2016 to 2021, with their PANOSE numbers, which applications use to find a similar font
const OFFICE_FONTS: Readonly<Record<keyof IThemeFontsOptions, OfficeFont>> = {
    headings: { latin: "Calibri Light", panose: "020F0302020204030204" },
    body: { latin: "Calibri", panose: "020F0502020204030204" },
};

/* cspell:disable */
// Office's fonts for other scripts: each script, its font for headings, and its font for body text when different
const OFFICE_SCRIPT_FONTS: readonly (readonly [string, string, string?])[] = [
    ["Jpan", "游ゴシック Light", "游明朝"],
    ["Hang", "맑은 고딕"],
    ["Hans", "等线 Light", "等线"],
    ["Hant", "新細明體"],
    ["Arab", "Times New Roman", "Arial"],
    ["Hebr", "Times New Roman", "Arial"],
    ["Thai", "Angsana New", "Cordia New"],
    ["Ethi", "Nyala"],
    ["Beng", "Vrinda"],
    ["Gujr", "Shruti"],
    ["Khmr", "MoolBoran", "DaunPenh"],
    ["Knda", "Tunga"],
    ["Guru", "Raavi"],
    ["Cans", "Euphemia"],
    ["Cher", "Plantagenet Cherokee"],
    ["Yiii", "Microsoft Yi Baiti"],
    ["Tibt", "Microsoft Himalaya"],
    ["Thaa", "MV Boli"],
    ["Deva", "Mangal"],
    ["Telu", "Gautami"],
    ["Taml", "Latha"],
    ["Syrc", "Estrangelo Edessa"],
    ["Orya", "Kalinga"],
    ["Mlym", "Kartika"],
    ["Laoo", "DokChampa"],
    ["Sinh", "Iskoola Pota"],
    ["Mong", "Mongolian Baiti"],
    ["Viet", "Times New Roman", "Arial"],
    ["Uigh", "Microsoft Uighur"],
    ["Geor", "Sylfaen"],
    ["Armn", "Arial"],
    ["Bugi", "Leelawadee UI"],
    ["Bopo", "Microsoft JhengHei"],
    ["Java", "Javanese Text"],
    ["Lisu", "Segoe UI"],
    ["Mymr", "Myanmar Text"],
    ["Nkoo", "Ebrima"],
    ["Olck", "Nirmala UI"],
    ["Osma", "Ebrima"],
    ["Phag", "Phagspa"],
    ["Syrn", "Estrangelo Edessa"],
    ["Syrj", "Estrangelo Edessa"],
    ["Syre", "Estrangelo Edessa"],
    ["Sora", "Nirmala UI"],
    ["Tale", "Microsoft Tai Le"],
    ["Talu", "Microsoft New Tai Lue"],
    ["Tfng", "Ebrima"],
];
/* cspell:enable */

const createTextFont = (name: string, typeface: string, panose?: string): XmlComponent =>
    new BuilderElement<{ readonly typeface: string; readonly panose?: string }>({
        name,
        attributes: {
            typeface: { key: "typeface", value: typeface },
            panose: { key: "panose", value: panose },
        },
    });

/**
 * The Latin font of one of a theme's fonts, as given or as Office's.
 */
const themeLatinFont = (use: keyof IThemeFontsOptions, fonts: IThemeFontsOptions): string => {
    const font = fonts[use];
    const latin = typeof font === "string" ? font : font?.latin;
    return latin ?? OFFICE_FONTS[use].latin;
};

const createFontCollection = (use: keyof IThemeFontsOptions, fonts: IThemeFontsOptions): XmlComponent => {
    const font = fonts[use];
    const { eastAsia = "", complexScript = "" } = typeof font === "object" ? font : {};
    const latin = themeLatinFont(use, fonts);
    const office = OFFICE_FONTS[use];
    return new BuilderElement({
        name: use === "headings" ? "a:majorFont" : "a:minorFont",
        children: [
            // Office's PANOSE number describes only Office's font
            createTextFont("a:latin", latin, latin === office.latin ? office.panose : undefined),
            createTextFont("a:ea", eastAsia),
            createTextFont("a:cs", complexScript),
            ...OFFICE_SCRIPT_FONTS.map(
                ([script, headings, body = headings]) =>
                    new BuilderElement<{ readonly script: string; readonly typeface: string }>({
                        name: "a:font",
                        attributes: {
                            script: { key: "script", value: script },
                            typeface: { key: "typeface", value: use === "headings" ? headings : body },
                        },
                    }),
            ),
        ],
    });
};

/**
 * Creates a theme's font scheme, with Office's fonts in place of those not given.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FontScheme">
 *   <xsd:sequence>
 *     <xsd:element name="majorFont" type="CT_FontCollection" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="minorFont" type="CT_FontCollection" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="name" type="xsd:string" use="required"/>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_FontCollection">
 *   <xsd:sequence>
 *     <xsd:element name="latin" type="CT_TextFont" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="ea" type="CT_TextFont" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="cs" type="CT_TextFont" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="font" type="CT_SupplementalFont" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createFontScheme = (name: string, fonts: IThemeFontsOptions = {}): XmlComponent =>
    new BuilderElement<{ readonly name: string }>({
        name: "a:fontScheme",
        attributes: { name: { key: "name", value: name } },
        children: [createFontCollection("headings", fonts), createFontCollection("body", fonts)],
    });
