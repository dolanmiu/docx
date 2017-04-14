import { expect } from "chai";
import { TextRun } from "../../../docx/run/text-run";
import { Formatter } from "../../../export/formatter";

describe("TextRun", () => {
    let run: TextRun;

    describe("#constructor()", () => {

        it("should add text into run", () => {
            run = new TextRun("test");
            const f = new Formatter().format(run);
            expect(f).to.deep.equal({"w:r": [
                {"w:rPr": []},
                {"w:t": [{_attr: {"xml:space": "preserve"}}, "test"]},
            ]});
        });
    });
});
