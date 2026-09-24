import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { readThemeColors } from "./theme-colors";

// cspell:ignore hlink Hlink eeece bacc FAFAFA

const RELATIONSHIPS = (target: string): string => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="${target}"/>
</Relationships>`;

const THEME = (scheme: string, prefix = "a"): string => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<${prefix}:theme xmlns:${prefix}="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
    <${prefix}:themeElements>
        <${prefix}:clrScheme name="Office">${scheme}</${prefix}:clrScheme>
    </${prefix}:themeElements>
</${prefix}:theme>`;

// Office 2007's colors, as Word 2007 wrote them in demo/assets/field-trip.docx
const OFFICE_2007_SCHEME = `
    <a:dk1><a:srgbClr val="000000"/></a:dk1>
    <a:lt1><a:srgbClr val="ffffff"/></a:lt1>
    <a:dk2><a:srgbClr val="1f497d"/></a:dk2>
    <a:lt2><a:srgbClr val="eeece1"/></a:lt2>
    <a:accent1><a:srgbClr val="4f81bd"/></a:accent1>
    <a:accent2><a:srgbClr val="c0504d"/></a:accent2>
    <a:accent3><a:srgbClr val="9bbb59"/></a:accent3>
    <a:accent4><a:srgbClr val="8064a2"/></a:accent4>
    <a:accent5><a:srgbClr val="4bacc6"/></a:accent5>
    <a:accent6><a:srgbClr val="f79646"/></a:accent6>
    <a:hlink><a:srgbClr val="0000ff"/></a:hlink>
    <a:folHlink><a:srgbClr val="800080"/></a:folHlink>
`;

const OFFICE_COLORS = {
    dark1: "000000",
    light1: "FFFFFF",
    dark2: "44546A",
    light2: "E7E6E6",
    accent1: "4472C4",
    accent2: "ED7D31",
    accent3: "A5A5A5",
    accent4: "FFC000",
    accent5: "5B9BD5",
    accent6: "70AD47",
    hyperlink: "0563C1",
    followedHyperlink: "954F72",
};

const createZip = (files: readonly (readonly [string, string | Uint8Array])[]): JSZip =>
    files.reduce((zip, [path, content]) => zip.file(path, content), new JSZip());

describe("readThemeColors", () => {
    it("should read every color of the document's theme, in capitals", async () => {
        const zip = createZip([
            ["word/_rels/document.xml.rels", RELATIONSHIPS("theme/theme1.xml")],
            ["word/theme/theme1.xml", THEME(OFFICE_2007_SCHEME)],
        ]);
        expect(await readThemeColors(zip)).to.deep.equal({
            dark1: "000000",
            light1: "FFFFFF",
            dark2: "1F497D",
            light2: "EEECE1",
            accent1: "4F81BD",
            accent2: "C0504D",
            accent3: "9BBB59",
            accent4: "8064A2",
            accent5: "4BACC6",
            accent6: "F79646",
            hyperlink: "0000FF",
            followedHyperlink: "800080",
        });
    });

    it("should read the last value of system colors, as Word writes the dark and light colors", async () => {
        const zip = createZip([
            ["word/_rels/document.xml.rels", RELATIONSHIPS("theme/theme1.xml")],
            [
                "word/theme/theme1.xml",
                THEME(
                    `<a:dk1><a:sysClr val="windowText" lastClr="1A1A1A"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FAFAFA"/></a:lt1>`,
                ),
            ],
        ]);
        expect(await readThemeColors(zip)).to.deep.equal({ ...OFFICE_COLORS, dark1: "1A1A1A", light1: "FAFAFA" });
    });

    it("should use Office's colors for colors the theme doesn't give, or gives in a way that isn't read", async () => {
        const zip = createZip([
            ["word/_rels/document.xml.rels", RELATIONSHIPS("theme/theme1.xml")],
            [
                "word/theme/theme1.xml",
                THEME(`
                <a:dk1><a:sysClr val="windowText"/></a:dk1>
                <a:dk2/>
                <a:lt2><a:srgbClr/></a:lt2>
                <a:accent1><a:prstClr val="red"/></a:accent1>
                <a:accent2><a:srgbClr val="red"/></a:accent2>
                <a:accent3><a:srgbClr val="12345"/></a:accent3>
                <a:accent4><a:srgbClr val="2E7D32"/></a:accent4>
                <a:extLst/>
            `),
            ],
        ]);
        expect(await readThemeColors(zip)).to.deep.equal({ ...OFFICE_COLORS, accent4: "2E7D32" });
    });

    it("should read a theme whose namespace has another prefix", async () => {
        const zip = createZip([
            ["word/_rels/document.xml.rels", RELATIONSHIPS("theme/theme1.xml")],
            ["word/theme/theme1.xml", THEME(`<d:accent1><d:srgbClr val="2E7D32"/></d:accent1>`, "d")],
        ]);
        expect(await readThemeColors(zip)).to.deep.equal({ ...OFFICE_COLORS, accent1: "2E7D32" });
    });

    it("should find the theme from the document's relationships", async () => {
        const zip = createZip([
            ["word/_rels/document.xml.rels", RELATIONSHIPS("/word/themes/custom.xml")],
            ["word/theme/theme1.xml", THEME(`<a:accent1><a:srgbClr val="111111"/></a:accent1>`)],
            ["word/themes/custom.xml", THEME(`<a:accent1><a:srgbClr val="2E7D32"/></a:accent1>`)],
        ]);
        expect(await readThemeColors(zip)).to.deep.equal({ ...OFFICE_COLORS, accent1: "2E7D32" });
    });

    it("should use Office's colors for a theme without a color scheme", async () => {
        const zip = createZip([
            ["word/_rels/document.xml.rels", RELATIONSHIPS("theme/theme1.xml")],
            [
                "word/theme/theme1.xml",
                `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements/></a:theme>`,
            ],
        ]);
        expect(await readThemeColors(zip)).to.deep.equal(OFFICE_COLORS);
    });

    it("should return undefined for a document without a theme", async () => {
        expect(await readThemeColors(createZip([]))).to.equal(undefined);
        expect(
            await readThemeColors(createZip([["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`]])),
        ).to.equal(undefined);
        expect(
            await readThemeColors(
                createZip([
                    [
                        "word/_rels/document.xml.rels",
                        `<Relationships><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"/></Relationships>`,
                    ],
                ]),
            ),
        ).to.equal(undefined);
    });

    it("should return undefined when the theme the relationships name isn't there", async () => {
        const zip = createZip([["word/_rels/document.xml.rels", RELATIONSHIPS("theme/theme1.xml")]]);
        expect(await readThemeColors(zip)).to.equal(undefined);
    });

    it("should leave a theme in UTF-16 unread, as the patcher leaves such parts", async () => {
        const theme = THEME(`<a:accent1><a:srgbClr val="2E7D32"/></a:accent1>`);
        const utf16 = (byteOrderMark: readonly number[], littleEndian: boolean): Uint8Array =>
            new Uint8Array([
                ...byteOrderMark,
                ...[...theme].flatMap((character) => (littleEndian ? [character.charCodeAt(0), 0] : [0, character.charCodeAt(0)])),
            ]);
        for (const [byteOrderMark, littleEndian] of [
            [[0xff, 0xfe], true],
            [[0xfe, 0xff], false],
        ] as const) {
            const zip = createZip([
                ["word/_rels/document.xml.rels", RELATIONSHIPS("theme/theme1.xml")],
                ["word/theme/theme1.xml", utf16(byteOrderMark, littleEndian)],
            ]);
            expect(await readThemeColors(zip)).to.equal(undefined);
        }
    });
});
