import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { HeaderFooterReference, HeaderFooterReferenceType, HeaderFooterType } from "./header-footer-reference";

describe("HeaderFooterReference", () => {
    it("#constructor (footer)", () => {
        const footer = new HeaderFooterReference(HeaderFooterType.FOOTER, {
            type: HeaderFooterReferenceType.DEFAULT,
            id: 1,
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

    it("#constructor (header)", () => {
        const header = new HeaderFooterReference(HeaderFooterType.HEADER, {
            type: HeaderFooterReferenceType.DEFAULT,
            id: 1,
        });

        const tree = new Formatter().format(header);
        expect(tree).to.deep.equal({
            "w:headerReference": {
                _attr: {
                    "r:id": "rId1",
                    "w:type": "default",
                },
            },
        });
    });

    it("should create without a type", () => {
        const footer = new HeaderFooterReference(HeaderFooterType.FOOTER, {
            id: 1,
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
