import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { PageReferenceFieldInstruction } from "./pageref-field-instruction";

describe("PageReference field instruction", () => {
    describe("#constructor()", () => {
        it("should construct a pageref field instruction without options", () => {
            const instruction = new PageReferenceFieldInstruction("anchor");
            const tree = new Formatter().format(instruction);

            expect(tree).to.be.deep.equal({
                "w:instrText": [
                    {
                        _attr: {
                            "xml:space": "preserve",
                        },
                    },
                    "PAGEREF anchor",
                ],
            });
        });
    });
});
