import { describe, expect, it } from "vitest";

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

    describe("alignment", () => {
        const levelAlignment = (alignment: (typeof AlignmentType)[keyof typeof AlignmentType]): unknown =>
            new Formatter().format(new Level({ level: 0, alignment }))["w:lvl"].find((child: object) => "w:lvlJc" in child);

        it("writes left, center and right as they are, since they're the only values Office allows for a level", () => {
            expect(levelAlignment(AlignmentType.LEFT)).to.deep.equal({ "w:lvlJc": { _attr: { "w:val": "left" } } });
            expect(levelAlignment(AlignmentType.CENTER)).to.deep.equal({ "w:lvlJc": { _attr: { "w:val": "center" } } });
            expect(levelAlignment(AlignmentType.RIGHT)).to.deep.equal({ "w:lvlJc": { _attr: { "w:val": "right" } } });
        });

        it("writes start as left and end as right", () => {
            expect(levelAlignment(AlignmentType.START)).to.deep.equal({ "w:lvlJc": { _attr: { "w:val": "left" } } });
            expect(levelAlignment(AlignmentType.END)).to.deep.equal({ "w:lvlJc": { _attr: { "w:val": "right" } } });
        });

        it("writes the justified alignments as left", () => {
            expect(levelAlignment(AlignmentType.JUSTIFIED)).to.deep.equal({ "w:lvlJc": { _attr: { "w:val": "left" } } });
            expect(levelAlignment(AlignmentType.DISTRIBUTE)).to.deep.equal({ "w:lvlJc": { _attr: { "w:val": "left" } } });
            expect(levelAlignment(AlignmentType.THAI_DISTRIBUTE)).to.deep.equal({ "w:lvlJc": { _attr: { "w:val": "left" } } });
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
                                "w:val": "left",
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

        it("should create a paragraph style inside w:lvl", () => {
            const concreteNumbering = new Level({
                level: 0,
                style: {
                    style: "my-list-style",
                },
            });
            const tree = new Formatter().format(concreteNumbering);

            expect(tree["w:lvl"]).toContainEqual({
                "w:pStyle": {
                    _attr: {
                        "w:val": "my-list-style",
                    },
                },
            });
        });
    });
});
