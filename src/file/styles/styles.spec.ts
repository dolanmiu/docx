/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { EMPTY_OBJECT } from "@file/xml-components";

import { Styles } from "./styles";

describe("Styles", () => {
    describe("#createParagraphStyle", () => {
        it("should create a new paragraph style and push it onto this collection", () => {
            const styles = new Styles({
                paragraphStyles: [
                    {
                        id: "pStyleId",
                    },
                ],
            });
            const tree = new Formatter().format(styles)["w:styles"].filter((x: any) => !x._attr);
            expect(tree).to.deep.equal([
                {
                    "w:style": { _attr: { "w:type": "paragraph", "w:styleId": "pStyleId" } },
                },
            ]);
        });

        it("should set the paragraph name if given", () => {
            const styles = new Styles({
                paragraphStyles: [
                    {
                        id: "pStyleId",
                        name: "Paragraph Style",
                    },
                ],
            });
            const tree = new Formatter().format(styles)["w:styles"].filter((x: any) => !x._attr);
            expect(tree).to.deep.equal([
                {
                    "w:style": [
                        { _attr: { "w:type": "paragraph", "w:styleId": "pStyleId" } },
                        { "w:name": { _attr: { "w:val": "Paragraph Style" } } },
                    ],
                },
            ]);
        });
        it("should not include w:pStyle inside paragraphStyles paragraph properties", () => {
            const styles = new Styles({
                paragraphStyles: [
                    {
                        id: "pStyleId",
                        paragraph: {
                            numbering: {
                                reference: "test-reference",
                                level: 0,
                            },
                        },
                    },
                ],
            });
            const tree = new Formatter().format(styles, {
                file: {
                    Numbering: {
                        createConcreteNumberingInstance: (_: string, __: number) => undefined,
                    },
                } as any,
                viewWrapper: {},
                stack: [],
            })["w:styles"].filter((x: any) => !x._attr);

            expect(tree).to.deep.equal([
                {
                    "w:style": [
                        { _attr: { "w:type": "paragraph", "w:styleId": "pStyleId" } },
                        {
                            "w:pPr": [
                                {
                                    "w:numPr": [
                                        { "w:ilvl": { _attr: { "w:val": 0 } } },
                                        { "w:numId": { _attr: { "w:val": "{test-reference-0}" } } },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ]);
        });
    });

    describe("#createCharacterStyle", () => {
        it("should create a new character style and push it onto this collection", () => {
            const styles = new Styles({
                characterStyles: [
                    {
                        id: "pStyleId",
                    },
                ],
            });
            const tree = new Formatter().format(styles)["w:styles"].filter((x: any) => !x._attr);
            expect(tree).to.deep.equal([
                {
                    "w:style": [
                        { _attr: { "w:type": "character", "w:styleId": "pStyleId" } },
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
                    ],
                },
            ]);
        });

        it("should set the character name if given", () => {
            const styles = new Styles({
                characterStyles: [
                    {
                        id: "pStyleId",
                        name: "Character Style",
                    },
                ],
            });
            const tree = new Formatter().format(styles)["w:styles"].filter((x: any) => !x._attr);
            expect(tree).to.deep.equal([
                {
                    "w:style": [
                        { _attr: { "w:type": "character", "w:styleId": "pStyleId" } },
                        { "w:name": { _attr: { "w:val": "Character Style" } } },
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
                    ],
                },
            ]);
        });
    });
});
