import { describe, expect, it } from "vitest";

import { FootnotesWrapper } from "./footnotes-wrapper";

describe("FootnotesWrapper", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const file = new FootnotesWrapper();

            expect(file.View).to.be.ok;
            expect(file.Relationships).to.be.ok;
        });
    });
});
