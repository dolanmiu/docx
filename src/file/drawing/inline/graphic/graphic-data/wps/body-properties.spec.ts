import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { BodyProperties, VerticalAnchor } from "./body-properties";

describe("BodyProperties", () => {
    describe("#constructor()", () => {
        it("should create with default options", () => {
            const tree = new Formatter().format(new BodyProperties());

            expect(tree).to.deep.equal({
                "wps:bodyPr": {
                    _attr: {},
                },
            });
        });

        it("should create with margins", () => {
            const tree = new Formatter().format(
                new BodyProperties({
                    margins: {
                        top: 100,
                        bottom: 200,
                        left: 300,
                        right: 400,
                    },
                }),
            );

            expect(tree).to.deep.equal({
                "wps:bodyPr": {
                    _attr: {
                        tIns: 100,
                        bIns: 200,
                        lIns: 300,
                        rIns: 400,
                    },
                },
            });
        });

        it("should create with vertical anchor", () => {
            const tree = new Formatter().format(
                new BodyProperties({
                    verticalAnchor: VerticalAnchor.CENTER,
                }),
            );

            expect(tree).to.deep.equal({
                "wps:bodyPr": {
                    _attr: {
                        anchor: "ctr",
                    },
                },
            });
        });

        it("should create with noAutoFit", () => {
            const tree = new Formatter().format(
                new BodyProperties({
                    noAutoFit: true,
                }),
            );

            expect(tree).to.deep.equal({
                "wps:bodyPr": [
                    {
                        _attr: {},
                    },
                    {
                        "a:noAutofit": {},
                    },
                ],
            });
        });

        it("should create with all options", () => {
            const tree = new Formatter().format(
                new BodyProperties({
                    margins: {
                        top: 10,
                        bottom: 20,
                        left: 30,
                        right: 40,
                    },
                    verticalAnchor: VerticalAnchor.BOTTOM,
                    noAutoFit: true,
                }),
            );

            expect(tree).to.deep.equal({
                "wps:bodyPr": [
                    {
                        _attr: {
                            tIns: 10,
                            bIns: 20,
                            lIns: 30,
                            rIns: 40,
                            anchor: "b",
                        },
                    },
                    {
                        "a:noAutofit": {},
                    },
                ],
            });
        });
    });
});
