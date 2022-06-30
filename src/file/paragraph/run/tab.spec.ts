import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Tab } from "./tab";

describe("Tab", () => {
    let tab: Tab;

    beforeEach(() => {
        tab = new Tab();
    });

    describe("#constructor()", () => {
        it("should create a Tab with correct root key", () => {
            const tree = new Formatter().format(tab);
            expect(tree).to.deep.equal({
                "w:tab": {},
            });
        });
    });
});
