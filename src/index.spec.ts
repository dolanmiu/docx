import { expect } from "chai";

import { Document } from "./index";

describe("Index", () => {
    describe("Document", () => {
        it("should instantiate the Document", () => {
            // tslint:disable-next-line: no-unused-expression
            expect(
                new Document({
                    sections: [],
                }),
            ).to.be.ok;
        });
    });
});
