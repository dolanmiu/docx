import { assert } from "chai";

import { Utility } from "tests/utility";
import { XmlComponent } from "./";

class TestComponent extends XmlComponent {}

describe("XmlComponent", () => {
    let xmlComponent: TestComponent;

    beforeEach(() => {
        xmlComponent = new TestComponent("w:test");
    });

    describe("#constructor()", () => {
        it("should create an Xml Component which has the correct rootKey", () => {
            const newJson = Utility.jsonify(xmlComponent);
            assert.equal(newJson.rootKey, "w:test");
        });
    });

    describe("#prepForXml()", () => {
        it("should skip deleted elements", () => {
            const child = new TestComponent("w:test1");
            child.delete();
            xmlComponent.addChildElement(child);

            const xml = xmlComponent.prepForXml();

            if (!xml) {
                return;
            }

            assert.equal(xml["w:test"].length, 0);
        });
    });
});
