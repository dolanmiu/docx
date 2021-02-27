import { expect } from "chai";
import { Formatter } from "export/formatter";

import { EMPTY_OBJECT } from "file/xml-components";

import { Compatibility } from "./compatibility";

describe("Compatibility", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const compatibility = new Compatibility({});

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": EMPTY_OBJECT });
        });
    });

    describe("#doNotExpandShiftReturn", () => {
        it("should create a setting for not justifying lines ending in soft line break", () => {
            const compatibility = new Compatibility({
                doNotExpandShiftReturn: true,
            });

            const tree = new Formatter().format(compatibility);
            expect(tree).to.deep.equal({ "w:compat": [{ "w:doNotExpandShiftReturn": EMPTY_OBJECT }] });
        });
    });
});
