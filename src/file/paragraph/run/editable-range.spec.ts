import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { Paragraph } from "../paragraph";
import { EditableRangeEnd, EditableRangeStart } from "./editable-range";
import { TextRun } from "./text-run";

describe("EditableRangeStart", () => {
    it("should start a range everyone can edit", () => {
        const tree = new Formatter().format(new EditableRangeStart(1));

        expect(tree).to.deep.equal({
            "w:permStart": { _attr: { "w:id": 1, "w:edGrp": "everyone" } },
        });
    });
});

describe("EditableRangeEnd", () => {
    it("should end the range with the same id", () => {
        const tree = new Formatter().format(new EditableRangeEnd(1));

        expect(tree).to.deep.equal({
            "w:permEnd": { _attr: { "w:id": 1 } },
        });
    });
});

describe("Paragraph with an editable range", () => {
    it("should write the range's start and end around the runs in it", () => {
        const paragraph = new Paragraph({
            children: [new TextRun("Name: "), new EditableRangeStart(2), new TextRun("Type here"), new EditableRangeEnd(2)],
        });

        const tree = new Formatter().format(paragraph);

        expect(tree).to.deep.equal({
            "w:p": [
                { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Name: "] }] },
                { "w:permStart": { _attr: { "w:id": 2, "w:edGrp": "everyone" } } },
                { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Type here"] }] },
                { "w:permEnd": { _attr: { "w:id": 2 } } },
            ],
        });
    });
});
