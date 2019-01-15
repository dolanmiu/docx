import { assert, expect } from "chai";

import { Formatter } from "export/formatter";
import { Utility } from "tests/utility";

import { Run } from "./";

describe("Run", () => {
    let run: Run;

    beforeEach(() => {
        run = new Run();
    });

    describe("#bold()", () => {
        it("it should add bold to the properties", () => {
            run.bold();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:b");
            assert.equal(newJson.root[0].root[1].rootKey, "w:bCs");
        });
    });

    describe("#italic()", () => {
        it("it should add italics to the properties", () => {
            run.italic();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:i");
            assert.equal(newJson.root[0].root[1].rootKey, "w:iCs");
        });
    });

    describe("#underline()", () => {
        it("it should add underline to the properties", () => {
            run.underline();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:u");
        });

        it("should default to 'single' and no color", () => {
            run.underline();
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:u": [{ _attr: { "w:val": "single" } }] }] }],
            });
        });

        it("should set the style type and color if given", () => {
            run.underline("double", "990011");
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:u": [{ _attr: { "w:val": "double", "w:color": "990011" } }] }] }],
            });
        });
    });

    describe("#smallCaps()", () => {
        it("it should add smallCaps to the properties", () => {
            run.smallCaps();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:smallCaps");
        });
    });

    describe("#caps()", () => {
        it("it should add caps to the properties", () => {
            run.allCaps();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:caps");
        });
    });

    describe("#strike()", () => {
        it("it should add strike to the properties", () => {
            run.strike();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:strike");
        });
    });

    describe("#doubleStrike()", () => {
        it("it should add caps to the properties", () => {
            run.doubleStrike();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:dstrike");
        });
    });

    describe("#break()", () => {
        it("it should add break to the run", () => {
            run.break();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[1].rootKey, "w:br");
        });
    });

    describe("#tab()", () => {
        it("it should add break to the run", () => {
            run.tab();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[1].rootKey, "w:tab");
        });
    });

    describe("#font()", () => {
        it("should allow chaining calls", () => {
            expect(run.font("Times")).to.equal(run);
        });

        it("should set the font as named", () => {
            run.font("Times");
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            { "w:rFonts": [{ _attr: { "w:ascii": "Times", "w:cs": "Times", "w:eastAsia": "Times", "w:hAnsi": "Times" } }] },
                        ],
                    },
                ],
            });
        });
    });

    describe("#color", () => {
        it("should set the run to the color given", () => {
            run.color("001122");
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:color": [{ _attr: { "w:val": "001122" } }] }] }],
            });
        });
    });

    describe("#size", () => {
        it("should set the run to the given size", () => {
            run.size(24);
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [{ "w:sz": [{ _attr: { "w:val": 24 } }] }, { "w:szCs": [{ _attr: { "w:val": 24 } }] }],
                    },
                ],
            });
        });
    });

    describe("#rtl", () => {
        it("should set the run to the RTL mode", () => {
            run.rightToLeft();
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:rtl": [{ _attr: { "w:val": true } }] }] }],
            });
        });
    });

    describe("#numberOfTotalPages", () => {
        it("should set the run to the RTL mode", () => {
            run.numberOfTotalPages();
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:rPr": [] },
                    { "w:fldChar": [{ _attr: { "w:fldCharType": "begin" } }] },
                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "NUMPAGES"] },
                    { "w:fldChar": [{ _attr: { "w:fldCharType": "separate" } }] },
                    { "w:fldChar": [{ _attr: { "w:fldCharType": "end" } }] },
                ],
            });
        });
    });

    describe("#pageNumber", () => {
        it("should set the run to the RTL mode", () => {
            run.pageNumber();
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:rPr": [] },
                    { "w:fldChar": [{ _attr: { "w:fldCharType": "begin" } }] },
                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "PAGE"] },
                    { "w:fldChar": [{ _attr: { "w:fldCharType": "separate" } }] },
                    { "w:fldChar": [{ _attr: { "w:fldCharType": "end" } }] },
                ],
            });
        });
    });

    describe("#style", () => {
        it("should set the style to the given styleId", () => {
            run.style("myRunStyle");
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:rStyle": [{ _attr: { "w:val": "myRunStyle" } }] }] }],
            });
        });
    });
});
