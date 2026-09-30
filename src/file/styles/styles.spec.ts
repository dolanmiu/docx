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
                            { _attr: { "w:type": "paragraph", "w:styleId": "Normal", "w:default": "1" } },
                            { "w:name": { _attr: { "w:val": "Normal" } } },
                        ],
                    },
                ],
            });
        });

        describe("the default paragraph style", () => {
            const stylesOf = (styles: Styles): readonly { readonly id: string; readonly attributes: Record<string, unknown> }[] => {
                const children: readonly any[] = new Formatter().format(styles)["w:styles"];
                return children
                    .filter((child) => child["w:style"])
                    .map((child) => {
                        const attributes = [child["w:style"]].flat().find((part: any) => part._attr)._attr;
                        return { id: attributes["w:styleId"], attributes };
                    });
            };
            const defaults = (styles: Styles): readonly string[] =>
                stylesOf(styles)
                    .filter(({ attributes }) => attributes["w:default"] !== undefined)
                    .map(({ id }) => id);
            const external = (xml: string): Styles =>
                new Styles(new ExternalStylesFactory().newInstance(`<w:styles xmlns:w="main">${xml}</w:styles>`));

            it("is docx's own Normal, which has no formatting and comes first", () => {
                const styles = new Styles(new DefaultStylesFactory().newInstance());
                const tree = new Formatter().format(styles)["w:styles"];
                expect(tree[2]).to.deep.equal({
                    "w:style": [
                        { _attr: { "w:type": "paragraph", "w:styleId": "Normal", "w:default": "1" } },
                        { "w:name": { _attr: { "w:val": "Normal" } } },
                        { "w:qFormat": EMPTY_OBJECT },
                    ],
                });
                // And Normal Table, the default table style
                expect(defaults(styles)).to.deep.equal(["Normal", "TableNormal"]);
            });

            it("is a Normal from paragraphStyles, which takes the place of docx's", () => {
                const styles = new Styles({
                    ...new DefaultStylesFactory().newInstance(),
                    paragraphStyles: [{ id: "Normal", name: "Normal", run: { size: 24 } }],
                });
                expect(defaults(styles)).to.deep.equal(["TableNormal", "Normal"]);
                expect(stylesOf(styles).filter(({ id }) => id === "Normal")).to.have.length(1);
            });

            it("is left as it is when another style is marked as the default", () => {
                const styles = external(
                    '<w:style w:type="paragraph" w:default="1" w:styleId="Body"/><w:style w:type="paragraph" w:styleId="Normal"/>',
                );
                expect(defaults(styles)).to.deep.equal(["Body"]);
            });

            it("counts a style without a type as a paragraph style, as the schema does", () => {
                expect(
                    defaults(external('<w:style w:default="true" w:styleId="Body"/><w:style w:type="paragraph" w:styleId="Normal"/>')),
                ).to.deep.equal(["Body"]);
                expect(defaults(external('<w:style w:styleId="Normal"/>'))).to.deep.equal(["Normal"]);
            });

            it("doesn't count a style marked off, or a default of another type", () => {
                for (const off of ["0", "false", "off"]) {
                    expect(
                        defaults(
                            external(
                                `<w:style w:type="paragraph" w:default="${off}" w:styleId="Body"/><w:style w:type="paragraph" w:styleId="Normal"/>`,
                            ),
                        ),
                        off,
                    ).to.deep.equal(["Body", "Normal"]);
                }
                expect(
                    defaults(
                        external(
                            '<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"/><w:style w:type="paragraph" w:styleId="Normal"/>',
                        ),
                    ),
                ).to.deep.equal(["DefaultParagraphFont", "Normal"]);
            });

            it("isn't a character or table style called Normal", () => {
                expect(defaults(external('<w:style w:type="character" w:styleId="Normal"/>'))).to.deep.equal([]);
                expect(defaults(new Styles({ characterStyles: [{ id: "Normal", name: "Normal" }] }))).to.deep.equal([]);
            });

            it("isn't marked when there is no Normal", () => {
                expect(defaults(new Styles({ paragraphStyles: [{ id: "Body", name: "Body" }] }))).to.deep.equal([]);
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
