import { describe, expect, it } from "vitest";

import { DocumentWrapper } from "./document-wrapper";

describe("DocumentWrapper", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const file = new DocumentWrapper({ background: {} });

            expect(file.View).to.be.ok;
            expect(file.Relationships).to.be.ok;
        });
    });
});
