import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { HorizontalPositionAlign } from "@file/shared/alignment";

import { HorizontalPositionRelativeFrom } from "./floating-position";
import { HorizontalPosition } from "./horizontal-position";

describe("HorizontalPosition", () => {
    describe("#constructor()", () => {
        it("should create a element with position align", () => {
            const tree = new Formatter().format(
                new HorizontalPosition({
                    relative: HorizontalPositionRelativeFrom.MARGIN,
                    align: HorizontalPositionAlign.CENTER,
                }),
            );
            expect(tree).to.deep.equal({
                "wp:positionH": [
                    {
                        _attr: {
                            relativeFrom: "margin",
                        },
                    },
                    {
                        "wp:align": ["center"],
                    },
                ],
            });
        });

        it("should create a element with offset", () => {
            const tree = new Formatter().format(
                new HorizontalPosition({
                    relative: HorizontalPositionRelativeFrom.MARGIN,
                    offset: 40,
                }),
            );
            expect(tree).to.deep.equal({
                "wp:positionH": [
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
            expect(() => new HorizontalPosition({})).to.throw();
        });
    });
});
