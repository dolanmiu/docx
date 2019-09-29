import { expect } from "chai";

import { Formatter } from "export/formatter";
import { HeaderReference } from "./header-reference";
import { HeaderReferenceType } from "./header-reference-attributes";

describe("HeaderReference", () => {
    it("should create", () => {
        const footer = new HeaderReference({
            headerType: HeaderReferenceType.DEFAULT,
            headerId: 1,
        });

        const tree = new Formatter().format(footer);

        expect(tree).to.deep.equal({
            "w:headerReference": {
                _attr: {
                    "r:id": "rId1",
                    "w:type": "default",
                },
            },
        });
    });

    it("should create without a header type", () => {
        const footer = new HeaderReference({
            headerId: 1,
        });

        const tree = new Formatter().format(footer);

        expect(tree).to.deep.equal({
            "w:headerReference": {
                _attr: {
                    "r:id": "rId1",
                    "w:type": "default",
                },
            },
        });
    });
});
