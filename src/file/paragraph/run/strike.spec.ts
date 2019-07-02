import { expect } from "chai";

import { Formatter } from "export/formatter";

import { DoubleStrike, Strike } from "./formatting";

describe("Strike", () => {
    let strike: Strike;

    beforeEach(() => {
        strike = new Strike();
    });

    describe("#constructor()", () => {
        it("should create a Strike with correct root key", () => {
            const tree = new Formatter().format(strike);
            expect(tree).to.deep.equal({
                "w:strike": {
                    _attr: {
                        "w:val": true,
                    },
                },
            });
        });
    });
});

describe("DoubleStrike", () => {
    let strike: DoubleStrike;

    beforeEach(() => {
        strike = new DoubleStrike();
    });

    describe("#constructor()", () => {
        it("should create a Double Strike with correct root key", () => {
            const tree = new Formatter().format(strike);
            expect(tree).to.deep.equal({
                "w:dstrike": {
                    _attr: {
                        "w:val": true,
                    },
                },
            });
        });
    });
});
