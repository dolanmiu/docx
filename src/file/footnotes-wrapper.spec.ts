import { expect } from "chai";

import { FootnotesWrapper } from "./footnotes-wrapper";

describe("FootnotesWrapper", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const file = new FootnotesWrapper();

            // tslint:disable-next-line: no-unused-expression
            expect(file.View).to.be.ok;
            // tslint:disable-next-line: no-unused-expression
            expect(file.Relationships).to.be.ok;
        });
    });
});
