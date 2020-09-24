import { expect } from "chai";

import { Formatter } from "export/formatter";

import { InsertedTextRun, DeletedTextRun } from "./track-revision";
import { TextRun } from "../paragraph";

describe("InsertedTestRun", () => {
    describe("#constructor", () => {
        it("should create a inserted text run", () => {
            const textRun = new TextRun({
                text: "some text"
            });
            const insertedTextRun = new InsertedTextRun({ child: textRun, id: 0, date: "123", author: "Author" })
            const tree = new Formatter().format(insertedTextRun);
            expect(tree).to.deep.equal({
                "w:ins": [
                    {
                        "_attr":
                        {
                            "w:author": "Author",
                            "w:date":   "123",
                            "w:id":     0
                        }
                    },
                    {
                        "w:r": [
                            {
                                "w:t": [
                                    {
                                        "_attr":
                                        {
                                            "xml:space": "preserve"
                                        }
                                    },
                                    "some text"
                                ]
                            }
                        ],
                    }
                ]
            });
        });
    });
});
describe("DeletedTestRun", () => {
    describe("#constructor", () => {
        it("should create a deleted text run", () => {

            const insertedParagraph = new DeletedTextRun({ text: 'some text', id: 0, date: "123", author: "Author" })
            const tree = new Formatter().format(insertedParagraph);
            expect(tree).to.deep.equal({
                "w:del": [
                    {
                        "_attr":
                        {
                            "w:author": "Author",
                            "w:date":   "123",
                            "w:id":     0
                        }
                    },
                    {
                        "w:r": [
                            {
                                "w:delText": [
                                    {
                                        "_attr":
                                        {
                                            "xml:space": "preserve"
                                        }
                                    },
                                    "some text"
                                ]
                            }
                        ],
                    }
                ]
            });
        });
    });
});
