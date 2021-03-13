import { expect } from "chai";

import { Formatter } from "export/formatter";
import { DocumentWrapper } from "../document-wrapper";
import { File } from "../file";

import { ParagraphProperties } from "./properties";

describe("ParagraphProperties", () => {
    describe("#constructor()", () => {
        it("creates an initially empty property object", () => {
            const properties = new ParagraphProperties();

            expect(() => new Formatter().format(properties)).to.throw("XMLComponent did not format correctly");
        });

        it("should create with numbering", () => {
            const properties = new ParagraphProperties({
                numbering: {
                    reference: "test-reference",
                    level: 0,
                    instance: 0,
                },
            });
            const tree = new Formatter().format(properties, {
                // tslint:disable-next-line: no-object-literal-type-assertion
                file: {
                    Numbering: {
                        createConcreteNumberingInstance: (_: string, __: number) => {
                            return;
                        },
                    },
                } as File,
                // tslint:disable-next-line: no-object-literal-type-assertion
                viewWrapper: new DocumentWrapper({ background: {} }),
            });

            expect(tree).to.deep.equal({
                "w:pPr": [
                    {
                        "w:pStyle": {
                            _attr: {
                                "w:val": "ListParagraph",
                            },
                        },
                    },
                    {
                        "w:numPr": [
                            {
                                "w:ilvl": {
                                    _attr: {
                                        "w:val": 0,
                                    },
                                },
                            },
                            {
                                "w:numId": {
                                    _attr: {
                                        "w:val": "{test-reference-0}",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should create with widowControl", () => {
            const properties = new ParagraphProperties({
                widowControl: true,
            });
            const tree = new Formatter().format(properties, {
                // tslint:disable-next-line: no-object-literal-type-assertion
                file: {
                    Numbering: {
                        createConcreteNumberingInstance: (_: string, __: number) => {
                            return;
                        },
                    },
                } as File,
                // tslint:disable-next-line: no-object-literal-type-assertion
                viewWrapper: new DocumentWrapper({ background: {} }),
            });

            expect(tree).to.deep.equal({
                "w:pPr": [
                    {
                        "w:widowControl": {
                            _attr: {
                                "w:val": true,
                            },
                        },
                    },
                ],
            });
        });
    });
});
