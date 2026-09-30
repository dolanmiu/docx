import { describe, expect, expectTypeOf, it } from "vitest";

import * as docx from "docx";

import * as layout from ".";

describe("docx/layout", () => {
    it("should export the estimator of page numbers, which docx doesn't", () => {
        expect(Object.keys(layout)).to.deep.equal(["estimatePageNumbers"]);
        expect("estimatePageNumbers" in docx).to.equal(false);
    });

    it("should give documents an estimator of page numbers", () => {
        expectTypeOf(layout.estimatePageNumbers).toExtend<docx.PageNumberEstimator>();
        expectTypeOf<{ readonly pageNumbers: typeof layout.estimatePageNumbers }>().toExtend<
            Pick<docx.IPropertiesOptions, "pageNumbers">
        >();
    });
});
