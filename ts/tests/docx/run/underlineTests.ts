import { assert } from "chai";

import { TextRun } from "../../../docx/run/text-run";
import * as u from "../../../docx/run/underline";

function jsonify(obj: object) {
    const stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Underline", () => {

    describe("#constructor()", () => {

        it("should create a new Underline object with u:u as the rootKey", () => {
            const underline = new u.Underline();
            const newJson = jsonify(underline);
            assert.equal(newJson.rootKey, "w:u");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should have u:u as the rootKey", () => {
            const underline = new u.DashDotDotHeavyUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.rootKey, "w:u");
        });

        it("should put value in attribute", () => {
            const underline = new u.DashDotDotHeavyUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dashDotDotHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashDotHeavyUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dashDotHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashLongHeavyUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dashLongHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashLongUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dashLong");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dash");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DotDashUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dotDash");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DotDotDashUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dotDotDash");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DottedHeavyUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dottedHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DottedUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dotted");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DoubleUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "double");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.SingleUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "single");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.ThickUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "thick");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WaveUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "wave");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WavyDoubleUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "wavyDouble");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WavyHeavyUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "wavyHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {

    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WordsUnderline();
            const newJson = jsonify(underline);
            assert.equal(newJson.root[0].root.val, "words");
        });
    });
});
