import { expect } from "chai";

import { Formatter } from "export/formatter";

import { WidowControl } from "./widow-control";

describe("WidowControl", () => {
    it("should create", () => {
        const widowControl = new WidowControl(true);
        const tree = new Formatter().format(widowControl);

        expect(tree).to.deep.equal({
            "w:widowControl": {
                _attr: {
                    "w:val": true,
                },
            },
        });
    });
});
