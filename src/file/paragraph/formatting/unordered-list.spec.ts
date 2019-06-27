import { expect } from "chai";

import { Formatter } from "export/formatter";

import { NumberProperties } from "./unordered-list";

describe("NumberProperties", () => {
    let numberProperties: NumberProperties;

    beforeEach(() => {
        numberProperties = new NumberProperties(5, 10);
    });

    describe("#constructor()", () => {
        it("should create a Number Properties with correct root key", () => {
            const tree = new Formatter().format(numberProperties);
            expect(tree).to.deep.equal({
                "w:numPr": [
                    {
                        "w:ilvl": {
                            _attr: {
                                "w:val": 10,
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
    });
});
