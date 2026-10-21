import { describe, expect, it } from "vitest";

import { describeWordOutput } from "tests/bibliography";

import expected from "./fixtures/gb7714.json";
import { gb7714 } from "./gb7714";

describe("gb7714", () => {
    it("is Word's GB7714", () => {
        expect(gb7714).toMatchObject({ name: "GB7714", file: "GB.XSL", version: "2005" });
    });

    describeWordOutput(gb7714, expected);
});
