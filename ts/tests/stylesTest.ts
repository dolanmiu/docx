import { assert } from "chai";
import { Styles } from "../styles";

describe("Styles", () => {
    let styles: Styles;

    beforeEach(() => {
        styles = new Styles();
    });

    describe("#constructor()", () => {

        it("should create styles with correct rootKey", () => {
            const newJson = JSON.parse(JSON.stringify(styles));
            assert.equal(newJson.rootKey, "w:styles");
        });
    });
});
