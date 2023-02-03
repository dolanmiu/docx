import { expect } from "chai";

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
                        { "w:u": { _attr: { "w:val": "single" } } },
                        {
                            "w:color": {
                                _attr: {
                                    "w:val": "0563C1",
                                },
                            },
                        },
                    ],
                },
            ],
        });
    });
});
