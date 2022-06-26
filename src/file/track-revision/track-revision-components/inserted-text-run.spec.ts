import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { InsertedTextRun } from "./inserted-text-run";

describe("InsertedTextRun", () => {
    describe("#constructor", () => {
        it("should create a inserted text run", () => {
            const insertedTextRun = new InsertedTextRun({ text: "some text", id: 0, date: "123", author: "Author" });
            const tree = new Formatter().format(insertedTextRun);
            expect(tree).to.deep.equal({
                "w:ins": [
                    {
                        _attr: {
                            "w:author": "Author",
                            "w:date": "123",
                            "w:id": 0,
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:t": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "some text",
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
