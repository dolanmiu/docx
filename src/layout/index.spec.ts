import { describe, expect, expectTypeOf, it } from "vitest";

import * as docx from "docx";

import * as layout from ".";

describe("docx/layout", () => {
    it("should export the estimators of page numbers and the Pretext measurer, which docx doesn't", () => {
        expect(Object.keys(layout).sort()).to.deep.equal(["estimatePageNumbers", "estimatePageNumbersWith", "measureWithPretext"]);
        expect(Object.keys(layout).filter((name) => name in docx)).to.deep.equal([]);
    });

    it("should give documents an estimator of page numbers", () => {
        expectTypeOf(layout.estimatePageNumbers).toExtend<docx.PageNumberEstimator>();
        expectTypeOf<{ readonly pageNumbers: typeof layout.estimatePageNumbers }>().toExtend<
            Pick<docx.IPropertiesOptions, "pageNumbers">
        >();
    });
});

// The types of Pretext's module (version 0.0.9), as its declarations give them
declare const preparedTextBrand: unique symbol;
type PreparedTextWithSegments = { readonly [preparedTextBrand]: true; readonly segments: readonly string[] };
type PretextModule = {
    readonly prepareWithSegments: (
        text: string,
        font: string,
        options?: {
            readonly whiteSpace?: "normal" | "pre-wrap";
            readonly wordBreak?: "normal" | "keep-all";
            readonly letterSpacing?: number;
        },
    ) => PreparedTextWithSegments;
    readonly measureNaturalWidth: (prepared: PreparedTextWithSegments) => number;
    readonly layout: (prepared: PreparedTextWithSegments, maxWidth: number, lineHeight: number) => { readonly lineCount: number };
};

describe("measureWithPretext", () => {
    it("should take Pretext's module, and give a way to measure text to the estimator", () => {
        expectTypeOf<PretextModule>().toExtend<layout.Pretext<PreparedTextWithSegments>>();
        expectTypeOf(layout.measureWithPretext<PreparedTextWithSegments>).returns.toEqualTypeOf<layout.MeasureWidth>();
        expectTypeOf(layout.estimatePageNumbersWith).returns.toEqualTypeOf<docx.PageNumberEstimator>();
        expectTypeOf(layout.estimatePageNumbersWith).parameter(0).toEqualTypeOf<layout.EstimatePageNumbersOptions>();
    });
});
