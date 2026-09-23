import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { SourceRectangle } from "./source-rectangle";

describe("SourceRectangle", () => {
    describe("#constructor()", () => {
        it("should create an empty source rectangle when no crop is given", () => {
            const tree = new Formatter().format(new SourceRectangle());

            expect(tree).to.deep.equal({
                "a:srcRect": {},
            });
        });

        it("should create a source rectangle with all attributes when a full crop is given", () => {
            const tree = new Formatter().format(
                new SourceRectangle({
                    left: 10,
                    top: 5,
                    right: 10,
                    bottom: 5,
                }),
            );

            expect(tree).to.deep.equal({
                "a:srcRect": {
                    _attr: {
                        l: 10000,
                        t: 5000,
                        r: 10000,
                        b: 5000,
                    },
                },
            });
        });

        it("should only set the left and bottom attributes when only left and bottom are provided", () => {
            const tree = new Formatter().format(
                new SourceRectangle({
                    left: 20,
                    bottom: 15,
                }),
            );

            expect(tree).to.deep.equal({
                "a:srcRect": {
                    _attr: {
                        l: 20000,
                        b: 15000,
                    },
                },
            });
        });

        it("should only set the top and right attributes when only top and right are provided", () => {
            const tree = new Formatter().format(
                new SourceRectangle({
                    top: 25,
                    right: 30,
                }),
            );

            expect(tree).to.deep.equal({
                "a:srcRect": {
                    _attr: {
                        t: 25000,
                        r: 30000,
                    },
                },
            });
        });
    });
});
