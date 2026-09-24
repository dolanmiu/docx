import { describe, expect, it } from "vitest";

import { evaluateShapeGuides } from "./shape-guides";

const evaluate = (formula: string, width = 1000, height = 500): number =>
    evaluateShapeGuides({ guides: `g ${formula}` }, width, height)("g");

describe("evaluateShapeGuides", () => {
    it("should evaluate the arithmetic operators", () => {
        expect(evaluate("*/ 10 6 4")).to.equal(15);
        expect(evaluate("+- 10 6 4")).to.equal(12);
        expect(evaluate("+/ 10 6 4")).to.equal(4);
        expect(evaluate("abs -7")).to.equal(7);
        expect(evaluate("max 3 8")).to.equal(8);
        expect(evaluate("min 3 8")).to.equal(3);
        expect(evaluate("mod 2 3 6")).to.equal(7);
        expect(evaluate("sqrt 49")).to.equal(7);
        expect(evaluate("val -12")).to.equal(-12);
    });

    it("should choose with ?: by whether the first value is positive", () => {
        expect(evaluate("?: 1 5 9")).to.equal(5);
        expect(evaluate("?: 0 5 9")).to.equal(9);
    });

    it("should pin a value between a minimum and a maximum", () => {
        expect(evaluate("pin 10 5 20")).to.equal(10);
        expect(evaluate("pin 10 15 20")).to.equal(15);
        expect(evaluate("pin 10 25 20")).to.equal(20);
    });

    it("should measure angles in 60,000ths of a degree", () => {
        expect(evaluate("sin 100 5400000")).to.be.closeTo(100, 1e-9);
        expect(evaluate("cos 100 10800000")).to.be.closeTo(-100, 1e-9);
        expect(evaluate("tan 100 2700000")).to.be.closeTo(100, 1e-9);
        expect(evaluate("at2 0 100")).to.be.closeTo(5400000, 1e-6);
        expect(evaluate("cat2 100 1 1")).to.be.closeTo(100 * Math.SQRT1_2, 1e-9);
        expect(evaluate("sat2 100 1 1")).to.be.closeTo(100 * Math.SQRT1_2, 1e-9);
    });

    it("should know the built-in guides", () => {
        const value = evaluateShapeGuides({}, 1200, 600);
        expect([value("w"), value("h"), value("l"), value("t"), value("r"), value("b")]).to.deep.equal([1200, 600, 0, 0, 1200, 600]);
        expect([value("hc"), value("vc"), value("ss"), value("ls")]).to.deep.equal([600, 300, 600, 1200]);
        expect([value("wd4"), value("hd3"), value("ssd8")]).to.deep.equal([300, 200, 75]);
        expect([value("cd2"), value("cd4"), value("3cd4"), value("7cd8")]).to.deep.equal([10800000, 5400000, 16200000, 18900000]);
    });

    it("should evaluate guides in order, using earlier guides and adjustments", () => {
        const value = evaluateShapeGuides({ defaults: { adj: 25000 }, guides: "a pin 0 adj 50000; x1 */ ss a 100000" }, 1000, 400);
        expect(value("x1")).to.equal(100);
        expect(evaluateShapeGuides({ defaults: { adj: 25000 }, guides: "x1 */ ss adj 100000" }, 1000, 400, { adj: 50000 })("x1")).to.equal(
            200,
        );
    });

    it("should use a later definition of a guide from then on", () => {
        expect(evaluateShapeGuides({ guides: "a val 1; b +- a 0 0; a val 2" }, 1, 1)("a")).to.equal(2);
    });

    it("should throw on an unknown guide or operator", () => {
        expect(() => evaluateShapeGuides({ guides: "a */ w nothing 2" }, 1, 1)).to.throw('Unknown shape guide "nothing"');
        expect(() => evaluateShapeGuides({ guides: "a ** w 2" }, 1, 1)).to.throw('Unknown shape guide operator "**"');
    });
});
