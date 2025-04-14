import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { DocumentGridType, createDocumentGrid } from ".";

describe("createDocumentGrid", () => {
    describe("#constructor()", () => {
        it("should create documentGrid with specified linePitch", () => {
            const docGrid = createDocumentGrid({ linePitch: 360 });
            const tree = new Formatter().format(docGrid);

            expect(tree["w:docGrid"]).to.deep.equal({ _attr: { "w:linePitch": 360 } });
        });

        it("should create documentGrid with specified linePitch and type", () => {
            const docGrid = createDocumentGrid({ linePitch: 360, type: DocumentGridType.LINES });
            const tree = new Formatter().format(docGrid);

            expect(tree["w:docGrid"]).to.deep.equal({ _attr: { "w:linePitch": 360, "w:type": "lines" } });
        });

        it("should create documentGrid with specified linePitch,charSpace and type", () => {
            const docGrid = createDocumentGrid({ linePitch: 346, charSpace: -1541, type: DocumentGridType.LINES_AND_CHARS });
            const tree = new Formatter().format(docGrid);

            expect(tree["w:docGrid"]).to.deep.equal({ _attr: { "w:linePitch": 346, "w:charSpace": -1541, "w:type": "linesAndChars" } });
        });
    });
});
