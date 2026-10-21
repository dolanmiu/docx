import { describe, expect, it } from "vitest";

import { describeWordOutput } from "tests/bibliography";

import expected from "./fixtures/iso-690-first-element-and-date.json";
import { iso690FirstElementAndDate } from "./iso-690-first-element-and-date";

describe("iso690FirstElementAndDate", () => {
    it("is Word's ISO 690 by first element and date", () => {
        expect(iso690FirstElementAndDate).toMatchObject({ name: "ISO 690 - First Element and Date", file: "ISO690.XSL", version: "1987" });
    });

    describeWordOutput(iso690FirstElementAndDate, expected);
});
