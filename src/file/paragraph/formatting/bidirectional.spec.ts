import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Bidirectional } from "./bidirectional";

describe("Bidirectional", () => {
    it("should create", () => {
        const bidirectional = new Bidirectional();
        const tree = new Formatter().format(bidirectional);
        expect(tree).to.deep.equal({
            "w:bidi": {},
        });
    });
});
