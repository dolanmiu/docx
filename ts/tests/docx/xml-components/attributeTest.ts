import {Attributes} from "../../../docx/xml-components";
import {assert} from "chai";

describe("Attribute", () => {
    let attributes: Attributes;

    beforeEach(() => {
        attributes = new Attributes();
    });

    describe("#constructor()", () => {

        it("should not add val with empty constructor", () => {
            let newAttrs = new Attributes();
            let stringifiedJson = JSON.stringify(newAttrs);
            let newJson = JSON.parse(stringifiedJson);
            assert.isUndefined(newJson.root.val);
        });

        it("should have val as defined with populated constructor", () => {
            let newAttrs = new Attributes({
                val: "test"
            });
            let stringifiedJson = JSON.stringify(newAttrs);
            let newJson = JSON.parse(stringifiedJson);
            assert.equal(newJson.root.val, "test");
        });

        it("should have space value as defined with populated constructor", () => {
            let newAttrs = new Attributes({
                space: "spaceTest"
            });
            let stringifiedJson = JSON.stringify(newAttrs);
            let newJson = JSON.parse(stringifiedJson);
            assert.equal(newJson.root.space, "spaceTest");
        });
    });
});