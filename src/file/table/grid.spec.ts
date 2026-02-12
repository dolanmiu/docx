import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { EMPTY_OBJECT } from "@file/xml-components";

import { createGridCol, createTableGrid } from "./grid";

describe("GridCol", () => {
    describe("#createGridCol", () => {
        it("sets the width attribute to the value given", () => {
            const grid = createGridCol(1234);
            const tree = new Formatter().format(grid);
            expect(tree).to.deep.equal({
                "w:gridCol": { _attr: { "w:w": 1234 } },
            });
        });

        it("does not set a width attribute if not given", () => {
            const grid = createGridCol();
            const tree = new Formatter().format(grid);
            expect(tree).to.deep.equal({ "w:gridCol": EMPTY_OBJECT });
        });
    });
});

describe("TableGrid", () => {
    describe("#createTableGrid", () => {
        it("creates a column for each width given", () => {
            const grid = createTableGrid([1234, 321, 123]);
            const tree = new Formatter().format(grid);
            expect(tree).to.deep.equal({
                "w:tblGrid": [
                    { "w:gridCol": { _attr: { "w:w": 1234 } } },
                    { "w:gridCol": { _attr: { "w:w": 321 } } },
                    { "w:gridCol": { _attr: { "w:w": 123 } } },
                ],
            });
        });
    });
});
