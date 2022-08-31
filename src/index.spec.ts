import { expect } from "chai";

import { Document } from "./index";

describe("Index", () => {
    describe("Document", () => {
        it("should instantiate the Document", () => {
            expect(
                new Document({
                    sections: [],
                }),
            ).to.be.ok;
        });
    });
});
