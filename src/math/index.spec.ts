import { describe, expect, expectTypeOf, it } from "vitest";

import * as mathModule from "@file/paragraph/math";
import * as docx from "docx";

import * as math from ".";

// docx/math's own components and functions, which docx doesn't export
const OWN = [
    "MathAccent",
    "MathBar",
    "MathBox",
    "MathBrace",
    "MathBrackets",
    "MathCases",
    "MathEquationArray",
    "MathLargeOperator",
    "MathMatrix",
    "MathPhantom",
    "latexToMath",
];

describe("docx/math", () => {
    it("exports docx's own math classes and functions, not copies of them", () => {
        for (const [name, value] of Object.entries(math).filter(([key]) => !OWN.includes(key))) {
            expect(value, name).toBe(docx[name as keyof typeof docx]);
        }
    });

    it("exports every class and function of docx's math, so a new one isn't left out of docx/math", () => {
        // WORKAROUND4 is an empty string, not part of the math API
        const names = Object.keys(mathModule).filter((name) => name !== "WORKAROUND4");

        expect(Object.keys(math).toSorted()).toEqual([...names, ...OWN].toSorted());
    });

    it("keeps its own components out of docx, so they don't add to docx's bundle", () => {
        for (const name of OWN) {
            expect(name in docx, name).toBe(false);
            expect(math[name as keyof typeof math], name).toBeTypeOf("function");
        }
    });

    it("gives components that go wherever docx's math and paragraphs take their children", () => {
        expectTypeOf<math.MathMatrix>().toExtend<docx.MathComponent>();
        expectTypeOf<math.MathBrackets>().toExtend<docx.MathComponent>();
        expectTypeOf<math.MathCases>().toExtend<docx.MathComponent>();
        expectTypeOf<math.MathEquationArray>().toExtend<docx.MathComponent>();
        expectTypeOf<math.MathAccent>().toExtend<docx.MathComponent>();
        expectTypeOf<math.MathBar>().toExtend<docx.MathComponent>();
        expectTypeOf<math.MathBox>().toExtend<docx.MathComponent>();
        expectTypeOf<math.MathBrace>().toExtend<docx.MathComponent>();
        expectTypeOf<math.MathLargeOperator>().toExtend<docx.MathComponent>();
        expectTypeOf<math.MathPhantom>().toExtend<docx.MathComponent>();
        expectTypeOf(math.latexToMath).returns.toExtend<docx.IMathOptions["children"]>();
        expectTypeOf<docx.Math>().toExtend<docx.ParagraphChild>();

        const paragraph = new docx.Paragraph({
            children: [
                new math.Math({
                    children: [
                        new math.MathFraction({
                            numerator: [new math.MathMatrix({ rows: [[[new math.MathRun("1")]]] })],
                            denominator: [new math.MathCases({ cases: [{ value: [new math.MathRun("2")] }] })],
                        }),
                    ],
                }),
            ],
        });
        expect(paragraph).toBeInstanceOf(docx.Paragraph);
    });
});
