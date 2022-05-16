import { expect } from "chai";

import { LevelFormat, LevelSuffix } from ".";
import { AlignmentType } from "..";

import { Level } from "./level";

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
});
