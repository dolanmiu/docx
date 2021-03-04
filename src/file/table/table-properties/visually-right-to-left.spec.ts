import { expect } from "chai";

import { Formatter } from "export/formatter";
import { VisuallyRightToLeft } from "./visually-right-to-left";

describe("VisuallyRightToLeft", () => {
    it("should create", () => {
        const visuallyRightToLeft = new VisuallyRightToLeft();
        const tree = new Formatter().format(visuallyRightToLeft);
        expect(tree).to.deep.equal({
            "w:bidiVisual": {},
        });
    });
});
