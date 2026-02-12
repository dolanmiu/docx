import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createBreak } from "./break";

describe("createBreak", () => {
    it("should create a Break element with correct root key", () => {
        const breakElement = createBreak();
        const tree = new Formatter().format(breakElement);
        expect(tree).to.deep.equal({
            "w:br": {},
        });
    });
});
