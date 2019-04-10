import { assert, expect } from "chai";

import { Formatter } from "export/formatter";

import { CharacterStyle, ParagraphStyle } from "./style";

import { Styles } from "./styles";

describe("Styles", () => {
    let styles: Styles;

    beforeEach(() => {
        styles = new Styles();
    });

    describe("#constructor()", () => {
        it("should create styles with correct rootKey", () => {
            const newJson = JSON.parse(JSON.stringify(styles));
            assert.equal(newJson.rootKey, "w:styles");
        });
    });

    describe("#createParagraphStyle", () => {
        it("should create a new paragraph style and push it onto this collection", () => {
            const pStyle = styles.createParagraphStyle("pStyleId");
            expect(pStyle).to.instanceOf(ParagraphStyle);
            const tree = new Formatter().format(styles)["w:styles"].filter((x) => !x._attr);
            expect(tree).to.deep.equal([
                {
                    "w:style": { _attr: { "w:type": "paragraph", "w:styleId": "pStyleId" } },
                },
            ]);
        });

        it("should set the paragraph name if given", () => {
            const pStyle = styles.createParagraphStyle("pStyleId", "Paragraph Style");
            expect(pStyle).to.instanceOf(ParagraphStyle);
            const tree = new Formatter().format(styles)["w:styles"].filter((x) => !x._attr);
            expect(tree).to.deep.equal([
                {
                    "w:style": [
                        { _attr: { "w:type": "paragraph", "w:styleId": "pStyleId" } },
                        { "w:name": { _attr: { "w:val": "Paragraph Style" } } },
                    ],
                },
            ]);
        });
    });

    describe("#createCharacterStyle", () => {
        it("should create a new character style and push it onto this collection", () => {
            const cStyle = styles.createCharacterStyle("pStyleId");
            expect(cStyle).to.instanceOf(CharacterStyle);
            const tree = new Formatter().format(styles)["w:styles"].filter((x) => !x._attr);
            expect(tree).to.deep.equal([
                {
                    "w:style": [
                        { _attr: { "w:type": "character", "w:styleId": "pStyleId" } },
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
                    ],
                },
            ]);
        });

        it("should set the character name if given", () => {
            const cStyle = styles.createCharacterStyle("pStyleId", "Character Style");
            expect(cStyle).to.instanceOf(CharacterStyle);
            const tree = new Formatter().format(styles)["w:styles"].filter((x) => !x._attr);
            expect(tree).to.deep.equal([
                {
                    "w:style": [
                        { _attr: { "w:type": "character", "w:styleId": "pStyleId" } },
                        { "w:name": { _attr: { "w:val": "Character Style" } } },
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
                    ],
                },
            ]);
        });
    });
});
