import { assert, expect } from "chai";

import { Formatter } from "export/formatter";
import { Utility } from "tests/utility";

import * as u from "./underline";

describe("Underline", () => {
    describe("#constructor()", () => {
        it("should create a new Underline object with u:u as the rootKey", () => {
            const underline = new u.Underline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.rootKey, "w:u");
        });

        it("should default to 'single' and no color", () => {
            const underline = new u.Underline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": [{ _attr: { "w:val": "single" } }],
            });
        });

        it("should use the given style type and color", () => {
            const underline = new u.Underline("double", "FF00CC");
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": [{ _attr: { "w:val": "double", "w:color": "FF00CC" } }],
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should have u:u as the rootKey", () => {
            const underline = new u.DashDotDotHeavyUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.rootKey, "w:u");
        });

        it("should put value in attribute", () => {
            const underline = new u.DashDotDotHeavyUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dashDotDotHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashDotHeavyUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dashDotHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashLongHeavyUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dashLongHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashLongUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dashLong");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dash");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DotDashUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dotDash");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DotDotDashUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dotDotDash");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DottedHeavyUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dottedHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DottedUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "dotted");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DoubleUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "double");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.SingleUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "single");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.ThickUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "thick");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WaveUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "wave");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WavyDoubleUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "wavyDouble");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WavyHeavyUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "wavyHeavy");
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WordsUnderline();
            const newJson = Utility.jsonify(underline);
            assert.equal(newJson.root[0].root.val, "words");
        });
    });
});
