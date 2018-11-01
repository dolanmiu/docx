import { expect } from "chai";

import { DefaultStyle } from "./default-style";

describe("DefaultStyle", () => {
    it("creates an initially empty property object", () => {
        const style = DefaultStyle();
        expect(style).to.have.property("w:styles");
        expect(style["w:styles"].length).to.be.greaterThan(1);
        expect(style["w:styles"][1]).to.have.property("w:docDefaults");
    });
});
