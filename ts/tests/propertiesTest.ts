import { Properties } from "../properties";
import { assert } from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Properties", () => {
    let properties: Properties;

    beforeEach(() => {

    });

    describe("#constructor()", () => {
        it("should create properties with a title", () => {
            properties = new Properties({
                title: "test document"
            });
            let newJson = jsonify(properties);
            assert(newJson.root[1].root === "test document");
        });
    });
});