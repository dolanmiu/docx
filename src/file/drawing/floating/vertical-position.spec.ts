import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { VerticalPositionAlign } from "@file/shared/alignment";

import { VerticalPositionRelativeFrom } from "./floating-position";
import { createVerticalPosition } from "./vertical-position";

describe("VerticalPosition", () => {
    describe("#constructor()", () => {
        it("should create a element with position align", () => {
            const tree = new Formatter().format(
                createVerticalPosition({
                    relative: VerticalPositionRelativeFrom.MARGIN,
                    align: VerticalPositionAlign.INSIDE,
                }),
            );
            expect(tree).to.deep.equal({
                "wp:positionV": [
                    {
                        _attr: {
                            relativeFrom: "margin",
                        },
                    },
                    {
                        "wp:align": ["inside"],
                    },
                ],
            });
        });

        it("should create a element with offset", () => {
            const tree = new Formatter().format(
                createVerticalPosition({
                    relative: VerticalPositionRelativeFrom.MARGIN,
                    offset: 40,
                }),
            );
            expect(tree).to.deep.equal({
                "wp:positionV": [
                    {
                        _attr: {
                            relativeFrom: "margin",
                        },
                    },
                    {
                        "wp:posOffset": ["40"],
                    },
                ],
            });
        });

        it("should require one of align or offset", () => {
            expect(() => createVerticalPosition({})).to.throw();
        });
    });
});
