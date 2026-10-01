import { describe, expect, it } from "vitest";

import { File } from "@file/file";
import type { IContext, IStylesOptions } from "docx";

import {
    WORD_DEFAULT_STYLES,
    fontOf,
    getTextStyles,
    hasDefaultParagraphSpacing,
    readParagraphFormat,
    readRunFormat,
    spansOf,
    styleChain,
} from "./text-styles";

const contextOf = (file: File): IContext => ({ file, stack: [] }) as unknown as IContext;

const stylesOf = (styles: IStylesOptions & { readonly default?: object }): ReturnType<typeof getTextStyles> =>
    getTextStyles(contextOf(new File({ styles, sections: [] })));

describe("getTextStyles", () => {
    it("should use Word's defaults when the context has no document", () => {
        expect(getTextStyles({ stack: [] } as unknown as IContext)).to.equal(WORD_DEFAULT_STYLES);
    });

    it("should read the document's default run and paragraph formatting", () => {
        const styles = stylesOf({
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 160, line: 259 } } } },
        });
        // A font given by name is the font of East Asian text and of complex scripts too, and a size the size of both
        expect(styles.run).to.deep.equal({
            font: "Calibri",
            size: 11,
            eastAsiaFont: "Calibri",
            complexScriptFont: "Calibri",
            complexScriptSize: 11,
        });
        expect(styles.paragraph).to.deep.equal({ spaceAfter: 8, lineSpacing: { rule: "multiple", multiple: 259 / 240 } });
    });

    it("should read the styles of a document once", () => {
        const context = contextOf(new File({ sections: [] }));
        expect(getTextStyles(context)).to.equal(getTextStyles(context));
    });

    it("should use the style marked as the default, which is Normal unless another is", () => {
        // docx writes Normal as the default paragraph style, and one in paragraphStyles takes its place
        expect(stylesOf({}).defaultParagraphStyle).to.equal("Normal");
        expect(stylesOf({ paragraphStyles: [{ id: "Normal", name: "Normal" }] }).defaultParagraphStyle).to.equal("Normal");
        // A character style called Normal isn't the default for paragraphs, and replaces docx's Normal, as ids are unique
        expect(stylesOf({ characterStyles: [{ id: "Normal", name: "Normal" }] }).defaultParagraphStyle).to.equal(undefined);

        const imported = getTextStyles(
            contextOf(
                new File({
                    externalStyles: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:default="1" w:styleId="Body"><w:name w:val="Body"/></w:style>
    <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
    <w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/></w:style>
    <w:style w:type="character" w:default="0" w:styleId="Other"><w:name w:val="Other"/></w:style>
    <w:style w:type="table"><w:name w:val="No id"/></w:style>
</w:styles>`,
                    sections: [],
                }),
            ),
        );
        expect(imported.defaultParagraphStyle).to.equal("Body");
        expect(imported.defaultCharacterStyle).to.equal("DefaultParagraphFont");
    });

    it("should take a style without a type as a paragraph style, as the schema does and as Styles writes it", () => {
        const styles = getTextStyles(
            contextOf(
                new File({
                    externalStyles: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:default="1" w:styleId="Body"><w:name w:val="Body"/><w:rPr><w:sz w:val="28"/></w:rPr></w:style>
    <w:style w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Body"/><w:rPr><w:b/></w:rPr></w:style>
</w:styles>`,
                    sections: [],
                }),
            ),
        );
        expect(styles.defaultParagraphStyle).to.equal("Body");
        // Quote is based on Body, and neither has a type
        expect(styleChain(styles, "Quote", "paragraph").map(({ run }) => run)).to.deep.equal([{ size: 14 }, { bold: true }]);
    });

    it("should read styles imported from another document, whose values are text", () => {
        const styles = getTextStyles(
            contextOf(
                new File({
                    externalStyles: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:docDefaults>
        <w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:hAnsi="Aptos"/><w:sz w:val="24"/><w:b w:val="0"/></w:rPr></w:rPrDefault>
        <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="278" w:lineRule="auto"/></w:pPr></w:pPrDefault>
    </w:docDefaults>
    <w:style w:type="paragraph" w:styleId="Quote">
        <w:name w:val="Quote"/>
        <w:pPr><w:spacing w:before="120" w:line="300" w:lineRule="exact"/><w:ind w:start="720" w:end="360" w:hanging="360"/><w:contextualSpacing/></w:pPr>
        <w:rPr><w:caps w:val="off"/><w:spacing w:val="10"/><w:w w:val="90"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Tall">
        <w:name w:val="Tall"/>
        <w:pPr><w:spacing w:line="480" w:lineRule="atLeast"/><w:ind w:left="100" w:right="200" w:firstLine="300"/></w:pPr>
        <w:rPr><w:rFonts w:ascii="Arial"/><w:vanish/><w:smallCaps w:val="true"/></w:rPr>
    </w:style>
</w:styles>`,
                    sections: [],
                }),
            ),
        );
        // The theme's font for body text takes the place of the font named beside it
        expect(styles.run).to.deep.equal({ font: "Calibri", size: 12, bold: false });
        expect(styles.paragraph).to.deep.equal({ spaceAfter: 8, lineSpacing: { rule: "multiple", multiple: 278 / 240 } });
        expect(styles.styles.get("Quote")).to.deep.equal({
            type: "paragraph",
            name: "Quote",
            basedOn: undefined,
            run: { allCaps: false, characterSpacing: 0.5, scale: 90 },
            paragraph: {
                spaceBefore: 6,
                lineSpacing: { rule: "exact", height: 15 },
                indentLeft: 36,
                indentRight: 18,
                firstLineIndent: -18,
                contextualSpacing: true,
            },
        });
        expect(styles.styles.get("Tall")).to.deep.equal({
            type: "paragraph",
            name: "Tall",
            basedOn: undefined,
            run: { font: "Arial", hidden: true, smallCaps: true },
            paragraph: { lineSpacing: { rule: "atLeast", height: 24 }, indentLeft: 5, indentRight: 10, firstLineIndent: 15 },
        });
    });

    it("should read the margins table styles give cells, and which table style is the default", () => {
        const styles = getTextStyles(
            contextOf(
                new File({
                    externalStyles: `<w:styles xmlns:w="main">
    <w:style w:type="table" w:styleId="Padded">
        <w:basedOn w:val="TableNormal"/>
        <w:tblPr><w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:start w:w="200" w:type="dxa"/></w:tblCellMar></w:tblPr>
    </w:style>
</w:styles>`,
                    sections: [],
                }),
            ),
        );
        // docx's Normal Table, with the margins Word gives the tables it makes
        expect(styles.defaultTableStyle).to.equal("TableNormal");
        expect(styles.styles.get("TableNormal")?.cellMargins).to.deep.equal({ top: 0, bottom: 0, left: 5.4, right: 5.4 });
        expect(styles.styles.get("Padded")?.cellMargins).to.deep.equal({ top: 2.5, left: 10 });
        // Other styles have none
        expect(styles.styles.get("Normal")).not.to.have.property("cellMargins");
    });

    it("should read the fonts of the document's theme where styles and text use them", () => {
        const styles = getTextStyles(
            contextOf(
                new File({
                    theme: { fonts: { headings: "Arial", body: { latin: "Georgia", eastAsia: "Yu Mincho" } } },
                    styles: {
                        default: { document: { run: { font: { theme: "body" } } }, heading1: { run: { font: { theme: "headings" } } } },
                    },
                    sections: [],
                }),
            ),
        );
        expect(styles.themeFonts).to.deep.equal({ headings: "Arial", body: "Georgia" });
        expect(styles.run.font).to.equal("Georgia");
        expect(styles.styles.get("Heading1")?.run.font).to.equal("Arial");

        // Text in a theme font of its own
        expect(readRunFormat([{ "w:rFonts": { _attr: { "w:asciiTheme": "minorHAnsi" } } }], styles.themeFonts)).to.deep.equal({
            font: "Georgia",
        });
    });

    it("should read the theme's fonts for Latin text beside fonts named for it, and leave out theme fonts that aren't known", () => {
        const styles = getTextStyles(
            contextOf(
                new File({
                    externalStyles: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:styleId="Named"><w:name w:val="Named"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsiTheme="majorHAnsi"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="HighAnsi"><w:name w:val="HighAnsi"/><w:rPr><w:rFonts w:hAnsiTheme="majorHAnsi"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="Unknown"><w:name w:val="Unknown"/><w:rPr><w:rFonts w:asciiTheme="other" w:hAnsi="Tahoma"/></w:rPr></w:style>
</w:styles>`,
                    sections: [],
                }),
            ),
        );
        expect(styles.styles.get("Named")?.run.font).to.equal("Arial");
        expect(styles.styles.get("HighAnsi")?.run.font).to.equal("Calibri Light");
        expect(styles.styles.get("Unknown")?.run.font).to.equal("Tahoma");
    });
});

describe("readRunFormat", () => {
    it("should read italic text, which a measurer that measures with the fonts themselves measures in their italics", () => {
        const themeFonts = { headings: "Calibri Light", body: "Calibri" };
        expect(readRunFormat([{ "w:i": {} }], themeFonts)).to.deep.equal({ italic: true });
        expect(readRunFormat([{ "w:i": { _attr: { "w:val": false } } }], themeFonts)).to.deep.equal({ italic: false });
        expect(fontOf({ font: "Arial", size: 12, italic: true, allCaps: true })).to.deep.equal({ font: "Arial", size: 12, italic: true });
    });
});

describe("hasDefaultParagraphSpacing", () => {
    it("should be whether a paragraph without formatting has space before or after it", () => {
        expect(hasDefaultParagraphSpacing(WORD_DEFAULT_STYLES)).to.equal(false);
        expect(hasDefaultParagraphSpacing(stylesOf({ default: { document: { paragraph: { spacing: { after: 160 } } } } }))).to.equal(true);
        expect(
            hasDefaultParagraphSpacing(
                stylesOf({ paragraphStyles: [{ id: "Normal", name: "Normal", paragraph: { spacing: { before: 60 } } }] }),
            ),
        ).to.equal(true);
        expect(hasDefaultParagraphSpacing(stylesOf({ default: { document: { paragraph: { spacing: { line: 276 } } } } }))).to.equal(false);
    });
});

describe("readParagraphFormat", () => {
    it("should read the settings that keep lines together or break pages, and the tab stops", () => {
        const tab = (attributes: Record<string, unknown>): object => ({ "w:tab": { _attr: attributes } });
        expect(
            readParagraphFormat([
                { "w:keepNext": {} },
                { "w:keepLines": { _attr: { "w:val": false } } },
                { "w:pageBreakBefore": {} },
                { "w:widowControl": { _attr: { "w:val": "0" } } },
                { "w:tabs": [tab({ "w:val": "end", "w:pos": 200 }), tab({ "w:val": "num", "w:pos": "400" }), tab({ "w:val": "unknown" })] },
            ]),
        ).to.deep.equal({
            keepNext: true,
            keepLines: false,
            pageBreakBefore: true,
            widowControl: false,
            tabs: [
                { position: 10, alignment: "right" },
                { position: 20, alignment: "left" },
                { position: 0, alignment: "left" },
            ],
        });
    });
});

describe("readParagraphFormat with East Asian typography", () => {
    it("should read whether characters are kept from starting or ending lines, and whether lines break between words", () => {
        expect(
            readParagraphFormat([{ "w:kinsoku": { _attr: { "w:val": "0" } } }, { "w:wordWrap": { _attr: { "w:val": 0 } } }]),
        ).to.deep.equal({
            kinsoku: false,
            wordWrap: false,
        });
    });
});

describe("readRunFormat with East Asian text and complex scripts", () => {
    const THEME = { headings: "Cambria", body: "Calibri" };

    it("should read the fonts, size and boldness of East Asian text and complex scripts, and the run's direction and language", () => {
        expect(
            readRunFormat(
                [
                    { "w:rFonts": { _attr: { "w:ascii": "Arial", "w:eastAsia": "MS Mincho", "w:cs": "Times New Roman" } } },
                    { "w:b": {} },
                    { "w:bCs": { _attr: { "w:val": "0" } } },
                    { "w:sz": { _attr: { "w:val": 22 } } },
                    { "w:szCs": { _attr: { "w:val": "28" } } },
                    { "w:rtl": {} },
                    { "w:cs": {} },
                    { "w:lang": { _attr: { "w:val": "en-US", "w:eastAsia": "ja-JP" } } },
                ],
                THEME,
            ),
        ).to.deep.equal({
            font: "Arial",
            size: 11,
            bold: true,
            eastAsiaFont: "MS Mincho",
            complexScriptFont: "Times New Roman",
            complexScriptSize: 14,
            complexScriptBold: false,
            rightToLeft: true,
            complexScript: true,
            eastAsianLanguage: "ja-JP",
        });
    });

    it("should read the theme's fonts for East Asian text and complex scripts", () => {
        expect(
            readRunFormat([{ "w:rFonts": { _attr: { "w:eastAsiaTheme": "minorEastAsia", "w:cstheme": "majorBidi" } } }], THEME),
        ).to.deep.equal({
            eastAsiaFont: "Calibri",
            complexScriptFont: "Cambria",
        });
    });
});

describe("spansOf", () => {
    // cspell:disable
    it("should put Chinese, Japanese and Korean in the run's East Asian font, or in MS Mincho where that has none, as Word does", () => {
        expect(spansOf("ab永永", { font: "Calibri", size: 12, eastAsiaFont: "Yu Mincho" })).to.deep.equal([
            // The run is East Asian, by its font, so its words break anywhere with word wrap off
            { font: "Calibri", size: 12, text: "ab", eastAsian: true },
            { font: "Yu Mincho", size: 12, text: "永永", eastAsian: true },
        ]);
        expect(spansOf("永a", { font: "Calibri", eastAsiaFont: "Calibri" })).to.deep.equal([
            { font: "MS Mincho", text: "永" },
            { font: "Calibri", text: "a" },
        ]);
    });

    it("should put all of a right-to-left run in the font, size and boldness of complex scripts, and Hebrew in other runs in the run's", () => {
        const format = { font: "Calibri", size: 11, bold: true, complexScriptFont: "Arial", complexScriptSize: 14 };
        expect(spansOf("ab שלום", { ...format, rightToLeft: true })).to.deep.equal([{ font: "Arial", size: 14, text: "ab שלום" }]);
        expect(spansOf("ab", { ...format, complexScript: true, complexScriptBold: true })).to.deep.equal([
            { font: "Arial", size: 14, bold: true, text: "ab" },
        ]);
        expect(spansOf("שלום", format)).to.deep.equal([{ font: "Calibri", size: 11, bold: true, text: "שלום" }]);
    });

    it("should give each span the run's East Asian language, and mark the runs of an East Asian language as East Asian", () => {
        expect(spansOf("a永", { font: "Calibri", eastAsianLanguage: "zh-CN" })).to.deep.equal([
            { font: "Calibri", text: "a", language: "zh-CN", eastAsian: true },
            { font: "MS Mincho", text: "永", language: "zh-CN", eastAsian: true },
        ]);
        expect(spansOf("a", { eastAsianLanguage: "en-US" })).to.deep.equal([{ text: "a", language: "en-US" }]);
    });

    it("should keep marks in the font of the character they are on, and write capitals and small capitals in each font", () => {
        expect(spansOf("\u0301か\u3099a", {})).to.deep.equal([{ text: "\u0301" }, { font: "MS Mincho", text: "か\u3099" }, { text: "a" }]);
        expect(spansOf("ab永", { allCaps: true, size: 10 })).to.deep.equal([
            { size: 10, text: "AB" },
            { font: "MS Mincho", size: 10, text: "永" },
        ]);
        expect(spansOf("aB永", { smallCaps: true })).to.deep.equal([
            { size: 8, text: "A" },
            { text: "B" },
            { font: "MS Mincho", text: "永" },
        ]);
        expect(spansOf("a", { hidden: true })).to.deep.equal([]);
    });
    // cspell:enable
});
