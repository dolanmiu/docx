import { afterEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import * as convenienceFunctions from "@util/convenience-functions";

import { createFitText } from "./fit-text";

describe("createFitText", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should write the width in twips as w:val, and the group as w:id", () => {
        const tree = new Formatter().format(createFitText({ width: 1440, group: 1 }));
        expect(tree).to.deep.equal({
            "w:fitText": { _attr: { "w:val": 1440, "w:id": 1 } },
        });
    });

    it("should write a width given as a measure in whole twips, as Office's schemas allow only those", () => {
        const valOf = (width: `${number}${"in" | "pt" | "cm" | "mm"}`): unknown =>
            new Formatter().format(createFitText({ width, group: 1 }))["w:fitText"]._attr["w:val"];
        expect(valOf("1in")).to.equal(1440);
        expect(valOf("44pt")).to.equal(880);
        expect(valOf("2.54cm")).to.equal(1440);
        expect(valOf("10mm")).to.equal(567);
    });

    it("should write a group of 0", () => {
        const tree = new Formatter().format(createFitText({ width: 1440, group: 0 }));
        expect(tree).to.deep.equal({
            "w:fitText": { _attr: { "w:val": 1440, "w:id": 0 } },
        });
    });

    it("should give text fitted without a group an ID of its own, as Word fits runs without one unreliably", () => {
        vi.spyOn(convenienceFunctions, "fitTextUniqueNumericId").mockReturnValue(-7);
        const tree = new Formatter().format(createFitText({ width: 1440 }));
        expect(tree).to.deep.equal({
            "w:fitText": { _attr: { "w:val": 1440, "w:id": -7 } },
        });
    });

    it("should give each piece of text fitted without a group a different negative ID, apart from the groups people give", () => {
        const idOf = (): number => new Formatter().format(createFitText({ width: 1440 }))["w:fitText"]._attr["w:id"];
        const [first, second] = [idOf(), idOf()];
        expect(first).to.be.below(0);
        expect(second).to.be.below(0);
        expect(second).to.not.equal(first);
    });

    it("should throw for a negative width, rather than write it as w:val", () => {
        expect(() => createFitText({ width: -1440 })).to.throw();
        expect(() => createFitText({ width: "-1in" as `${number}in` })).to.throw();
    });

    it("should throw for a group that isn't a number, rather than write it as w:id", () => {
        expect(() => createFitText({ width: 1440, group: NaN })).to.throw();
        expect(() => createFitText({ width: 1440, group: Infinity })).to.throw();
    });
});
