import { describe, expect, it } from "vitest";

import type { ConcreteNumbering } from "@file/numbering";

import { NumberingReplacer } from "./numbering-replacer";

const concrete = (reference: string, instance: number, numId: number): ConcreteNumbering =>
    ({ reference, instance, numId }) as ConcreteNumbering;

describe("NumberingReplacer", () => {
    describe("#replace()", () => {
        it("writes each list's number in place of its placeholder", () => {
            const result = new NumberingReplacer().replace('<w:numId w:val="{list-0}"/><w:numId w:val="{list-1}"/>', [
                concrete("list", 0, 2),
                concrete("list", 1, 3),
            ]);

            expect(result).to.equal('<w:numId w:val="2"/><w:numId w:val="3"/>');
        });

        it("writes the number of a list whose reference has characters that are special in a regular expression", () => {
            const result = new NumberingReplacer().replace('<w:numId w:val="{steps (1.2)-0}"/>', [concrete("steps (1.2)", 0, 4)]);

            expect(result).to.equal('<w:numId w:val="4"/>');
        });
    });
});
