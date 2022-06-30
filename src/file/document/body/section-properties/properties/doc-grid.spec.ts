import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { DocumentGrid, DocumentGridType } from ".";

describe("DocumentGrid", () => {
    describe("#constructor()", () => {
        it("should create documentGrid with specified linePitch", () => {
            const docGrid = new DocumentGrid(360);
            const tree = new Formatter().format(docGrid);

            expect(tree["w:docGrid"]).to.deep.equal({ _attr: { "w:linePitch": 360 } });
        });

        it("should create documentGrid with specified linePitch and type", () => {
            const docGrid = new DocumentGrid(360, undefined, DocumentGridType.LINES);
            const tree = new Formatter().format(docGrid);

            expect(tree["w:docGrid"]).to.deep.equal({ _attr: { "w:linePitch": 360, "w:type": "lines" } });
        });

        it("should create documentGrid with specified linePitch,charSpace and type", () => {
            const docGrid = new DocumentGrid(346, -1541, DocumentGridType.LINES_AND_CHARS);
            const tree = new Formatter().format(docGrid);

            expect(tree["w:docGrid"]).to.deep.equal({ _attr: { "w:linePitch": 346, "w:charSpace": -1541, "w:type": "linesAndChars" } });
        });
    });
});
