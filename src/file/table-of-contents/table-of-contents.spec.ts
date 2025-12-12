import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

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

        describe("cached content", () => {
            it("should construct a TOC with cached content", () => {
                const cachedContent = [
                    { title: "Introduction", level: 1, page: 1 },
                    { title: "Getting Started", level: 2, page: 3 },
                    { title: "Advanced Topics", level: 2, page: 10 },
                ];

                const toc = new TableOfContents("Table of Contents", undefined, cachedContent);
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

            it("should fill in an end paragraph if only one cached entry is provided", () => {
                const cachedContent = [{ title: "Only Entry", level: 1, page: 1 }];
                const toc = new TableOfContents("Table of Contents", undefined, cachedContent);
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
