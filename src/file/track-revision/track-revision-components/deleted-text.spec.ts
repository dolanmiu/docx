import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { DeletedText } from "./deleted-text";

describe("Deleted Text", () => {
    describe("#constructor", () => {
        it("adds the passed in text to the component", () => {
            const t = new DeletedText(" this is\n text");
            const f = new Formatter().format(t);
            expect(f).to.deep.equal({
                "w:delText": [{ _attr: { "xml:space": "preserve" } }, " this is\n text"],
            });
        });
    });
});
