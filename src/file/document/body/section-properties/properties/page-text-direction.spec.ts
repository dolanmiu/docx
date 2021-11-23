import { expect } from "chai";

import { Formatter } from "export/formatter";
import { PageTDirection, PageTextDirection } from "./page-text-direction";

describe("PageTextDirection", () => {
    describe("#constructor()", () => {
        it("should set the direction of the text flow to top-to-bottom-right-to-left", () => {
            const textDirection = new PageTDirection(PageTextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT);

            const tree = new Formatter().format(textDirection);

            expect(tree).to.deep.equal({
                "w:textDirection": {
                    _attr: {
                        "w:val": "tbRl",
                    },
                },
            });
        });
    });
});
