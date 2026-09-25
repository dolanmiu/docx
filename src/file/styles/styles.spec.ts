/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { DocumentWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";
import { EMPTY_OBJECT } from "@file/xml-components";

import { DocumentDefaults } from "./defaults";
import { ExternalStylesFactory } from "./external-styles-factory";
import { DefaultStylesFactory } from "./factory";
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
        it("should not add the ListParagraph style to a paragraph style that defines numbering", () => {
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
                } as File,
                viewWrapper: new DocumentWrapper({ background: {} }),
                stack: [],
            });
            const styleElements = tree["w:styles"].filter((x: any) => !x._attr);

            expect(styleElements).to.deep.equal([
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

    describe("#prepForXml", () => {
        it("should replace a default style with a paragraph style of the same id", () => {
            const styles = new Styles({
                ...new DefaultStylesFactory().newInstance(),
                paragraphStyles: [{ id: "Heading2", name: "My Heading 2" }],
            });
            const tree = new Formatter().format(styles)["w:styles"];
            const headings = tree.filter((x: any) => [x["w:style"]].flat().some((part: any) => part?._attr?.["w:styleId"] === "Heading2"));
            expect(headings).to.deep.equal([
                {
                    "w:style": [
                        { _attr: { "w:type": "paragraph", "w:styleId": "Heading2" } },
                        { "w:name": { _attr: { "w:val": "My Heading 2" } } },
                    ],
                },
            ]);
            expect(tree).to.have.length(new Formatter().format(new Styles(new DefaultStylesFactory().newInstance()))["w:styles"].length);
        });

        it("should put the document defaults and the latent styles first, and keep the last of each", () => {
            const external = new ExternalStylesFactory().newInstance(`<w:styles xmlns:w="main">
                <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
                <w:latentStyles w:defQFormat="0"/>
                <w:docDefaults><w:rPrDefault/></w:docDefaults>
            </w:styles>`);
            const styles = new Styles({ ...external, importedStyles: [new DocumentDefaults({}), ...external.importedStyles!] });
            expect(new Formatter().format(styles)).to.deep.equal({
                "w:styles": [
                    { _attr: { "xmlns:w": "main" } },
                    { "w:docDefaults": [{ "w:rPrDefault": EMPTY_OBJECT }] },
                    { "w:latentStyles": { _attr: { "w:defQFormat": "0" } } },
                    {
                        "w:style": [
                            { _attr: { "w:type": "paragraph", "w:styleId": "Normal" } },
                            { "w:name": { _attr: { "w:val": "Normal" } } },
                        ],
                    },
                ],
            });
        });

        it("should write styles with nothing in them as an empty element", () => {
            expect(new Formatter().format(new Styles({}))).to.deep.equal({ "w:styles": EMPTY_OBJECT });
        });

        it("should keep every style without an id, and text, where they are", () => {
            const styles = new Styles(
                new ExternalStylesFactory().newInstance(
                    `<w:styles xmlns:w="main">text<w:style/><w:style><w:name w:val="No id"/></w:style></w:styles>`,
                ),
            );
            expect(new Formatter().format(styles)).to.deep.equal({
                "w:styles": [
                    { _attr: { "xmlns:w": "main" } },
                    "text",
                    { "w:style": EMPTY_OBJECT },
                    { "w:style": [{ "w:name": { _attr: { "w:val": "No id" } } }] },
                ],
            });
        });
    });
});
