import { expect } from "chai";

import { ImportDotx } from "./import-dotx";

describe("ImportDotx", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const file = new ImportDotx();

            expect(file).to.deep.equal({});
        });
    });

    // describe("#extract", () => {
    //     it("should create", async () => {
    //         const file = new ImportDotx();
    //         const filePath = "./demo/dotx/template.dotx";

    //         const templateDocument = await file.extract(data);

    //         await file.extract(data);

    //         expect(templateDocument).to.be.equal({ currentRelationshipId: 1 });
    //     });
    // });
});
