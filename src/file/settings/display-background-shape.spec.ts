import { expect } from "chai";

import { Formatter } from "export/formatter";

import { DisplayBackgroundShape } from "./display-background-shape";

describe("DisplayBackgroundShape", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const displayBackgroundShape = new DisplayBackgroundShape();
            const tree = new Formatter().format(displayBackgroundShape);
            expect(tree).to.deep.equal({
                "w:displayBackgroundShape": {},
            });
        });
    });
});
