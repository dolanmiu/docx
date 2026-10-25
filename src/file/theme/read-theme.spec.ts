/* eslint-disable @typescript-eslint/naming-convention -- The keys of objects here are paths of parts in a package */
// cspell:ignore hlink Hlink purl oclc DRAWINGML Jpan
import { describe, expect, it } from "vitest";

import { Packer } from "@export/packer/packer";
import { File } from "@file/file";
import { encodeUtf8 } from "@util/convenience-functions";
import { damaging, zip } from "tests/zip";

import { readTheme, readThemeColorValues, themePathOf } from "./read-theme";

const DRAWINGML = "http://schemas.openxmlformats.org/drawingml/2006/main";
const RELATIONSHIPS = "http://schemas.openxmlformats.org/package/2006/relationships";
const MAIN_PART = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";
const THEME = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme";

const relationships = (...items: readonly (readonly [type: string, target: string])[]): string =>
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${RELATIONSHIPS}">${items
        .map(([type, target], index) => `<Relationship Id="rId${index + 1}" Type="${type}" Target="${target}"/>`)
        .join("")}</Relationships>`;

const themeXml = (themeElements: string, name = "Harbour"): string =>
    `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="${DRAWINGML}" name="${name}"><a:themeElements>${themeElements}</a:themeElements></a:theme>`;

const colorScheme = (colors: string): string => `<a:clrScheme name="Harbour">${colors}</a:clrScheme>`;

const fontScheme = (headings: string, body: string): string =>
    `<a:fontScheme name="Harbour"><a:majorFont>${headings}</a:majorFont><a:minorFont>${body}</a:minorFont></a:fontScheme>`;

const HARBOUR = themeXml(
    colorScheme(
        `<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>` +
            `<a:dk2><a:srgbClr val="1b3a4b"/></a:dk2><a:accent1><a:srgbClr val="1F6F8B"/></a:accent1>` +
            `<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink>`,
    ) +
        fontScheme(
            `<a:latin typeface="Cambria" panose="02040503050406030204"/><a:ea typeface=""/><a:cs typeface=""/>` +
                `<a:font script="Jpan" typeface="游明朝"/><a:font script="Arab" typeface="Times New Roman"/>`,
            `<a:latin typeface="Calibri"/><a:ea typeface="Yu Gothic"/><a:cs typeface="Tahoma"/>`,
        ),
);

const HARBOUR_OPTIONS = {
    name: "Harbour",
    colors: { dark2: "1B3A4B", accent1: "1F6F8B", hyperlink: "0563C1", followedHyperlink: "954F72" },
    fonts: {
        headings: { latin: "Cambria", scripts: { Jpan: "游明朝", Arab: "Times New Roman" } },
        body: { latin: "Calibri", eastAsia: "Yu Gothic", complexScript: "Tahoma" },
    },
};

describe("readTheme", () => {
    it("should read a theme's name, colors and fonts from its XML", () => {
        expect(readTheme(HARBOUR)).to.deep.equal(HARBOUR_OPTIONS);
    });

    it("should read the XML of a theme given as bytes, such as a file read from disk", () => {
        const bytes = new TextEncoder().encode(`\uFEFF${HARBOUR}`);
        expect(readTheme(bytes)).to.deep.equal(HARBOUR_OPTIONS);
        expect(readTheme(bytes.buffer)).to.deep.equal(HARBOUR_OPTIONS);
        // A view of part of a larger buffer, as Node's Buffer can be
        const padded = new Uint8Array(bytes.length + 8);
        padded.set(bytes, 4);
        expect(readTheme(padded.subarray(4, 4 + bytes.length))).to.deep.equal(HARBOUR_OPTIONS);
    });

    it("should read the XML of a theme in UTF-16, which starts with its byte order mark", () => {
        const xml = `\uFEFF${HARBOUR.replace('encoding="UTF-8"', 'encoding="UTF-16"')}`;
        const codeUnits = [...Array(xml.length).keys()].map((index) => xml.charCodeAt(index));
        const littleEndian = new Uint8Array(codeUnits.flatMap((unit) => [unit % 0x100, Math.floor(unit / 0x100)]));
        const bigEndian = new Uint8Array(codeUnits.flatMap((unit) => [Math.floor(unit / 0x100), unit % 0x100]));
        expect(readTheme(littleEndian)).to.deep.equal(HARBOUR_OPTIONS);
        expect(readTheme(bigEndian)).to.deep.equal(HARBOUR_OPTIONS);
        expect(
            readTheme(
                zip({
                    "_rels/.rels": relationships([MAIN_PART, "word/document.xml"]),
                    "word/_rels/document.xml.rels": relationships([THEME, "theme/theme1.xml"]),
                    "word/theme/theme1.xml": littleEndian,
                }),
            ),
        ).to.deep.equal(HARBOUR_OPTIONS);
    });

    it("should inflate only a package's relationships and its theme, so its other parts don't stop it", () => {
        const document = zip({
            "_rels/.rels": relationships([MAIN_PART, "word/document.xml"]),
            "word/_rels/document.xml.rels": relationships([THEME, "theme/theme1.xml"]),
            "word/document.xml": "<w:document/>",
            "word/theme/theme1.xml": HARBOUR,
        });
        expect(readTheme(damaging(document, "word/document.xml"))).to.deep.equal(HARBOUR_OPTIONS);
    });

    it("should read the theme of a document, with the colors and fonts `docx` gave it", async () => {
        const theme = readTheme(
            await Packer.toBuffer(
                new File({
                    theme: {
                        name: "Harbour",
                        colors: { accent1: "1F6F8B", dark1: "1B1B1B" },
                        fonts: { headings: "Cambria", body: { latin: "Calibri", scripts: { Jpan: "Meiryo" } } },
                    },
                    sections: [],
                }),
            ),
        );
        expect(theme.name).to.equal("Harbour");
        expect(theme.colors).to.deep.include({ dark1: "1B1B1B", accent1: "1F6F8B", accent2: "ED7D31" });
        // The system's window color, as `docx` writes it when no color is given
        expect(theme.colors).not.to.have.property("light1");
        expect(theme.fonts?.headings).to.deep.include({ latin: "Cambria" });
        expect(theme.fonts?.body).to.deep.include({ latin: "Calibri" });
        expect(theme.fonts?.body).to.have.nested.property("scripts.Jpan", "Meiryo");
        expect(theme.fonts?.body).to.have.nested.property("scripts.Hang", "맑은 고딕");
    });

    it("should read the theme of a presentation, a workbook or a theme file from its main part's relationships", () => {
        const presentation = zip({
            "_rels/.rels": relationships([MAIN_PART, "ppt/presentation.xml"]),
            "ppt/presentation.xml": "<p:presentation/>",
            // Relationships of other types first, and one with no type
            "ppt/_rels/presentation.xml.rels": relationships([`${THEME}x`, "theme/theme2.xml"], [THEME, "theme/theme1.xml"]).replace(
                "<Relationship ",
                '<Relationship Id="rId0" Target="theme/theme2.xml"/><Relationship ',
            ),
            "ppt/theme/theme1.xml": HARBOUR,
            "ppt/theme/theme2.xml": themeXml("", "Other"),
        });
        expect(readTheme(presentation)).to.deep.equal(HARBOUR_OPTIONS);

        // An Office theme (.thmx), as Office writes it, with the Strict types of its relationships
        const officeTheme = zip({
            "_rels/.rels": relationships([
                "http://purl.oclc.org/ooxml/officeDocument/relationships/officeDocument",
                "/theme\\theme/themeManager.xml",
            ]),
            "theme/theme/themeManager.xml": `<a:themeManager xmlns:a="${DRAWINGML}"/>`,
            "theme/theme/_rels/themeManager.xml.rels": relationships([
                "http://purl.oclc.org/ooxml/officeDocument/relationships/theme",
                "./../theme/theme1.xml",
            ]),
            "theme/theme/theme1.xml": HARBOUR,
        });
        expect(readTheme(officeTheme)).to.deep.equal(HARBOUR_OPTIONS);
    });

    it("should read the colors or fonts that Word saves on their own", () => {
        expect(
            readTheme(`<a:clrScheme xmlns:a="${DRAWINGML}" name="Harbour"><a:accent1><a:srgbClr val="1F6F8B"/></a:accent1></a:clrScheme>`),
        ).to.deep.equal({
            colors: { accent1: "1F6F8B" },
        });
        expect(
            readTheme(
                `<a:fontScheme xmlns:a="${DRAWINGML}" name="Harbour"><a:majorFont><a:latin typeface="Georgia"/></a:majorFont><a:minorFont><a:latin typeface="Verdana"/></a:minorFont></a:fontScheme>`,
            ),
        ).to.deep.equal({ fonts: { headings: { latin: "Georgia" }, body: { latin: "Verdana" } } });
    });

    it("should read system colors as their last value, other than the window text and window colors of the first dark and light colors", () => {
        const { colors } = readTheme(
            themeXml(
                colorScheme(
                    `<a:dk1><a:sysClr val="window" lastClr="FFFFFF"/></a:dk1><a:lt1><a:sysClr val="windowText" lastClr="000000"/></a:lt1>` +
                        `<a:dk2><a:sysClr val="windowText" lastClr="1b1b1b"/></a:dk2>`,
                ),
            ),
        );
        expect(colors).to.deep.equal({ dark1: "FFFFFF", light1: "000000", dark2: "1B1B1B" });
    });

    it("should leave out colors of kinds it doesn't read, colors that aren't 6-digit hex values, and elements that aren't colors", () => {
        const { colors } = readTheme(
            themeXml(
                colorScheme(
                    `<a:dk2><a:scrgbClr r="0" g="0" b="0"/></a:dk2><a:lt2><a:srgbClr val="FFF"/></a:lt2><a:accent1><a:sysClr val="window"/></a:accent1>` +
                        `<a:accent2></a:accent2><!-- a comment --><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:extLst/>`,
                ),
            ),
        );
        expect(colors).to.deep.equal({ accent3: "A5A5A5" });
    });

    it("should leave out fonts with no typeface, and fonts for scripts with no script or typeface", () => {
        const { fonts } = readTheme(
            themeXml(
                fontScheme(
                    `<a:ea typeface=""/><a:font script="Jpan"/><a:font typeface="Meiryo"/><a:font script="Hang" typeface=""/>`,
                    `<a:latin/><a:extLst/>`,
                ),
            ),
        );
        expect(fonts).to.deep.equal({ headings: { scripts: { Hang: "" } }, body: {} });
        expect(readTheme(themeXml(`<a:fontScheme name="Harbour"/>`)).fonts).to.deep.equal({ headings: {}, body: {} });
    });

    it("should leave out what a theme doesn't have", () => {
        expect(readTheme(`<a:theme xmlns:a="${DRAWINGML}"><a:themeElements/></a:theme>`)).to.deep.equal({});
        expect(readTheme(`<a:theme xmlns:a="${DRAWINGML}" name=""/>`)).to.deep.equal({});
    });

    it("should read a theme whatever the prefix of its namespace", () => {
        expect(
            readTheme(
                `<t:theme xmlns:t="${DRAWINGML}" name="Harbour"><t:themeElements><t:clrScheme name="Harbour"><t:accent1><t:srgbClr val="1F6F8B"/></t:accent1></t:clrScheme></t:themeElements></t:theme>`,
            ),
        ).to.deep.equal({ name: "Harbour", colors: { accent1: "1F6F8B" } });
        expect(
            readTheme(
                `<theme xmlns="${DRAWINGML}"><themeElements><clrScheme name="x"><dk2><srgbClr val="44546A"/></dk2></clrScheme></themeElements></theme>`,
            ),
        ).to.deep.equal({ colors: { dark2: "44546A" } });
    });

    it("should throw for XML that isn't a theme", () => {
        expect(() => readTheme(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>`)).to.throw(
            "Invalid theme: expected the XML of a theme, such as a document's word/theme/theme1.xml, but its root element is w:document",
        );
        expect(() => readTheme(`<?xml version="1.0"?>`)).to.throw("but its root element is missing");
        expect(() => readTheme(new TextEncoder().encode("not XML"))).to.throw("Invalid XML");
    });

    it("should throw for a zip file that isn't an Office file", () => {
        const message = "Invalid file: a zip file that isn't a Word, PowerPoint or Excel file or an Office theme (.thmx)";
        expect(() => readTheme(zip({ "theme1.xml": HARBOUR }))).to.throw(message);
        expect(() => readTheme(zip({ "_rels/.rels": relationships([THEME, "theme1.xml"]), "theme1.xml": HARBOUR }))).to.throw(message);
    });

    it("should throw for a file with no theme", () => {
        expect(() =>
            readTheme(zip({ "_rels/.rels": relationships([MAIN_PART, "word/document.xml"]), "word/document.xml": "<w:document/>" })),
        ).to.throw("The file has no theme: its main part, word/document.xml, refers to none");
        // A relationship to a theme that isn't in the file
        expect(() =>
            readTheme(
                zip({
                    "_rels/.rels": relationships([MAIN_PART, "word/document.xml"]),
                    "word/_rels/document.xml.rels": relationships([THEME, "theme/theme1.xml"]),
                }),
            ),
        ).to.throw("The file has no theme");
    });
});

describe("themePathOf", () => {
    it("should give the path of the theme a part refers to", () => {
        const files = new Map([["ppt/_rels/presentation.xml.rels", encodeUtf8(relationships([THEME, "../themes/ocean.xml"]))]]);
        expect(themePathOf(files, "ppt/presentation.xml")).to.equal("themes/ocean.xml");
        expect(themePathOf(files, "word/document.xml")).to.equal(undefined);
    });
});

describe("readThemeColorValues", () => {
    it("should read every color of a theme, with the first dark and light colors' last values when they are system colors", () => {
        expect(
            readThemeColorValues(
                themeXml(
                    colorScheme(
                        `<a:dk1><a:sysClr val="windowText" lastClr="1A1A1A"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FAFAFA"/></a:lt1>` +
                            `<a:accent1><a:srgbClr val="1f6f8b"/></a:accent1>`,
                    ),
                ),
            ),
        ).to.deep.equal({ dark1: "1A1A1A", light1: "FAFAFA", accent1: "1F6F8B" });
    });

    it("should read no colors from XML that isn't a theme, or a theme with no colors", () => {
        expect(readThemeColorValues(colorScheme(`<a:accent1><a:srgbClr val="1F6F8B"/></a:accent1>`))).to.deep.equal({});
        expect(readThemeColorValues(themeXml(""))).to.deep.equal({});
    });
});
