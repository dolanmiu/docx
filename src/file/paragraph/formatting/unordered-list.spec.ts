import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { NumberProperties } from "./unordered-list";

describe("NumberProperties", () => {
    describe("#constructor()", () => {
        it("should create a Number Properties with correct root key", () => {
            const numberProperties = new NumberProperties(5, 9);

            const tree = new Formatter().format(numberProperties);
            expect(tree).to.deep.equal({
                "w:numPr": [
                    {
                        "w:ilvl": {
                            _attr: {
                                "w:val": 9,
                            },
                        },
                    },
                    {
                        "w:numId": {
                            _attr: {
                                "w:val": 5,
                            },
                        },
                    },
                ],
            });
        });

        it("should throw an error if level exceeds 9", () => {
            expect(() => new NumberProperties(5, 10)).to.throw();
        });
    });
});
