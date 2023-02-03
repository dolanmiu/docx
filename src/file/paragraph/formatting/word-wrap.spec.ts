import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { WordWrap } from "./word-wrap";

describe("WordWrap", () => {
    it("should create", () => {
        const wordWrap = new WordWrap();
        const tree = new Formatter().format(wordWrap);

        expect(tree).to.deep.equal({
            "w:wordWrap": {
                _attr: {
                    "w:val": 0,
                },
            },
        });
    });
});
