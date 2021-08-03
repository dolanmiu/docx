import { expect } from "chai";

import { Formatter } from "export/formatter";
import { PageRef } from "./pageref";

describe("PageRef", () => {
    describe("#constructor()", () => {
        it("should construct a pageref without options", () => {
            const pageref = new PageRef("some_bookmark");
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
            const pageref = new PageRef("some_bookmark", { hyperlink: true, useRelativePosition: true });
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
