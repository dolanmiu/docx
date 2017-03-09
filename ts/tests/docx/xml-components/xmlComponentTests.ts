import { assert } from "chai";
import { XmlComponent } from "../../../docx/xml-components";
import { Utility } from "../../utility";

class TestComponent extends XmlComponent {

}

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
});
