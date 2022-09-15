import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { AlignmentType } from "..";
import { Level, LevelFormat, LevelSuffix } from "./level";

describe("Level", () => {
    describe("#constructor", () => {
        it("should throw an error if level exceeds 9", () => {
            expect(
                () =>
                    new Level({
                        level: 10,
                        format: LevelFormat.BULLET,
                        text: "test",
                        alignment: AlignmentType.BOTH,
                        start: 3,
                        style: { run: {}, paragraph: {} },
                        suffix: LevelSuffix.SPACE,
                    }),
            ).to.throw();
        });
    });

    describe("isLegalNumberingStyle", () => {
        it("should work", () => {
            const concreteNumbering = new Level({
                level: 9,
                isLegalNumberingStyle: true,
            });
            const tree = new Formatter().format(concreteNumbering);
            expect(tree).to.deep.equal({
                "w:lvl": [
                    {
                        "w:start": {
                            _attr: {
                                "w:val": 1,
                            },
                        },
                    },
                    {
                        "w:isLgl": {},
                    },
                    {
                        "w:lvlJc": {
                            _attr: {
                                "w:val": "start",
                            },
                        },
                    },
                    {
                        _attr: {
                            "w15:tentative": 1,
                            "w:ilvl": 9,
                        },
                    },
                ],
            });
        });
    });
});
