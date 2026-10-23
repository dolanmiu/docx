import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { EMPTY_OBJECT } from "@file/xml-components";

import * as defaultStyles from "./default-styles";

describe("Default Styles", () => {
    it("HeadingStyle#constructor", () => {
        const style = new defaultStyles.HeadingStyle({
            id: "Heading1",
            name: "Heading 1",
        });
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading1" } },
                { "w:name": { _attr: { "w:val": "Heading 1" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("TitleStyle#constructor", () => {
        const style = new defaultStyles.TitleStyle({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Title" } },
                { "w:name": { _attr: { "w:val": "Title" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("Heading1Style#constructor", () => {
        const style = new defaultStyles.Heading1Style({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading1" } },
                { "w:name": { _attr: { "w:val": "Heading 1" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("Heading2Style#constructor", () => {
        const style = new defaultStyles.Heading2Style({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading2" } },
                { "w:name": { _attr: { "w:val": "Heading 2" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("Heading3Style#constructor", () => {
        const style = new defaultStyles.Heading3Style({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading3" } },
                { "w:name": { _attr: { "w:val": "Heading 3" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("Heading4Style#constructor", () => {
        const style = new defaultStyles.Heading4Style({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading4" } },
                { "w:name": { _attr: { "w:val": "Heading 4" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("Heading5Style#constructor", () => {
        const style = new defaultStyles.Heading5Style({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading5" } },
                { "w:name": { _attr: { "w:val": "Heading 5" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("Heading6Style#constructor", () => {
        const style = new defaultStyles.Heading6Style({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading6" } },
                { "w:name": { _attr: { "w:val": "Heading 6" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("StrongStyle#constructor", () => {
        const style = new defaultStyles.StrongStyle({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Strong" } },
                { "w:name": { _attr: { "w:val": "Strong" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("ListParagraph#constructor", () => {
        const style = new defaultStyles.ListParagraph({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "ListParagraph" } },
                { "w:name": { _attr: { "w:val": "List Paragraph" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": EMPTY_OBJECT },
            ],
        });
    });

    it("FootnoteText#constructor", () => {
        const style = new defaultStyles.FootnoteText({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "FootnoteText" } },
                { "w:name": { _attr: { "w:val": "footnote text" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:link": { _attr: { "w:val": "FootnoteTextChar" } } },
                {
                    "w:uiPriority": {
                        _attr: {
                            "w:val": 99,
                        },
                    },
                },
                {
                    "w:semiHidden": EMPTY_OBJECT,
                },
                {
                    "w:unhideWhenUsed": EMPTY_OBJECT,
                },
                {
                    "w:pPr": [
                        {
                            "w:spacing": {
                                _attr: {
                                    "w:after": 0,
                                    "w:line": 240,
                                    "w:lineRule": "auto",
                                },
                            },
                        },
                    ],
                },
                {
                    "w:rPr": [
                        {
                            "w:sz": {
                                _attr: {
                                    "w:val": 20,
                                },
                            },
                        },
                        {
                            "w:szCs": {
                                _attr: {
                                    "w:val": 20,
                                },
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("FootnoteReferenceStyle#constructor", () => {
        const style = new defaultStyles.FootnoteReferenceStyle({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "character", "w:styleId": "FootnoteReference" } },
                { "w:name": { _attr: { "w:val": "footnote reference" } } },
                { "w:basedOn": { _attr: { "w:val": "DefaultParagraphFont" } } },
                {
                    "w:uiPriority": {
                        _attr: {
                            "w:val": 99,
                        },
                    },
                },
                {
                    "w:semiHidden": EMPTY_OBJECT,
                },
                {
                    "w:unhideWhenUsed": EMPTY_OBJECT,
                },
                {
                    "w:rPr": [
                        {
                            "w:vertAlign": {
                                _attr: {
                                    "w:val": "superscript",
                                },
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("FootnoteTextChar#constructor", () => {
        const style = new defaultStyles.FootnoteTextChar({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "character", "w:styleId": "FootnoteTextChar" } },
                { "w:name": { _attr: { "w:val": "Footnote Text Char" } } },
                { "w:basedOn": { _attr: { "w:val": "DefaultParagraphFont" } } },
                { "w:link": { _attr: { "w:val": "FootnoteText" } } },
                {
                    "w:uiPriority": {
                        _attr: {
                            "w:val": 99,
                        },
                    },
                },
                {
                    "w:semiHidden": EMPTY_OBJECT,
                },
                {
                    "w:unhideWhenUsed": EMPTY_OBJECT,
                },
                {
                    "w:rPr": [
                        {
                            "w:sz": {
                                _attr: {
                                    "w:val": 20,
                                },
                            },
                        },
                        {
                            "w:szCs": {
                                _attr: {
                                    "w:val": 20,
                                },
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("HyperlinkStyle#constructor", () => {
        const style = new defaultStyles.HyperlinkStyle({});
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "character", "w:styleId": "Hyperlink" } },
                { "w:name": { _attr: { "w:val": "Hyperlink" } } },
                { "w:basedOn": { _attr: { "w:val": "DefaultParagraphFont" } } },
                {
                    "w:uiPriority": {
                        _attr: {
                            "w:val": 99,
                        },
                    },
                },
                {
                    "w:unhideWhenUsed": EMPTY_OBJECT,
                },
                {
                    "w:rPr": [
                        {
                            "w:color": {
                                _attr: {
                                    "w:val": "0563C1",
                                },
                            },
                        },
                        { "w:u": { _attr: { "w:val": "single" } } },
                    ],
                },
            ],
        });
    });

    it("HyperlinkStyle#constructor", () => {
        const style = new defaultStyles.HyperlinkStyle({
            run: {
                color: "FF0000",
                underline: {
                    color: "0000FF",
                },
            },
        });
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "character", "w:styleId": "Hyperlink" } },
                { "w:name": { _attr: { "w:val": "Hyperlink" } } },
                { "w:basedOn": { _attr: { "w:val": "DefaultParagraphFont" } } },
                {
                    "w:uiPriority": {
                        _attr: {
                            "w:val": 99,
                        },
                    },
                },
                {
                    "w:unhideWhenUsed": EMPTY_OBJECT,
                },
                {
                    "w:rPr": [
                        {
                            "w:color": {
                                _attr: {
                                    "w:val": "FF0000",
                                },
                            },
                        },
                        { "w:u": { _attr: { "w:color": "0000FF", "w:val": "single" } } },
                    ],
                },
            ],
        });
    });

    it("CaptionStyle#constructor is Word's caption style: small italic text in the theme's second dark color", () => {
        expect(new Formatter().format(new defaultStyles.CaptionStyle({}))).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Caption" } },
                { "w:name": { _attr: { "w:val": "caption" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:uiPriority": { _attr: { "w:val": 35 } } },
                { "w:semiHidden": EMPTY_OBJECT },
                { "w:unhideWhenUsed": EMPTY_OBJECT },
                { "w:qFormat": EMPTY_OBJECT },
                { "w:pPr": [{ "w:spacing": { _attr: { "w:after": 200 } } }] },
                {
                    "w:rPr": [
                        { "w:i": EMPTY_OBJECT },
                        { "w:iCs": EMPTY_OBJECT },
                        { "w:color": { _attr: { "w:val": "44546A", "w:themeColor": "dark2" } } },
                        { "w:sz": { _attr: { "w:val": 18 } } },
                        { "w:szCs": { _attr: { "w:val": 18 } } },
                    ],
                },
            ],
        });
    });

    it("CaptionStyle#constructor replaces its own formatting with the options given", () => {
        const tree = new Formatter().format(new defaultStyles.CaptionStyle({ run: { bold: true } }));

        expect(tree["w:style"]).to.deep.include({ "w:rPr": [{ "w:b": EMPTY_OBJECT }, { "w:bCs": EMPTY_OBJECT }] });
        expect(tree["w:style"]).to.deep.include({ "w:pPr": [{ "w:spacing": { _attr: { "w:after": 200 } } }] });
    });

    it("BibliographyStyle#constructor is Word's bibliography style, with no formatting of its own", () => {
        expect(new Formatter().format(new defaultStyles.BibliographyStyle({}))).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Bibliography" } },
                { "w:name": { _attr: { "w:val": "Bibliography" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:uiPriority": { _attr: { "w:val": 37 } } },
                { "w:unhideWhenUsed": EMPTY_OBJECT },
            ],
        });
    });

    it("BibliographyStyle#constructor formats bibliographies with the options given", () => {
        const tree = new Formatter().format(new defaultStyles.BibliographyStyle({ run: { size: 20 } }));

        expect(tree["w:style"]).to.deep.include({
            "w:rPr": [{ "w:sz": { _attr: { "w:val": 20 } } }, { "w:szCs": { _attr: { "w:val": 20 } } }],
        });
    });

    it("TableOfContentsStyle#constructor is Word's TOC style of a level, indented by a level indent for each level below the first", () => {
        const styleOf = (level: number): unknown => new Formatter().format(new defaultStyles.TableOfContentsStyle(level, 200));

        expect(styleOf(1)).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "TOC1" } },
                { "w:name": { _attr: { "w:val": "toc 1" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:uiPriority": { _attr: { "w:val": 39 } } },
                { "w:semiHidden": EMPTY_OBJECT },
                { "w:unhideWhenUsed": EMPTY_OBJECT },
                { "w:pPr": [{ "w:spacing": { _attr: { "w:after": 100 } } }] },
            ],
        });
        expect(styleOf(9)).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "TOC9" } },
                { "w:name": { _attr: { "w:val": "toc 9" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:uiPriority": { _attr: { "w:val": 39 } } },
                { "w:semiHidden": EMPTY_OBJECT },
                { "w:unhideWhenUsed": EMPTY_OBJECT },
                { "w:pPr": [{ "w:spacing": { _attr: { "w:after": 100 } } }, { "w:ind": { _attr: { "w:left": 1600 } } }] },
            ],
        });
    });

    it("LineNumberStyle#constructor is Word's line number style, with no formatting of its own", () => {
        expect(new Formatter().format(new defaultStyles.LineNumberStyle({}))).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "character", "w:styleId": "LineNumber" } },
                { "w:name": { _attr: { "w:val": "line number" } } },
                { "w:basedOn": { _attr: { "w:val": "DefaultParagraphFont" } } },
                { "w:uiPriority": { _attr: { "w:val": 99 } } },
                { "w:semiHidden": EMPTY_OBJECT },
                { "w:unhideWhenUsed": EMPTY_OBJECT },
            ],
        });
    });

    it("LineNumberStyle#constructor formats line numbers with the run options given", () => {
        expect(
            new Formatter().format(new defaultStyles.LineNumberStyle({ run: { font: "Calibri", size: 20, color: "808080" } })),
        ).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "character", "w:styleId": "LineNumber" } },
                { "w:name": { _attr: { "w:val": "line number" } } },
                { "w:basedOn": { _attr: { "w:val": "DefaultParagraphFont" } } },
                { "w:uiPriority": { _attr: { "w:val": 99 } } },
                { "w:semiHidden": EMPTY_OBJECT },
                { "w:unhideWhenUsed": EMPTY_OBJECT },
                {
                    "w:rPr": [
                        {
                            "w:rFonts": {
                                _attr: { "w:ascii": "Calibri", "w:cs": "Calibri", "w:eastAsia": "Calibri", "w:hAnsi": "Calibri" },
                            },
                        },
                        { "w:color": { _attr: { "w:val": "808080" } } },
                        { "w:sz": { _attr: { "w:val": 20 } } },
                        { "w:szCs": { _attr: { "w:val": 20 } } },
                    ],
                },
            ],
        });
    });

    it("NormalTableStyle#constructor gives tables the cell margins Word gives the tables it makes", () => {
        expect(new Formatter().format(new defaultStyles.NormalTableStyle())).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "table", "w:styleId": "TableNormal", "w:default": true } },
                { "w:name": { _attr: { "w:val": "Normal Table" } } },
                { "w:uiPriority": { _attr: { "w:val": 99 } } },
                { "w:semiHidden": EMPTY_OBJECT },
                { "w:unhideWhenUsed": EMPTY_OBJECT },
                {
                    "w:tblPr": [
                        { "w:tblInd": { _attr: { "w:type": "dxa", "w:w": 0 } } },
                        {
                            "w:tblCellMar": [
                                { "w:top": { _attr: { "w:type": "dxa", "w:w": 0 } } },
                                { "w:left": { _attr: { "w:type": "dxa", "w:w": 108 } } },
                                { "w:bottom": { _attr: { "w:type": "dxa", "w:w": 0 } } },
                                { "w:right": { _attr: { "w:type": "dxa", "w:w": 108 } } },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});
