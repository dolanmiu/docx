import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { PageReference } from "./pageref";

describe("PageReference", () => {
    describe("#constructor()", () => {
        it("should construct a pageref without options", () => {
            const pageref = new PageReference("some_bookmark");
            const tree = new Formatter().format(pageref);
            expect(tree).to.be.deep.equal({
                "w:r": [
                    {
                        "w:fldChar": {
                            _attr: {
                                "w:dirty": true,
                                "w:fldCharType": "begin",
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
                            "PAGEREF some_bookmark",
                        ],
                    },
                    {
                        "w:fldChar": {
                            _attr: {
                                "w:fldCharType": "end",
                            },
                        },
                    },
                ],
            });
        });

        it("should construct a pageref with all the options", () => {
            const pageReference = new PageReference("some_bookmark", { hyperlink: true, useRelativePosition: true });
            const tree = new Formatter().format(pageReference);
            expect(tree).to.be.deep.equal({
                "w:r": [
                    {
                        "w:fldChar": {
                            _attr: {
                                "w:dirty": true,
                                "w:fldCharType": "begin",
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
                            "PAGEREF some_bookmark \\h \\p",
                        ],
                    },
                    {
                        "w:fldChar": {
                            _attr: {
                                "w:fldCharType": "end",
                            },
                        },
                    },
                ],
            });
        });
    });
});
