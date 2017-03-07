import { XmlUnitComponent } from "../../../docx/xml-components";
import { assert } from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

class TestComponent extends XmlUnitComponent {

}

describe("XmlUnitComponent", () => {
    let xmlComponent: TestComponent;

    beforeEach(() => {
        xmlComponent = new TestComponent("w:test");
    });

    describe("#constructor()", () => {

        it("should create an Xml Component which has the correct rootKey", () => {
            let newJson = jsonify(xmlComponent);
            assert.equal(newJson.rootKey, "w:test");
        });
    });

    describe("#replaceKey", () => {

        it("should not replace the key to the specified root key as root is null", () => {
            xmlComponent.replaceKey();
            let newJson = jsonify(xmlComponent);
            assert.isUndefined(newJson["w:test"]);
        });
    });
});