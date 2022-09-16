import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { Outline } from "./outline";

describe("Outline", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const tree = new Formatter().format(new Outline());
            expect(tree).to.deep.equal({
                "a:ln": [
                    {
                        "a:noFill": {},
                    },
                ],
            });
        });
    });
});
