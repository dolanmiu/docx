import { describe, expect, it } from "vitest";

import { File } from "@file/file";
import type { IContext, IStylesOptions } from "docx";

import {
    WORD_DEFAULT_STYLES,
    fontOf,
    getTextStyles,
    hasDefaultParagraphSpacing,
    isEastAsianRun,
    pointsOf,
    readCellMargins,
    readParagraphFormat,
    readRunFormat,
    spansOf,
    styleChain,
    unknownLengthIn,
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

    it("should read a size and character spacing written with units, as docx writes them from strings", () => {
        const themeFonts = { headings: "Calibri Light", body: "Calibri" };
        expect(
            readRunFormat([{ "w:sz": { _attr: { "w:val": "12pt" } } }, { "w:spacing": { _attr: { "w:val": "-1pt" } } }], themeFonts),
        ).to.deep.equal({ size: 12, characterSpacing: -1 });
        // Word rounds a size in points down to a half-point, and ignores one in another unit (word-units2 V3)
        expect(readRunFormat([{ "w:sz": { _attr: { "w:val": "11.75pt" } } }], themeFonts)).to.deep.equal({ size: 11.5 });
        expect(readRunFormat([{ "w:sz": { _attr: { "w:val": "1cm" } } }], themeFonts)).to.deep.equal({});
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

    it("should read lengths written with units, such as an imported document may have where docx's options take only numbers", () => {
        expect(
            readParagraphFormat([
                { "w:spacing": { _attr: { "w:before": "6pt", "w:after": "0.25in", "w:line": "14pt", "w:lineRule": "exact" } } },
                { "w:ind": { _attr: { "w:left": "1in", "w:right": "-1in", "w:hanging": "18pt" } } },
                { "w:tabs": [{ "w:tab": { _attr: { "w:val": "left", "w:pos": "3in" } } }] },
            ]),
        ).to.deep.equal({
            spaceBefore: 6,
            spaceAfter: 18,
            lineSpacing: { rule: "exact", height: 14 },
            indentLeft: 72,
            indentRight: -72,
            firstLineIndent: -18,
            tabs: [{ position: 216, alignment: "left" }],
        });
        // A line spacing in lines is in 240ths of a line, as twips are: 12 points is a single line
        expect(readParagraphFormat([{ "w:spacing": { _attr: { "w:line": "18pt", "w:lineRule": "auto" } } }])).to.deep.equal({
            lineSpacing: { rule: "multiple", multiple: 1.5 },
        });
        expect(readCellMargins([{ "w:top": { _attr: { "w:w": "0.1in", "w:type": "dxa" } } }])).to.deep.equal({ top: 7.2 });
    });
});

describe("pointsOf", () => {
    it("should read a length in its attribute's own unit, as a number or as a string from an imported document", () => {
        expect(pointsOf(1440, 20)).to.equal(72);
        expect(pointsOf("-360", 20)).to.equal(-18);
        expect(pointsOf(24, 2)).to.equal(12);
        expect(pointsOf(undefined, 20)).to.equal(undefined);
        expect(pointsOf("auto", 20)).to.equal(undefined);
    });

    it("should read a length in a unit of OOXML's universal measure, as docx writes a length given as a string", () => {
        expect(pointsOf("1in", 20)).to.equal(72);
        expect(pointsOf("12pt", 2)).to.equal(12);
        expect(pointsOf("-6pt", 20)).to.equal(-6);
        expect(pointsOf("1pc", 20)).to.equal(12);
        expect(pointsOf("2pi", 20)).to.equal(24);
        expect(pointsOf("2.54cm", 20)).to.be.closeTo(72, 1e-9);
        expect(pointsOf("25.4mm", 20)).to.be.closeTo(72, 1e-9);
        expect(pointsOf("0.5in", 2)).to.equal(36);
    });

    it("should read a length that isn't a whole number of twips as Word does: rounded down from inches, points and picas", () => {
        // word-units2 V1 and V4, in twips
        expect(pointsOf("240.7pt", 20)! * 20).to.equal(4814);
        expect(pointsOf("240.04pt", 20)! * 20).to.equal(4800);
        expect(pointsOf("3.33375in", 20)! * 20).to.equal(4800);
        expect(pointsOf("20.0025pc", 20)! * 20).to.equal(4800);
        expect(pointsOf("0.0305in", 20)! * 20).to.equal(43);
        // Lengths that come to whole twips, which floating point makes a little less
        expect(pointsOf("0.7in", 20)! * 20).to.equal(1008);
        expect(pointsOf("0.35pt", 20)! * 20).to.equal(7);
    });

    it("should read a length that isn't a whole number of twips as Word does: to the nearest from centimeters and millimeters", () => {
        // word-units U7 and word-units2 V1: 4800.4 and 4800.6 twips
        expect(pointsOf("8.46737cm", 20)! * 20).to.equal(4800);
        expect(pointsOf("8.46772cm", 20)! * 20).to.equal(4801);
        expect(pointsOf("84.67724mm", 20)! * 20).to.equal(4801);
        expect(pointsOf("2.5cm", 20)! * 20).to.equal(1417);
    });

    it("should read a negative length's minus sign as Word does, as its whole number's only, with the fraction added", () => {
        // word-units2 V1: -10 points and 0.7 more, and 0 inches and 0.16708 more
        expect(pointsOf("-10.7pt", 20)! * 20).to.equal(-186);
        expect(pointsOf("-0.16708in", 20)! * 20).to.equal(240);
        expect(pointsOf("-6pt", 20)).to.equal(-6);
    });

    it("should read nothing from a unit without a number", () => {
        expect(pointsOf("xpt", 20)).to.equal(undefined);
        expect(pointsOf("in", 20)).to.equal(undefined);
    });
});

describe("unknownLengthIn", () => {
    it("should find a size in a unit other than points, and a negative fraction of a centimeter or millimeter, in any element", () => {
        const size = (val: string): object => ({ "w:rPr": [{ "w:sz": { _attr: { "w:val": val } } }] });
        expect(unknownLengthIn([{ "w:p": [{ "w:r": [size("1pc")] }] }])).to.equal("a size given in a unit other than points");
        expect(unknownLengthIn({ "w:szCs": { _attr: { "w:val": "1cm" } } })).to.equal("a size given in a unit other than points");
        expect(unknownLengthIn({ "w:ind": { _attr: { "w:left": "-1.5cm" } } })).to.equal(
            "a negative length of a fraction of a centimeter or millimeter",
        );
        expect(unknownLengthIn([size("11.5pt"), size("23"), { "w:ind": { _attr: { "w:left": "-1cm", "w:right": "-1.5in" } } }])).to.equal(
            undefined,
        );
        expect(unknownLengthIn([{ "w:t": ["-1.5cm"] }, "text"])).to.equal(undefined);
    });

    it("should find one in the styles as they are read", () => {
        const styles = stylesOf({ paragraphStyles: [{ id: "Small", name: "Small", run: { size: "0.1in" } }] });
        expect(styles.unsupported).to.equal("a size given in a unit other than points");
        expect(stylesOf({}).unsupported).to.equal(undefined);
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

    it("should read the fonts, size, boldness and italics of East Asian text and complex scripts, and the run's direction and language", () => {
        expect(
            readRunFormat(
                [
                    { "w:rFonts": { _attr: { "w:ascii": "Arial", "w:eastAsia": "MS Mincho", "w:cs": "Times New Roman" } } },
                    { "w:b": {} },
                    { "w:bCs": { _attr: { "w:val": "0" } } },
                    { "w:iCs": {} },
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
            complexScriptItalic: true,
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

describe("isEastAsianRun", () => {
    it("should be whether a run has an East Asian font or language", () => {
        expect(isEastAsianRun({ eastAsiaFont: "SimSun" })).to.equal(true);
        expect(isEastAsianRun({ eastAsiaFont: "Calibri", eastAsianLanguage: "ko-KR" })).to.equal(true);
        expect(isEastAsianRun({ eastAsiaFont: "Calibri", eastAsianLanguage: "en-US" })).to.equal(false);
        expect(isEastAsianRun({})).to.equal(false);
    });
});

describe("spansOf", () => {
    // cspell:disable
    it("should put Chinese, Japanese and Korean in the run's East Asian font, or in MS Mincho where that has none, as Word does", () => {
        expect(spansOf("ab永永", { font: "Calibri", size: 12, eastAsiaFont: "Yu Mincho" })).to.deep.equal([
            { font: "Calibri", size: 12, text: "ab" },
            { font: "Yu Mincho", size: 12, text: "永永" },
        ]);
        expect(spansOf("永a", { font: "Calibri", eastAsiaFont: "Calibri" })).to.deep.equal([
            { font: "MS Mincho", text: "永" },
            { font: "Calibri", text: "a" },
        ]);
    });

    it("should put all of a right-to-left run in the font, size, boldness and italics of complex scripts, and Hebrew in other runs in the run's", () => {
        const format = { font: "Calibri", size: 11, bold: true, italic: true, complexScriptFont: "Arial", complexScriptSize: 14 };
        expect(spansOf("ab שלום", { ...format, rightToLeft: true })).to.deep.equal([{ font: "Arial", size: 14, text: "ab שלום" }]);
        expect(spansOf("ab", { ...format, complexScript: true, complexScriptBold: true, complexScriptItalic: true })).to.deep.equal([
            { font: "Arial", size: 14, bold: true, italic: true, text: "ab" },
        ]);
        expect(spansOf("שלום", format)).to.deep.equal([{ font: "Calibri", size: 11, bold: true, italic: true, text: "שלום" }]);
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
