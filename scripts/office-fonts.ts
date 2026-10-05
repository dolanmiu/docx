/**
 * Office's fonts that Word for Mac installs, other than those docx/layout's width tables have from fonts with an open
 * license made as wide as them, and the file of each face Word draws them in, for scripts/generate-font-widths.ts and
 * scripts/generate-font-kerning.ts, which read Word's own files of them. They are in Word's folder of fonts
 * (/Applications/Microsoft Word.app/Contents/Resources/DFonts), but for Georgia, Impact and Trebuchet MS, which Word takes
 * from the Mac's (/System/Library/Fonts/Supplemental). Word draws Verdana and Tahoma in its own files, which have letters
 * the Mac's don't, such as Tahoma's Ѹ, which Word's PDF shows as wide as its own file has it.
 */
// cspell:ignore Aptos calibril calibrili Consola Consolab Consolai Consolaz Candarab Candarai Candaraz Corbelb Corbeli Corbelz
// cspell:ignore Constan Constanb Constani Constanz tahomabd

/** The faces of a font, each in a file of its own */
export type OfficeFace = "regular" | "bold" | "italic" | "boldItalic";

/**
 * Office's other fonts that Word for Mac installs, and the file of each face Word draws them in. A face without a file is
 * one Word makes itself. Word draws Trebuchet MS bold italic as its bold, slanted, though the Mac has a Trebuchet MS Bold
 * Italic, as Word's PDF shows: its widths and kerning are the bold's (word-stops-font-widths, word-stops-font-kerning K18)
 */
export const OFFICE_FONTS: readonly {
    readonly name: string;
    readonly files: Readonly<Partial<Record<OfficeFace, string>>>;
}[] = [
    { name: "Calibri Light", files: { regular: "calibril.ttf", italic: "calibrili.ttf" } },
    {
        name: "Aptos",
        files: { regular: "Aptos.ttf", bold: "Aptos-Bold.ttf", italic: "Aptos-Italic.ttf", boldItalic: "Aptos-Bold-Italic.ttf" },
    },
    {
        name: "Aptos Narrow",
        files: {
            regular: "Aptos-Narrow.ttf",
            bold: "Aptos-Narrow-Bold.ttf",
            italic: "Aptos-Narrow-Italic.ttf",
            boldItalic: "Aptos-Narrow-Bold-Italic.ttf",
        },
    },
    { name: "Trebuchet MS", files: { regular: "Trebuchet MS.ttf", bold: "Trebuchet MS Bold.ttf", italic: "Trebuchet MS Italic.ttf" } },
    {
        name: "Georgia",
        files: { regular: "Georgia.ttf", bold: "Georgia Bold.ttf", italic: "Georgia Italic.ttf", boldItalic: "Georgia Bold Italic.ttf" },
    },
    {
        name: "Verdana",
        files: { regular: "Verdana.ttf", bold: "Verdana Bold.ttf", italic: "Verdana Italic.ttf", boldItalic: "Verdana Bold Italic.ttf" },
    },
    { name: "Tahoma", files: { regular: "tahoma.ttf", bold: "tahomabd.ttf" } },
    {
        name: "Century Gothic",
        files: {
            regular: "Century Gothic.ttf",
            bold: "Century Gothic Bold.ttf",
            italic: "Century Gothic Italic.ttf",
            boldItalic: "Century Gothic Bold Italic.ttf",
        },
    },
    { name: "Consolas", files: { regular: "Consola.ttf", bold: "Consolab.ttf", italic: "Consolai.ttf", boldItalic: "Consolaz.ttf" } },
    { name: "Candara", files: { regular: "Candara.ttf", bold: "Candarab.ttf", italic: "Candarai.ttf", boldItalic: "Candaraz.ttf" } },
    { name: "Corbel", files: { regular: "Corbel.ttf", bold: "Corbelb.ttf", italic: "Corbeli.ttf", boldItalic: "Corbelz.ttf" } },
    { name: "Constantia", files: { regular: "Constan.ttf", bold: "Constanb.ttf", italic: "Constani.ttf", boldItalic: "Constanz.ttf" } },
    {
        name: "Book Antiqua",
        files: {
            regular: "Book Antiqua.ttf",
            bold: "Book Antiqua Bold.ttf",
            italic: "Book Antiqua Italic.ttf",
            boldItalic: "Book Antiqua Bold Italic.ttf",
        },
    },
    { name: "Franklin Gothic Book", files: { regular: "Franklin Gothic Book.ttf", italic: "Franklin Gothic Book Italic.ttf" } },
    {
        name: "Gill Sans MT",
        files: {
            regular: "Gill Sans MT.ttf",
            bold: "Gill Sans MT Bold.ttf",
            italic: "Gill Sans MT Italic.ttf",
            boldItalic: "Gill Sans MT Bold Italic.ttf",
        },
    },
    { name: "Impact", files: { regular: "Impact.ttf" } },
];
export type OfficeFont = (typeof OFFICE_FONTS)[number];
