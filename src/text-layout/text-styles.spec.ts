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
    unknownRunFormatting,
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
        <w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:hAnsi="Aptos"/><w:kern w:val="2"/><w:sz w:val="24"/><w:b w:val="0"/></w:rPr></w:rPrDefault>
        <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="278" w:lineRule="auto"/></w:pPr></w:pPrDefault>
    </w:docDefaults>
    <w:style w:type="paragraph" w:styleId="Quote">
        <w:name w:val="Quote"/>
        <w:pPr><w:spacing w:before="120" w:line="300" w:lineRule="exact"/><w:ind w:start="720" w:end="360" w:hanging="360"/><w:contextualSpacing/></w:pPr>
        <w:rPr><w:i/><w:caps w:val="off"/><w:spacing w:val="10"/><w:w w:val="90"/></w:rPr>
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
        // The theme's font for body text takes the place of the font named beside it. Text is kerned from 1 point, as in
        // Word's own defaults
        expect(styles.run).to.deep.equal({ font: "Calibri", size: 12, bold: false, kerning: 1 });
        expect(styles.paragraph).to.deep.equal({ spaceAfter: 8, lineSpacing: { rule: "multiple", multiple: 278 / 240 } });
        expect(styles.styles.get("Quote")).to.deep.equal({
            type: "paragraph",
            name: "Quote",
            basedOn: undefined,
            run: { italic: true, allCaps: false, characterSpacing: 0.5, scale: 90 },
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

    it("should read the size kerning starts at, in half-points or with its unit", () => {
        expect(readRunFormat([{ "w:kern": { _attr: { "w:val": 28 } } }], WORD_DEFAULT_STYLES.themeFonts)).to.deep.equal({ kerning: 14 });
        expect(readRunFormat([{ "w:kern": { _attr: { "w:val": "1.5pt" } } }], WORD_DEFAULT_STYLES.themeFonts)).to.deep.equal({
            kerning: 1.5,
        });
        expect(readRunFormat([{ "w:i": {} }], WORD_DEFAULT_STYLES.themeFonts)).to.deep.equal({ italic: true });
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

describe("run formatting", () => {
    const themeFonts = { headings: "Calibri Light", body: "Calibri" };
    const border = (attributes: object): object => ({ "w:bdr": { _attr: attributes } });

    it("should read superscript and subscript, raised and lowered text, emphasis marks and a border", () => {
        expect(
            readRunFormat(
                [
                    { "w:vertAlign": { _attr: { "w:val": "superscript" } } },
                    { "w:position": { _attr: { "w:val": -12 } } },
                    { "w:em": { _attr: { "w:val": "dot" } } },
                    border({ "w:val": "single", "w:sz": 4, "w:space": 4, "w:color": "auto" }),
                ],
                themeFonts,
            ),
        ).to.deep.equal({
            verticalAlign: "superscript",
            position: -6,
            emphasisMark: "dot",
            // Read as a paragraph's border is
            border: {
                style: "single",
                size: 4,
                space: 4,
                shadow: false,
                frame: false,
                key: '[["w:color","auto"],["w:space","4"],["w:sz","4"],["w:val","single"]]',
            },
        });
        // "baseline" turns a style's superscript off
        expect(readRunFormat([{ "w:vertAlign": { _attr: { "w:val": "baseline" } } }], themeFonts)).to.deep.equal({
            verticalAlign: "baseline",
        });
    });

    it("should read a position written with a unit as Word does, as docx writes it: rounded down to a half-point", () => {
        // word-run-formatting.ts RF5f to RF5k: 6 points, 2.75 as 2.5, 0.1 inches as 7 points, 3 millimeters as 8.5, a pica
        const positions = ["6pt", "-6pt", "2.75pt", "0.1in", "3mm", "1pc"].map(
            (value) => readRunFormat([{ "w:position": { _attr: { "w:val": value } } }], themeFonts).position,
        );
        expect(positions).to.deep.equal([6, -6, 2.5, 7, 8.5, 12]);
    });

    it("should draw superscript and subscript at 65% of the size, to the nearest half-point and down from a quarter, in a line of the size", () => {
        // word-run-formatting.ts RF1: 10 points are 6.5, 9 are 6, 7.5 are 5, 12 are 8, 13 are 8.5, 11 are 7, and 5, 15 and
        // 25 points are 3, 9.5 and 16, where 65% is a quarter point
        const drawn = [10, 9, 7.5, 12, 13, 11, 5, 15, 25].map((size) => fontOf({ size, verticalAlign: "superscript" }).size);
        expect(drawn).to.deep.equal([6.5, 6, 5, 8, 8.5, 7, 3, 9.5, 16]);
        expect(fontOf({ font: "Arial", size: 15, verticalAlign: "subscript" })).to.deep.equal({ font: "Arial", size: 9.5, lineSize: 15 });
        // Word's default size, 10 points, without one
        expect(fontOf({ verticalAlign: "superscript" })).to.deep.equal({ size: 6.5, lineSize: 10 });
        expect(fontOf({ size: 11, verticalAlign: "baseline" })).to.deep.equal({ size: 11 });
        // In each of a run's fonts
        expect(spansOf("a永", { size: 20, verticalAlign: "superscript" })).to.deep.equal([
            { size: 13, lineSize: 20, text: "a" },
            { font: "MS Mincho", size: 13, lineSize: 20, text: "永" },
        ]);
    });

    it("should draw small capitals at 80% of the size, to the nearest half-point, and at 80% of superscript's", () => {
        // word-run-formatting.ts RF4: 12 points are 9.5, 13 are 10.5, 7 are 5.5 and 11 are 9; in superscript at 12 points, 6.5
        const small = (format: Parameters<typeof spansOf>[1]): unknown =>
            spansOf("a", format).map(({ size, lineSize }) => [size, lineSize]);
        expect([12, 13, 7, 11].map((size) => small({ size, smallCaps: true }))).to.deep.equal([
            [[9.5, 12]],
            [[10.5, 13]],
            [[5.5, 7]],
            [[9, 11]],
        ]);
        expect(small({ size: 12, smallCaps: true, verticalAlign: "superscript" })).to.deep.equal([[6.5, 12]]);
    });

    it("should carry how far text is raised, its border's room and its emphasis marks into the font it is laid out in", () => {
        const single = { style: "single", size: 4, space: 4, shadow: false, frame: false, key: "single" };
        expect(fontOf({ position: 3, border: single, emphasisMark: "dot" })).to.deep.equal({
            raise: 3,
            border: { room: 4.5, key: "single" },
            emphasis: "above",
        });
        // A double border is three times its width and a triple five, and one of no style takes its space (RF7d, RF7e, RF7h)
        expect(fontOf({ border: { ...single, style: "double", size: 6, space: 0 } }).border?.room).to.equal(2.25);
        expect(fontOf({ border: { ...single, style: "triple", size: 4, space: 0 } }).border?.room).to.equal(2.5);
        expect(fontOf({ border: { ...single, style: "none", size: 200 } }).border?.room).to.equal(4);
        // No room, no raise and no marks
        expect(fontOf({ position: 0, border: { ...single, style: "none", space: 0 }, emphasisMark: "none" })).to.deep.equal({});
        expect(fontOf({ emphasisMark: "underDot" })).to.deep.equal({ emphasis: "below" });
        expect(fontOf({ emphasisMark: "comma" }).emphasis).to.equal("above");
    });

    it("should give a border round a run the room of a paragraph's border of its style", () => {
        // word-run-formatting2.ts RF12, in twips: dots, dashes, thick, outset and inset of half a point take 10, as single
        // does; waves of 3/4 of a point 60 and 105, whatever their width; thin and thick lines of half a point 40, 40, 40, 40
        // and 70, as `word-paragraph-formats.docx` B6 has them for paragraphs; and one of "nil" with a space nothing
        const twips = (style: string, size = 4, space = 0): number | undefined => {
            const room = fontOf({ border: { style, size, space, shadow: false, frame: false, key: style } }).border?.room;
            return room === undefined ? undefined : room * 20;
        };
        expect(
            ["dotted", "dashed", "dashSmallGap", "dotDash", "dotDotDash", "thick", "outset", "inset"].map((style) => twips(style)),
        ).to.deep.equal([10, 10, 10, 10, 10, 10, 10, 10]);
        expect([twips("wave", 6), twips("doubleWave", 6)]).to.deep.equal([60, 105]);
        expect(
            ["thinThickSmallGap", "thickThinSmallGap", "threeDEmboss", "threeDEngrave", "thinThickThinSmallGap"].map((style) =>
                twips(style),
            ),
        ).to.deep.equal([40, 40, 40, 40, 70]);
        expect(twips("nil", 4, 4)).to.equal(undefined);
    });

    it("should stop at a border whose room isn't known, and at emphasis marks of a kind the schema doesn't have", () => {
        const single = { style: "single", size: 4, space: 4, shadow: false, frame: false, key: "single" };
        const unknown = "a run border of a style, width or space not yet followed";
        expect(unknownRunFormatting({ border: single, emphasisMark: "circle" })).to.equal(undefined);
        expect(unknownRunFormatting({ border: { ...single, style: "nil", shadow: true } })).to.equal(undefined);
        expect(unknownRunFormatting({ border: { ...single, shadow: true } })).to.equal("a run border with a shadow or drawn as a frame");
        expect(unknownRunFormatting({ border: { ...single, frame: true } })).to.equal("a run border with a shadow or drawn as a frame");
        // A style Word hasn't been seen to draw, thin and thick lines wider than 2¼ points, and a border without a width,
        // narrower or wider than Word draws, or further from the text
        expect(unknownRunFormatting({ border: { ...single, style: "thinThickMediumGap" } })).to.equal(unknown);
        expect(unknownRunFormatting({ border: { ...single, style: "thinThickSmallGap", size: 24 } })).to.equal(unknown);
        expect(unknownRunFormatting({ border: { ...single, size: undefined } })).to.equal(unknown);
        expect(unknownRunFormatting({ border: { ...single, size: 1 } })).to.equal(unknown);
        expect(unknownRunFormatting({ border: { ...single, size: 97 } })).to.equal(unknown);
        expect(unknownRunFormatting({ border: { ...single, space: 32 } })).to.equal(unknown);
        expect(unknownRunFormatting({ emphasisMark: "star" })).to.equal("emphasis marks of a kind that isn't known");
        expect(fontOf({ border: { ...single, style: "thinThickMediumGap" } })).to.deep.equal({});
    });
});

describe("OpenType features", () => {
    const themeFonts = { headings: "Calibri Light", body: "Calibri" };
    const w14 = (name: string, value?: string): object => ({ [`w14:${name}`]: value === undefined ? {} : { _attr: { "w14:val": value } } });

    it("should keep the language of kerned text, and text with ligatures, in its font, as Word kerns only within one", () => {
        const format = readRunFormat([{ "w:lang": { _attr: { "w:val": "fr-FR" } } }], themeFonts);
        expect(format).to.deep.equal({ language: "fr-FR" });
        expect(fontOf(format)).to.deep.equal({});
        expect(fontOf({ ...format, kerning: 1 })).to.deep.equal({ kerning: 1, language: "fr-FR" });
        expect(fontOf({ ...format, ligatures: "standard" })).to.deep.equal({ ligatures: "standard", language: "fr-FR" });
    });

    it("should read the ligatures text has, as Word's Normal template has them, into the font it is measured in", () => {
        const format = readRunFormat([w14("ligatures", "standardContextual")], themeFonts);
        expect(format).to.deep.equal({ ligatures: "standardContextual" });
        expect(fontOf({ ...format, size: 11 })).to.deep.equal({ size: 11, ligatures: "standardContextual" });
        // None, as without them
        expect(fontOf(readRunFormat([w14("ligatures", "none")], themeFonts))).to.deep.equal({});
    });

    it("should read the other OpenType features Word draws text with, and stop at them, as their widths aren't known", () => {
        const format = readRunFormat(
            [
                w14("numForm", "oldStyle"),
                w14("numSpacing", "proportional"),
                { "w14:stylisticSets": [{ "w14:styleSet": {} }] },
                w14("cntxtAlts"),
            ],
            themeFonts,
        );
        expect(format).to.deep.equal({
            numberForm: "oldStyle",
            numberSpacing: "proportional",
            stylisticSets: true,
            contextualAlternates: true,
        });
        expect(unknownRunFormatting(format)).to.equal("OpenType number forms or spacing");
        expect(unknownRunFormatting({ numberSpacing: "tabular" })).to.equal("OpenType number forms or spacing");
        expect(unknownRunFormatting({ stylisticSets: true })).to.equal("OpenType stylistic sets or contextual alternates");
        expect(unknownRunFormatting({ contextualAlternates: true })).to.equal("OpenType stylistic sets or contextual alternates");
        // The font's own forms, no sets and contextual alternates turned off are as without them
        const off = readRunFormat(
            [w14("numForm", "default"), w14("numSpacing", "default"), { "w14:stylisticSets": {} }, w14("cntxtAlts", "0")],
            themeFonts,
        );
        expect(off).to.deep.equal({ numberForm: "default", numberSpacing: "default", stylisticSets: false, contextualAlternates: false });
        expect(unknownRunFormatting(off)).to.equal(undefined);
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

    it("should read how its lines line up, which decides whether Word squeezes their spaces", () => {
        const alignment = (value: string): unknown => readParagraphFormat([{ "w:jc": { _attr: { "w:val": value } } }]).alignment;
        expect(["start", "left", "numTab"].map(alignment)).to.deep.equal(["left", "left", "left"]);
        expect(["center", "end", "right"].map(alignment)).to.deep.equal(["center", "right", "right"]);
        expect(["both", "distribute"].map(alignment)).to.deep.equal(["justified", "distributed"]);
        expect(["lowKashida", "mediumKashida", "highKashida", "thaiDistribute"].map(alignment)).to.deep.equal([
            "lowKashida",
            "mediumKashida",
            "highKashida",
            "thaiDistributed",
        ]);
        expect(alignment("unknown")).to.equal(undefined);
        expect(readParagraphFormat([])).to.deep.equal({});
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

    it("should read automatic spacing, spacing in lines and indents in characters beside those in twips", () => {
        expect(
            readParagraphFormat([
                {
                    "w:spacing": {
                        _attr: {
                            "w:before": 100,
                            "w:beforeLines": "50",
                            "w:afterLines": 100,
                            "w:beforeAutospacing": "1",
                            "w:afterAutospacing": "off",
                        },
                    },
                },
                { "w:ind": { _attr: { "w:left": 720, "w:leftChars": "400", "w:endChars": 100, "w:hanging": 360, "w:hangingChars": 200 } } },
            ]),
        ).to.deep.equal({
            spaceBefore: 5,
            spaceBeforeLines: 50,
            spaceAfterLines: 100,
            autoSpaceBefore: true,
            autoSpaceAfter: false,
            indentLeft: 36,
            firstLineIndent: -18,
            indentLeftChars: 400,
            indentRightChars: 100,
            // A hanging indent in characters is a negative first line indent in characters
            firstLineChars: -200,
        });
        expect(readParagraphFormat([{ "w:ind": { _attr: { "w:firstLineChars": 200 } } }])).to.deep.equal({ firstLineChars: 200 });
    });

    it("should read each border of a paragraph with all it says, which tells paragraphs with the same borders", () => {
        const border = (attributes: Record<string, unknown>): object => ({ _attr: attributes });
        const format = readParagraphFormat([
            {
                "w:pBdr": [
                    { "w:top": border({ "w:val": "single", "w:sz": 6, "w:space": 1, "w:color": "auto" }) },
                    { "w:start": border({ "w:val": "double", "w:sz": "4", "w:shadow": "1", "w:frame": "false" }) },
                    { "w:bottom": border({ "w:val": "nil" }) },
                    { "w:between": border({ "w:val": "single", "w:sz": 6, "w:space": 1, "w:color": "auto" }) },
                    { "w:bar": border({}) },
                ],
            },
        ]);
        expect(format.borderTop).to.deep.equal({
            style: "single",
            size: 6,
            space: 1,
            shadow: false,
            frame: false,
            key: '[["w:color","auto"],["w:space","1"],["w:sz","6"],["w:val","single"]]',
        });
        expect(format.borderLeft).to.deep.include({ style: "double", size: 4, space: 0, shadow: true, frame: false });
        expect(format.borderBottom).to.deep.include({ style: "nil", space: 0 });
        expect(format.borderBetween!.key).to.equal(format.borderTop!.key);
        expect(format.borderBar).to.deep.include({ style: "none" });
        expect(format).to.not.have.any.keys("borderRight");
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
        // A lowered position of a fraction of its unit, whose minus sign and rounding Word's PDFs didn't show together
        expect(unknownLengthIn({ "w:position": { _attr: { "w:val": "-2.75pt" } } })).to.equal(
            "a lowered position of a fraction of its unit",
        );
        expect(unknownLengthIn({ "w:position": { _attr: { "w:val": "-6pt" } } })).to.equal(undefined);
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

describe("readParagraphFormat with hyphenation", () => {
    it("should read whether the paragraph's words are left whole by automatic hyphenation", () => {
        expect(readParagraphFormat([{ "w:suppressAutoHyphens": {} }])).to.deep.equal({ suppressAutoHyphens: true });
        expect(readParagraphFormat([{ "w:suppressAutoHyphens": { _attr: { "w:val": "false" } } }])).to.deep.equal({
            suppressAutoHyphens: false,
        });
        expect(readParagraphFormat([])).to.deep.equal({});
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
            language: "en-US",
        });
    });

    it("should read the language of the run's other text, and whether it is checked for spelling, which Word hyphenates by", () => {
        expect(readRunFormat([{ "w:lang": { _attr: { "w:val": "de-DE" } } }, { "w:noProof": {} }], THEME)).to.deep.equal({
            language: "de-DE",
            noProof: true,
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
            { size: 8, lineSize: 10, text: "A" },
            { text: "B" },
            { font: "MS Mincho", text: "永" },
        ]);
        expect(spansOf("a", { hidden: true })).to.deep.equal([]);
    });
    // cspell:enable
});
