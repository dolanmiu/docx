import { describe, expect, it } from "vitest";

import type { XmlElement as Element } from "@util/xml";

import { findFitTextIds, renumberFitTextAvoiding } from "./fit-text-ids";
import { toJson } from "./util";

const elementsOf = (xml: string): readonly Element[] => toJson(`<root>${xml}</root>`).elements![0].elements!;

const run = (id: number | string): string => `<w:r><w:rPr><w:fitText w:val="1440" w:id="${id}"/></w:rPr><w:t>A</w:t></w:r>`;

const fitTextIdsIn = (elements: readonly Element[]): readonly number[] => elements.flatMap(findFitTextIds);

describe("fit-text-ids", () => {
    describe("findFitTextIds", () => {
        it("should find the negative ids of runs fitted to a width, at any depth", () => {
            const document = toJson(
                `<w:document><w:body><w:p>${run(-3)}</w:p><w:tbl><w:tr><w:tc><w:p>${run(-7)}</w:p></w:tc></w:tr></w:tbl></w:body></w:document>`,
            );

            expect(findFitTextIds(document)).to.deep.equal([-3, -7]);
        });

        it("should ignore the groups people give, which are positive, ids that aren't numbers, and other elements' ids", () => {
            const document = toJson(`<w:p>${run(4)}${run("first")}<w:bookmarkStart w:id="-1" w:name="a"/></w:p>`);

            expect(findFitTextIds(document)).to.deep.equal([]);
        });
    });

    describe("renumberFitTextAvoiding", () => {
        it("should give a run the id below the document's lowest, in the order the runs are inserted", () => {
            const renumber = renumberFitTextAvoiding([-1, -4]);

            expect(fitTextIdsIn(renumber(elementsOf(`<w:p>${run(-90)}${run(-2)}</w:p>`)))).to.deep.equal([-5, -6]);
        });

        it("should start from -1 in a document without any", () => {
            expect(fitTextIdsIn(renumberFitTextAvoiding([])(elementsOf(run(-90))))).to.deep.equal([-1]);
        });

        it("should renumber an id the same way each time, so runs that shared an id still share one", () => {
            const renumber = renumberFitTextAvoiding([]);

            const first = renumber(elementsOf(`<w:p>${run(-9)}${run(-9)}</w:p>`));
            const later = renumber(elementsOf(`<w:p>${run(-9)}</w:p>`));

            expect(fitTextIdsIn([...first, ...later])).to.deep.equal([-1, -1, -1]);
        });

        it("should leave the groups people give, and the run's other attributes", () => {
            const [paragraph] = renumberFitTextAvoiding([])(elementsOf(`<w:p>${run(4)}${run(-9)}</w:p>`));

            expect(paragraph).to.deep.equal(elementsOf(`<w:p>${run(4)}${run(-1)}</w:p>`)[0]);
        });

        it("should not change the elements it is given", () => {
            const elements = elementsOf(run(-9));

            renumberFitTextAvoiding([])(elements);

            expect(elements).to.deep.equal(elementsOf(run(-9)));
        });
    });
});
