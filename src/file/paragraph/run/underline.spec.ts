import { expect } from "chai";

import { Formatter } from "export/formatter";

import * as u from "./underline";

describe("Underline", () => {
    describe("#constructor()", () => {
        it("should create a new Underline object with u:u as the rootKey", () => {
            const underline = new u.Underline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "single",
                    },
                },
            });
        });

        it("should default to 'single' and no color", () => {
            const underline = new u.Underline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": { _attr: { "w:val": "single" } },
            });
        });

        it("should use the given style type and color", () => {
            const underline = new u.Underline(u.UnderlineType.DOUBLE, "FF00CC");
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": { _attr: { "w:val": "double", "w:color": "FF00CC" } },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashDotDotHeavyUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "dashDotDotHeavy",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashDotHeavyUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "dashDotHeavy",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashLongHeavyUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "dashLongHeavy",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashLongUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "dashLong",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DashUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "dash",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DotDashUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "dotDash",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DotDotDashUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "dotDotDash",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DottedHeavyUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "dottedHeavy",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DottedUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "dotted",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.DoubleUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "double",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.SingleUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "single",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.ThickUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "thick",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WaveUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "wave",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WavyDoubleUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "wavyDouble",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WavyHeavyUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "wavyHeavy",
                    },
                },
            });
        });
    });
});

describe("DashDotDotHeavyUnderline", () => {
    describe("#constructor()", () => {
        it("should put value in attribute", () => {
            const underline = new u.WordsUnderline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "words",
                    },
                },
            });
        });
    });
});
