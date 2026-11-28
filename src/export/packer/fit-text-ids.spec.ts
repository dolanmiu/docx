import { describe, expect, it } from "vitest";

import { createFitTextNumbering } from "./fit-text-ids";

const run = (id: number | string): string => `<w:r><w:rPr><w:fitText w:val="1440" w:id="${id}"/></w:rPr><w:t>A</w:t></w:r>`;

const idsOf = (xml: string): readonly number[] => [...xml.matchAll(/<w:fitText [^>]*w:id="(-?\d+)"/g)].map(([, id]) => Number(id));

describe("createFitTextNumbering", () => {
    it("should number the runs fitted on their own from -1 down, in the order they are written", () => {
        expect(idsOf(createFitTextNumbering()(`<w:p>${run(-40)}${run(-7)}</w:p>`))).to.deep.equal([-1, -2]);
    });

    it("should keep runs that shared an id together, and apart from the others", () => {
        expect(idsOf(createFitTextNumbering()(`<w:p>${run(-40)}${run(-40)}${run(-7)}</w:p>`))).to.deep.equal([-1, -1, -2]);
    });

    it("should carry on numbering in the parts after the first, and keep an id the same in them", () => {
        const numberFitText = createFitTextNumbering();

        expect(idsOf(numberFitText(run(-40)))).to.deep.equal([-1]);
        expect(idsOf(numberFitText(`${run(-7)}${run(-40)}`))).to.deep.equal([-2, -1]);
    });

    it("should start again from -1 for each document", () => {
        expect(idsOf(createFitTextNumbering()(run(-40)))).to.deep.equal([-1]);
        expect(idsOf(createFitTextNumbering()(run(-41)))).to.deep.equal([-1]);
    });

    it("should leave the groups people give, ids that aren't numbers, and other elements' ids", () => {
        const xml = `<w:p>${run(3)}${run("first")}<w:bookmarkStart w:name="a" w:id="-5"/></w:p>`;

        expect(createFitTextNumbering()(xml)).to.equal(xml);
    });
});
