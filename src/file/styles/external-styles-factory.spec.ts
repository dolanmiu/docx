import { expect } from "chai";

import { ExternalStylesFactory } from "./external-styles-factory";

describe("External styles factory", () => {
    let externalStyles;

    beforeEach(() => {
        externalStyles = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:styles xmlns:mc="first" xmlns:r="second">
            <w:docDefaults>
            <w:rPrDefault>
                <w:rPr>
                    <w:rFonts w:ascii="Arial" w:eastAsiaTheme="minorHAnsi" w:hAnsi="Arial" w:cstheme="minorHAnsi"/>
                    <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/>
                </w:rPr>
            </w:rPrDefault>
            <w:pPrDefault>
                <w:pPr>
                    <w:spacing w:after="160" w:line="259" w:lineRule="auto"/>
                </w:pPr>
            </w:pPrDefault>
            </w:docDefaults>

            <w:latentStyles w:defLockedState="1" w:defUIPriority="99">
            </w:latentStyles>

            <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
                <w:name w:val="Normal"/>
                <w:qFormat/>
            </w:style>

            <w:style w:type="paragraph" w:styleId="Heading1">
                <w:name w:val="heading 1"/>
                <w:basedOn w:val="Normal"/>
                <w:pPr>
                    <w:keepNext/>
                    <w:keepLines/>

                    <w:pBdr>
                        <w:bottom w:val="single" w:sz="4" w:space="1" w:color="auto"/>
                  </w:pBdr>
                </w:pPr>
            </w:style>
        </w:styles>`;
    });

    describe("#parse", () => {
        it("should parse w:styles attributes", () => {
            // tslint:disable-next-line:no-any
            const importedStyle = new ExternalStylesFactory().newInstance(externalStyles) as any;

            expect(importedStyle.rootKey).to.equal("w:styles");
            expect(importedStyle.root[0]._attr).to.eql({
                "xmlns:mc": "first",
                "xmlns:r": "second",
            });
        });

        it("should parse other child elements of w:styles", () => {
            // tslint:disable-next-line:no-any
            const importedStyle = new ExternalStylesFactory().newInstance(externalStyles) as any;
            expect(importedStyle.root[1]).to.eql({
                deleted: false,
                root: [
                    {
                        deleted: false,
                        root: [
                            {
                                deleted: false,
                                root: [
                                    {
                                        _attr: {
                                            "w:ascii": "Arial",
                                            "w:cstheme": "minorHAnsi",
                                            "w:eastAsiaTheme": "minorHAnsi",
                                            "w:hAnsi": "Arial",
                                        },
                                        deleted: false,
                                        root: [],
                                        rootKey: "w:rFonts",
                                    },
                                    {
                                        _attr: {
                                            "w:bidi": "ar-SA",
                                            "w:eastAsia": "en-US",
                                            "w:val": "en-US",
                                        },
                                        deleted: false,
                                        root: [],
                                        rootKey: "w:lang",
                                    },
                                ],
                                rootKey: "w:rPr",
                            },
                        ],
                        rootKey: "w:rPrDefault",
                    },
                    {
                        deleted: false,
                        root: [
                            {
                                deleted: false,
                                root: [
                                    {
                                        _attr: {
                                            "w:after": "160",
                                            "w:line": "259",
                                            "w:lineRule": "auto",
                                        },
                                        deleted: false,
                                        root: [],
                                        rootKey: "w:spacing",
                                    },
                                ],
                                rootKey: "w:pPr",
                            },
                        ],
                        rootKey: "w:pPrDefault",
                    },
                ],
                rootKey: "w:docDefaults",
            });
            expect(importedStyle.root[2]).to.eql({
                _attr: {
                    "w:defLockedState": "1",
                    "w:defUIPriority": "99",
                },
                deleted: false,
                root: [],
                rootKey: "w:latentStyles",
            });
        });

        it("should parse styles elements", () => {
            // tslint:disable-next-line:no-any
            const importedStyle = new ExternalStylesFactory().newInstance(externalStyles) as any;

            expect(importedStyle.root.length).to.equal(5);
            expect(importedStyle.root[3]).to.eql({
                _attr: {
                    "w:default": "1",
                    "w:styleId": "Normal",
                    "w:type": "paragraph",
                },
                deleted: false,
                root: [
                    {
                        _attr: {
                            "w:val": "Normal",
                        },
                        deleted: false,
                        root: [],
                        rootKey: "w:name",
                    },
                    {
                        deleted: false,
                        root: [],
                        rootKey: "w:qFormat",
                    },
                ],
                rootKey: "w:style",
            });

            expect(importedStyle.root[4]).to.eql({
                _attr: {
                    "w:styleId": "Heading1",
                    "w:type": "paragraph",
                },
                deleted: false,
                root: [
                    {
                        _attr: {
                            "w:val": "heading 1",
                        },
                        deleted: false,
                        root: [],
                        rootKey: "w:name",
                    },
                    {
                        _attr: {
                            "w:val": "Normal",
                        },
                        deleted: false,
                        root: [],
                        rootKey: "w:basedOn",
                    },
                    {
                        deleted: false,
                        root: [
                            {
                                deleted: false,
                                root: [],
                                rootKey: "w:keepNext",
                            },
                            {
                                deleted: false,
                                root: [],
                                rootKey: "w:keepLines",
                            },
                            {
                                deleted: false,
                                root: [
                                    {
                                        _attr: {
                                            "w:color": "auto",
                                            "w:space": "1",
                                            "w:sz": "4",
                                            "w:val": "single",
                                        },
                                        deleted: false,
                                        root: [],
                                        rootKey: "w:bottom",
                                    },
                                ],
                                rootKey: "w:pBdr",
                            },
                        ],
                        rootKey: "w:pPr",
                    },
                ],
                rootKey: "w:style",
            });
        });
    });
});
