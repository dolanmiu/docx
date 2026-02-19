import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/paragraph";

import { TableOfContents } from "./table-of-contents";
import { StyleLevel } from "./table-of-contents-properties";

describe("Table of Contents", () => {
    describe("#constructor", () => {
        it("should construct a TOC without options", () => {
            const toc = new TableOfContents();
            const tree = new Formatter().format(toc);
            expect(tree).to.be.deep.equal(DEFAULT_TOC);
        });

        it("should construct a TOC with all the options and alias", () => {
            const styles = [new StyleLevel("SL", 1), new StyleLevel("SL", 2)];

            const props = {
                captionLabel: "A",
                entriesFromBookmark: "B",
                captionLabelIncludingNumbers: "C",
                sequenceAndPageNumbersSeparator: "D",
                tcFieldIdentifier: "F",
                hyperlink: true,
                tcFieldLevelRange: "L",
                pageNumbersEntryLevelsRange: "N",
                headingStyleRange: "O",
                entryAndPageNumberSeparator: "P",
                seqFieldIdentifierForPrefix: "S",
                stylesWithLevels: styles,
                useAppliedParagraphOutlineLevel: true,
                preserveTabInEntries: true,
                preserveNewLineInEntries: true,
                hideTabAndPageNumbersInWebView: true,
            };

            const toc = new TableOfContents("Summary", props);
            const tree = new Formatter().format(toc);
            expect(tree).to.be.deep.equal(COMPLETE_TOC);
        });

        it("should construct a TOC with contentChildren", () => {
            const childParagraph = new Paragraph("Child content");
            const toc = new TableOfContents("My TOC", {
                contentChildren: [childParagraph],
            });
            const tree = new Formatter().format(toc);
            expect(tree).to.be.deep.equal(TOC_WITH_CHILDREN);
        });

        describe("cached content", () => {
            it("should construct a TOC with cached content", () => {
                const cachedContent = [
                    { title: "Introduction", level: 1, page: 1 },
                    { title: "Getting Started", level: 2, page: 3 },
                    { title: "Advanced Topics", level: 2, page: 10 },
                ];

                const toc = new TableOfContents("Table of Contents", { cachedContent });
                const tree = new Formatter().format(toc);

                const expectedParagraphs = [
                    {
                        "w:p": [
                            {
                                "w:pPr": [
                                    {
                                        "w:pStyle": {
                                            _attr: {
                                                "w:val": "TOC1",
                                            },
                                        },
                                    },
                                    {
                                        "w:tabs": [
                                            {
                                                "w:tab": {
                                                    _attr: {
                                                        "w:val": "clear",
                                                        "w:pos": 9026,
                                                    },
                                                },
                                            },
                                            {
                                                "w:tab": {
                                                    _attr: {
                                                        "w:val": "right",
                                                        "w:pos": 9025,
                                                        "w:leader": "dot",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                "w:r": [
                                    {
                                        "w:fldChar": {
                                            _attr: {
                                                "w:fldCharType": "begin",
                                                "w:dirty": true,
                                            },
                                        },
                                    },
                                    {
                                        "w:instrText": [
                                            {
                                                _attr: {
                                                    "xml:space": "preserve",
                                                },
                                            },
                                            "TOC",
                                        ],
                                    },
                                    {
                                        "w:fldChar": {
                                            _attr: {
                                                "w:fldCharType": "separate",
                                            },
                                        },
                                    },
                                ],
                            },
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "default",
                                                },
                                            },
                                            "Introduction",
                                        ],
                                    },
                                    {
                                        "w:tab": {},
                                    },
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "default",
                                                },
                                            },
                                            "1",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:p": [
                            {
                                "w:pPr": [
                                    {
                                        "w:pStyle": {
                                            _attr: {
                                                "w:val": "TOC2",
                                            },
                                        },
                                    },
                                    {
                                        "w:tabs": [
                                            {
                                                "w:tab": {
                                                    _attr: {
                                                        "w:val": "clear",
                                                        "w:pos": 8306,
                                                    },
                                                },
                                            },
                                            {
                                                "w:tab": {
                                                    _attr: {
                                                        "w:val": "right",
                                                        "w:pos": 9025,
                                                        "w:leader": "dot",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "default",
                                                },
                                            },
                                            "Getting Started",
                                        ],
                                    },
                                    {
                                        "w:tab": {},
                                    },
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "default",
                                                },
                                            },
                                            "3",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:p": [
                            {
                                "w:pPr": [
                                    {
                                        "w:pStyle": {
                                            _attr: {
                                                "w:val": "TOC2",
                                            },
                                        },
                                    },
                                    {
                                        "w:tabs": [
                                            {
                                                "w:tab": {
                                                    _attr: {
                                                        "w:val": "clear",
                                                        "w:pos": 8306,
                                                    },
                                                },
                                            },
                                            {
                                                "w:tab": {
                                                    _attr: {
                                                        "w:val": "right",
                                                        "w:pos": 9025,
                                                        "w:leader": "dot",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "default",
                                                },
                                            },
                                            "Advanced Topics",
                                        ],
                                    },
                                    {
                                        "w:tab": {},
                                    },
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "default",
                                                },
                                            },
                                            "10",
                                        ],
                                    },
                                ],
                            },
                            {
                                "w:r": [
                                    {
                                        "w:fldChar": {
                                            _attr: {
                                                "w:fldCharType": "end",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ];

                const expectedTree = {
                    "w:sdt": [
                        {
                            "w:sdtPr": [
                                {
                                    "w:alias": {
                                        _attr: {
                                            "w:val": "Table of Contents",
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            "w:sdtContent": expectedParagraphs,
                        },
                    ],
                };
                expect(tree).to.be.deep.equal(expectedTree);
            });

            it("should construct a TOC with cached content and hyperlinks", () => {
                const cachedContent = [
                    { title: "Introduction", level: 1, page: 1, href: "_Toc001" },
                    { title: "Summary", level: 1, page: 5, href: "_Toc002" },
                ];

                const toc = new TableOfContents("Table of Contents", {
                    cachedContent,
                    hyperlink: true,
                });
                const tree = new Formatter().format(toc);

                const expectedTree = {
                    "w:sdt": [
                        {
                            "w:sdtPr": [
                                {
                                    "w:alias": {
                                        _attr: {
                                            "w:val": "Table of Contents",
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            "w:sdtContent": [
                                {
                                    "w:p": [
                                        {
                                            "w:pPr": [
                                                {
                                                    "w:pStyle": {
                                                        _attr: {
                                                            "w:val": "TOC1",
                                                        },
                                                    },
                                                },
                                                {
                                                    "w:tabs": [
                                                        {
                                                            "w:tab": {
                                                                _attr: {
                                                                    "w:val": "clear",
                                                                    "w:pos": 9026,
                                                                },
                                                            },
                                                        },
                                                        {
                                                            "w:tab": {
                                                                _attr: {
                                                                    "w:val": "right",
                                                                    "w:pos": 9025,
                                                                    "w:leader": "dot",
                                                                },
                                                            },
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            "w:r": [
                                                {
                                                    "w:fldChar": {
                                                        _attr: {
                                                            "w:fldCharType": "begin",
                                                            "w:dirty": true,
                                                        },
                                                    },
                                                },
                                                {
                                                    "w:instrText": [
                                                        {
                                                            _attr: {
                                                                "xml:space": "preserve",
                                                            },
                                                        },
                                                        "TOC \\h",
                                                    ],
                                                },
                                                {
                                                    "w:fldChar": {
                                                        _attr: {
                                                            "w:fldCharType": "separate",
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            "w:hyperlink": [
                                                {
                                                    _attr: {
                                                        "w:anchor": "_Toc001",
                                                        "w:history": 1,
                                                    },
                                                },
                                                {
                                                    "w:r": [
                                                        {
                                                            "w:rPr": [
                                                                {
                                                                    "w:rStyle": {
                                                                        _attr: {
                                                                            "w:val": "IndexLink",
                                                                        },
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            "w:t": [
                                                                {
                                                                    _attr: {
                                                                        "xml:space": "default",
                                                                    },
                                                                },
                                                                "Introduction",
                                                            ],
                                                        },
                                                        {
                                                            "w:tab": {},
                                                        },
                                                        {
                                                            "w:t": [
                                                                {
                                                                    _attr: {
                                                                        "xml:space": "default",
                                                                    },
                                                                },
                                                                "1",
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    "w:p": [
                                        {
                                            "w:pPr": [
                                                {
                                                    "w:pStyle": {
                                                        _attr: {
                                                            "w:val": "TOC1",
                                                        },
                                                    },
                                                },
                                                {
                                                    "w:tabs": [
                                                        {
                                                            "w:tab": {
                                                                _attr: {
                                                                    "w:val": "clear",
                                                                    "w:pos": 9026,
                                                                },
                                                            },
                                                        },
                                                        {
                                                            "w:tab": {
                                                                _attr: {
                                                                    "w:val": "right",
                                                                    "w:pos": 9025,
                                                                    "w:leader": "dot",
                                                                },
                                                            },
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            "w:hyperlink": [
                                                {
                                                    _attr: {
                                                        "w:anchor": "_Toc002",
                                                        "w:history": 1,
                                                    },
                                                },
                                                {
                                                    "w:r": [
                                                        {
                                                            "w:rPr": [
                                                                {
                                                                    "w:rStyle": {
                                                                        _attr: {
                                                                            "w:val": "IndexLink",
                                                                        },
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            "w:t": [
                                                                {
                                                                    _attr: {
                                                                        "xml:space": "default",
                                                                    },
                                                                },
                                                                "Summary",
                                                            ],
                                                        },
                                                        {
                                                            "w:tab": {},
                                                        },
                                                        {
                                                            "w:t": [
                                                                {
                                                                    _attr: {
                                                                        "xml:space": "default",
                                                                    },
                                                                },
                                                                "5",
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            "w:r": [
                                                {
                                                    "w:fldChar": {
                                                        _attr: {
                                                            "w:fldCharType": "end",
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                };

                expect(tree).to.be.deep.equal(expectedTree);
            });

            it("should not wrap in hyperlink when entry has no href even with hyperlink option", () => {
                const cachedContent = [
                    { title: "No Link Entry", level: 1, page: 1 },
                    { title: "Link Entry", level: 2, page: 3, href: "_Toc123" },
                ];

                const toc = new TableOfContents("Table of Contents", {
                    cachedContent,
                    hyperlink: true,
                });
                const tree = new Formatter().format(toc);

                // First entry (no href) should be a plain run, not a hyperlink
                const firstParagraph = tree["w:sdt"][1]["w:sdtContent"][0]["w:p"];
                const lastChild = firstParagraph[firstParagraph.length - 1];
                expect(lastChild).to.have.property("w:r");
                expect(lastChild).to.not.have.property("w:hyperlink");

                // Second entry (has href) should be wrapped in a hyperlink
                const secondParagraph = tree["w:sdt"][1]["w:sdtContent"][1]["w:p"];
                // Find the hyperlink element (skip pPr)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const hyperlinkChild = secondParagraph.find((el: any) => el["w:hyperlink"] !== undefined);
                expect(hyperlinkChild).to.not.be.undefined;
                expect(hyperlinkChild["w:hyperlink"][0]._attr["w:anchor"]).to.equal("_Toc123");
            });

            it("should render empty string for page number when page is undefined", () => {
                const cachedContent = [{ title: "No Page", level: 1 }];

                const toc = new TableOfContents("Table of Contents", { cachedContent });
                const tree = new Formatter().format(toc);

                const firstParagraph = tree["w:sdt"][1]["w:sdtContent"][0]["w:p"];
                // Find the run with text content (skip the begin/instrText/separate run)
                const contentRun = firstParagraph.find(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (el: any) => el["w:r"] && el["w:r"].some((child: any) => child["w:tab"] !== undefined),
                );
                expect(contentRun).to.not.be.undefined;
                // The page number text should be ""
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const pageText = contentRun["w:r"].find((child: any) => child["w:t"] && child["w:t"][1] === "");
                expect(pageText).to.not.be.undefined;
            });

            it("should construct a TOC with beginDirty set to false", () => {
                const cachedContent = [{ title: "Entry", level: 1, page: 1 }];

                const toc = new TableOfContents("Table of Contents", {
                    cachedContent,
                    beginDirty: false,
                });
                const tree = new Formatter().format(toc);

                const firstParagraph = tree["w:sdt"][1]["w:sdtContent"][0]["w:p"];
                // Find the begin fldChar run
                const beginRun = firstParagraph.find(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (el: any) => el["w:r"] && el["w:r"].some((child: any) => child["w:fldChar"]?._attr?.["w:fldCharType"] === "begin"),
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fldChar = beginRun["w:r"].find((child: any) => child["w:fldChar"]?._attr?.["w:fldCharType"] === "begin");
                expect(fldChar["w:fldChar"]._attr["w:dirty"]).to.equal(false);
            });

            it("should fill in an end paragraph if only one cached entry is provided", () => {
                const cachedContent = [{ title: "Only Entry", level: 1, page: 1 }];
                const toc = new TableOfContents("Table of Contents", { cachedContent });
                const tree = new Formatter().format(toc);

                const expectedParagraphs = [
                    // cached entry paragraph
                    {
                        "w:p": [
                            {
                                "w:pPr": [
                                    {
                                        "w:pStyle": {
                                            _attr: {
                                                "w:val": "TOC1",
                                            },
                                        },
                                    },
                                    {
                                        "w:tabs": [
                                            {
                                                "w:tab": {
                                                    _attr: {
                                                        "w:val": "clear",
                                                        "w:pos": 9026,
                                                    },
                                                },
                                            },
                                            {
                                                "w:tab": {
                                                    _attr: {
                                                        "w:val": "right",
                                                        "w:pos": 9025,
                                                        "w:leader": "dot",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                "w:r": [
                                    {
                                        "w:fldChar": {
                                            _attr: {
                                                "w:fldCharType": "begin",
                                                "w:dirty": true,
                                            },
                                        },
                                    },
                                    {
                                        "w:instrText": [
                                            {
                                                _attr: {
                                                    "xml:space": "preserve",
                                                },
                                            },
                                            "TOC",
                                        ],
                                    },
                                    {
                                        "w:fldChar": {
                                            _attr: {
                                                "w:fldCharType": "separate",
                                            },
                                        },
                                    },
                                ],
                            },
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "default",
                                                },
                                            },
                                            "Only Entry",
                                        ],
                                    },
                                    {
                                        "w:tab": {},
                                    },
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "default",
                                                },
                                            },
                                            "1",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },

                    // End paragraph
                    {
                        "w:p": [
                            {
                                "w:r": [
                                    {
                                        "w:fldChar": {
                                            _attr: {
                                                "w:fldCharType": "end",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ];

                const expectedTree = {
                    "w:sdt": [
                        {
                            "w:sdtPr": [
                                {
                                    "w:alias": {
                                        _attr: {
                                            "w:val": "Table of Contents",
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            "w:sdtContent": expectedParagraphs,
                        },
                    ],
                };
                expect(tree).to.be.deep.equal(expectedTree);
            });
        });
    });
});

const DEFAULT_TOC = {
    "w:sdt": [
        {
            "w:sdtPr": [
                {
                    "w:alias": {
                        _attr: {
                            "w:val": "Table of Contents",
                        },
                    },
                },
            ],
        },
        {
            "w:sdtContent": [
                {
                    "w:p": [
                        {
                            "w:r": [
                                {
                                    "w:fldChar": {
                                        _attr: {
                                            "w:fldCharType": "begin",
                                            "w:dirty": true,
                                        },
                                    },
                                },
                                {
                                    "w:instrText": [
                                        {
                                            _attr: {
                                                "xml:space": "preserve",
                                            },
                                        },
                                        "TOC",
                                    ],
                                },
                                {
                                    "w:fldChar": {
                                        _attr: {
                                            "w:fldCharType": "separate",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    "w:p": [
                        {
                            "w:r": [
                                {
                                    "w:fldChar": {
                                        _attr: {
                                            "w:fldCharType": "end",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

const COMPLETE_TOC = {
    "w:sdt": [
        {
            "w:sdtPr": [
                {
                    "w:alias": {
                        _attr: {
                            "w:val": "Summary",
                        },
                    },
                },
            ],
        },
        {
            "w:sdtContent": [
                {
                    "w:p": [
                        {
                            "w:r": [
                                {
                                    "w:fldChar": {
                                        _attr: {
                                            "w:fldCharType": "begin",
                                            "w:dirty": true,
                                        },
                                    },
                                },
                                {
                                    "w:instrText": [
                                        {
                                            _attr: {
                                                "xml:space": "preserve",
                                            },
                                        },
                                        'TOC \\a "A" \\b "B" \\c "C" \\d "D" \\f "F" \\h \\l "L" \\n "N" \\o "O" \\p "P" \\s "S" \\t "SL,1,SL,2" \\u \\w \\x \\z',
                                    ],
                                },
                                {
                                    "w:fldChar": {
                                        _attr: {
                                            "w:fldCharType": "separate",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    "w:p": [
                        {
                            "w:r": [
                                {
                                    "w:fldChar": {
                                        _attr: {
                                            "w:fldCharType": "end",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

const TOC_WITH_CHILDREN = {
    "w:sdt": [
        {
            "w:sdtPr": [
                {
                    "w:alias": {
                        _attr: {
                            "w:val": "My TOC",
                        },
                    },
                },
            ],
        },
        {
            "w:sdtContent": [
                {
                    "w:p": [
                        {
                            "w:r": [
                                {
                                    "w:fldChar": {
                                        _attr: {
                                            "w:fldCharType": "begin",
                                            "w:dirty": true,
                                        },
                                    },
                                },
                                {
                                    "w:instrText": [
                                        {
                                            _attr: {
                                                "xml:space": "preserve",
                                            },
                                        },
                                        "TOC",
                                    ],
                                },
                                {
                                    "w:fldChar": {
                                        _attr: {
                                            "w:fldCharType": "separate",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    "w:p": [
                        {
                            "w:r": [
                                {
                                    "w:t": [
                                        {
                                            _attr: {
                                                "xml:space": "preserve",
                                            },
                                        },
                                        "Child content",
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    "w:p": [
                        {
                            "w:r": [
                                {
                                    "w:fldChar": {
                                        _attr: {
                                            "w:fldCharType": "end",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};
