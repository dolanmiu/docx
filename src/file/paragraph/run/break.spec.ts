import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Break } from "./break";

describe("Break", () => {
    let currentBreak: Break;

    beforeEach(() => {
        currentBreak = new Break();
    });

    describe("#constructor()", () => {
        it("should create a Break with correct root key", () => {
            const tree = new Formatter().format(currentBreak);
            expect(tree).to.deep.equal({
                "w:br": {},
            });
        });
    });
});
