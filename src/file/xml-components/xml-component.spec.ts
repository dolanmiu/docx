import { expect } from "chai";

import { Formatter } from "export/formatter";
import { XmlComponent } from "./";

class TestComponent extends XmlComponent {}

describe("XmlComponent", () => {
    let xmlComponent: TestComponent;

    beforeEach(() => {
        xmlComponent = new TestComponent("w:test");
    });

    describe("#constructor()", () => {
        it("should create an Xml Component which has the correct rootKey", () => {
            const tree = new Formatter().format(xmlComponent);
            expect(tree).to.deep.equal({
                "w:test": {},
            });
        });
    });
});
