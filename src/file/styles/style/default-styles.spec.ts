import { expect } from "chai";
import { Formatter } from "export/formatter";
import * as defaultStyels from "./default-styles";

describe("Default Styles", () => {
    it("HeadingStyle#constructor", () => {
        const style = new defaultStyels.HeadingStyle("Heading1", "Heading 1");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading1" } },
                { "w:name": { _attr: { "w:val": "Heading 1" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": {} },
            ],
        });
    });

    it("TitleStyle#constructor", () => {
        const style = new defaultStyels.TitleStyle();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Title" } },
                { "w:name": { _attr: { "w:val": "Title" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": {} },
            ],
        });
    });

    it("Heading1Style#constructor", () => {
        const style = new defaultStyels.Heading1Style();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading1" } },
                { "w:name": { _attr: { "w:val": "Heading 1" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": {} },
            ],
        });
    });

    it("Heading2Style#constructor", () => {
        const style = new defaultStyels.Heading2Style();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading2" } },
                { "w:name": { _attr: { "w:val": "Heading 2" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": {} },
            ],
        });
    });

    it("Heading3Style#constructor", () => {
        const style = new defaultStyels.Heading3Style();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading3" } },
                { "w:name": { _attr: { "w:val": "Heading 3" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": {} },
            ],
        });
    });

    it("Heading4Style#constructor", () => {
        const style = new defaultStyels.Heading4Style();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading4" } },
                { "w:name": { _attr: { "w:val": "Heading 4" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": {} },
            ],
        });
    });

    it("Heading5Style#constructor", () => {
        const style = new defaultStyels.Heading5Style();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading5" } },
                { "w:name": { _attr: { "w:val": "Heading 5" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": {} },
            ],
        });
    });

    it("Heading6Style#constructor", () => {
        const style = new defaultStyels.Heading6Style();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "Heading6" } },
                { "w:name": { _attr: { "w:val": "Heading 6" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:next": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": {} },
            ],
        });
    });

    it("ListParagraph#constructor", () => {
        const style = new defaultStyels.ListParagraph();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "ListParagraph" } },
                { "w:name": { _attr: { "w:val": "List Paragraph" } } },
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:qFormat": {} },
            ],
        });
    });

    it("FootnoteText#constructor", () => {
        const style = new defaultStyels.FootnoteText();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "paragraph", "w:styleId": "FootnoteText" } },
                { "w:name": { _attr: { "w:val": "footnote text" } } },
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
                { "w:basedOn": { _attr: { "w:val": "Normal" } } },
                { "w:link": { _attr: { "w:val": "FootnoteTextChar" } } },
                {
                    "w:uiPriority": {
                        _attr: {
                            "w:val": "99",
                        },
                    },
                },
                {
                    "w:semiHidden": {},
                },
                {
                    "w:unhideWhenUsed": {},
                },
            ],
        });
    });

    it("FootnoteReferenceStyle#constructor", () => {
        const style = new defaultStyels.FootnoteReferenceStyle();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "character", "w:styleId": "FootnoteReference" } },
                { "w:name": { _attr: { "w:val": "footnote reference" } } },
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
                {
                    "w:uiPriority": {
                        _attr: {
                            "w:val": "99",
                        },
                    },
                },
                {
                    "w:unhideWhenUsed": {},
                },
                { "w:basedOn": { _attr: { "w:val": "DefaultParagraphFont" } } },

                {
                    "w:semiHidden": {},
                },
            ],
        });
    });

    it("FootnoteTextChar#constructor", () => {
        const style = new defaultStyels.FootnoteTextChar();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "character", "w:styleId": "FootnoteTextChar" } },
                { "w:name": { _attr: { "w:val": "Footnote Text Char" } } },
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
                {
                    "w:uiPriority": {
                        _attr: {
                            "w:val": "99",
                        },
                    },
                },
                {
                    "w:unhideWhenUsed": {},
                },
                { "w:basedOn": { _attr: { "w:val": "DefaultParagraphFont" } } },
                { "w:link": { _attr: { "w:val": "FootnoteText" } } },
                {
                    "w:semiHidden": {},
                },
            ],
        });
    });

    it("HyperlinkStyle#constructor", () => {
        const style = new defaultStyels.HyperlinkStyle();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({
            "w:style": [
                { _attr: { "w:type": "character", "w:styleId": "Hyperlink" } },
                { "w:name": { _attr: { "w:val": "Hyperlink" } } },
                {
                    "w:rPr": [{ "w:color": { _attr: { "w:val": "0563C1" } } }, { "w:u": { _attr: { "w:val": "single" } } }],
                },
                {
                    "w:uiPriority": {
                        _attr: {
                            "w:val": "99",
                        },
                    },
                },
                {
                    "w:unhideWhenUsed": {},
                },
                { "w:basedOn": { _attr: { "w:val": "DefaultParagraphFont" } } },
            ],
        });
    });
});
