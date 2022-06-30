import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { Alignment, AlignmentType } from "./alignment";

describe("Alignment", () => {
    it("should create", () => {
        const alignment = new Alignment(AlignmentType.BOTH);
        const tree = new Formatter().format(alignment);

        expect(tree).to.deep.equal({
            "w:jc": {
                _attr: {
                    "w:val": "both",
                },
            },
        });
    });
});
