import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, MathRun } from "docx";

import { LARGE_OPERATORS, MathLargeOperator, type MathLargeOperatorName } from "./math-large-operator";

const toXml = (component: MathLargeOperator): string => xml(new Formatter().format(component));

describe("MathLargeOperator", () => {
    it("writes the operator with its limits above and below, and what it applies to", () => {
        expect(
            toXml(
                new MathLargeOperator({
                    operator: "product",
                    subScript: [new MathRun("i=1")],
                    superScript: [new MathRun("n")],
                    children: [new MathRun("i")],
                }),
            ),
        ).toBe(
            '<m:nary><m:naryPr><m:chr m:val="∏"/><m:limLoc m:val="undOvr"/></m:naryPr>' +
                "<m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>n</m:t></m:r></m:sup>" +
                "<m:e><m:r><m:t>i</m:t></m:r></m:e></m:nary>",
        );
    });

    it("hides the limits not given, and writes them empty, as the schema needs both", () => {
        expect(toXml(new MathLargeOperator({ operator: "union", children: [new MathRun("A")] }))).toBe(
            '<m:nary><m:naryPr><m:chr m:val="⋃"/><m:limLoc m:val="undOvr"/><m:subHide m:val="1"/><m:supHide m:val="1"/></m:naryPr>' +
                "<m:sub/><m:sup/><m:e><m:r><m:t>A</m:t></m:r></m:e></m:nary>",
        );
    });

    it.each(Object.entries(LARGE_OPERATORS) as readonly (readonly [MathLargeOperatorName, string])[])(
        "writes the %s as %s, with its limits where Word puts them",
        (operator, character) => {
            const written = toXml(new MathLargeOperator({ operator, children: [] }));
            expect(written).toContain(`<m:chr m:val="${character}"/>`);
            expect(written).toContain(`<m:limLoc m:val="${operator.endsWith("ntegral") ? "subSup" : "undOvr"}"/>`);
        },
    );

    it("puts the limits where it is told", () => {
        expect(toXml(new MathLargeOperator({ operator: "sum", limits: "side", children: [] }))).toContain('<m:limLoc m:val="subSup"/>');
        expect(toXml(new MathLargeOperator({ operator: "integral", limits: "aboveBelow", children: [] }))).toContain(
            '<m:limLoc m:val="undOvr"/>',
        );
    });

    it("writes an operator applied to nothing with a zero-width space", () => {
        expect(toXml(new MathLargeOperator({ operator: "sum", children: [] }))).toContain(
            '<m:e><m:r><m:t xml:space="preserve">\u200B</m:t></m:r></m:e>',
        );
    });

    it("throws for an operator or limits it doesn't know, and for a Math in any argument", () => {
        const math = new Math({ children: [] });
        // @ts-expect-error -- not an operator
        expect(() => new MathLargeOperator({ operator: "prod", children: [] })).toThrow('MathLargeOperator: operator is "prod"');
        // @ts-expect-error -- not a position
        expect(() => new MathLargeOperator({ operator: "sum", limits: "undOvr", children: [] })).toThrow(
            'MathLargeOperator: limits is "undOvr"',
        );
        expect(() => new MathLargeOperator({ operator: "sum", children: [math] })).toThrow("MathLargeOperator: children holds a Math");
        expect(() => new MathLargeOperator({ operator: "sum", subScript: [math], children: [] })).toThrow(
            "MathLargeOperator: subScript holds a Math",
        );
        expect(() => new MathLargeOperator({ operator: "sum", superScript: [math], children: [] })).toThrow(
            "MathLargeOperator: superScript holds a Math",
        );
    });
});
