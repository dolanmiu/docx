import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { SimplePos } from "./simple-pos";

describe("SimplePos", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const tree = new Formatter().format(new SimplePos());
            expect(tree).to.deep.equal({
                "wp:simplePos": {
                    _attr: {
                        x: 0,
                        y: 0,
                    },
                },
            });
        });
    });
});
