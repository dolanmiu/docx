import { expect } from "chai";

import { DocumentWrapper } from "./document-wrapper";

describe("DocumentWrapper", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const file = new DocumentWrapper({ background: {} });

            // tslint:disable-next-line: no-unused-expression
            expect(file.View).to.be.ok;
            // tslint:disable-next-line: no-unused-expression
            expect(file.Relationships).to.be.ok;
        });
    });
});
