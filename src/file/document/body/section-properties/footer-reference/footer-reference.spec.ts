import { expect } from "chai";

import { Formatter } from "export/formatter";
import { FooterReference } from "./footer-reference";
import { FooterReferenceType } from "./footer-reference-attributes";

describe("footerReference", () => {
    it("should create", () => {
        const footer = new FooterReference({
            footerType: FooterReferenceType.DEFAULT,
            footerId: 1,
        });

        const tree = new Formatter().format(footer);

        expect(tree).to.deep.equal({
            "w:footerReference": {
                _attr: {
                    "r:id": "rId1",
                    "w:type": "default",
                },
            },
        });
    });

    it("should create without a footer type", () => {
        const footer = new FooterReference({
            footerId: 1,
        });

        const tree = new Formatter().format(footer);

        expect(tree).to.deep.equal({
            "w:footerReference": {
                _attr: {
                    "r:id": "rId1",
                    "w:type": "default",
                },
            },
        });
    });
});
