import { assert } from "chai";

import { Formatter } from "../export/formatter";
import * as file from "../file";
import { CoreProperties } from "../file/core-properties";
import { Attributes } from "../file/xml-components";
import { Utility } from "../tests/utility";

describe("Formatter", () => {
    let formatter: Formatter;

    beforeEach(() => {
        formatter = new Formatter();
    });

    describe("#format()", () => {
        it("should format simple paragraph", () => {
            const paragraph = new file.Paragraph();
            const newJson = formatter.format(paragraph);
            assert.isDefined(newJson["w:p"]);
        });

        it("should remove xmlKeys", () => {
            const paragraph = new file.Paragraph();
            const newJson = formatter.format(paragraph);
            const stringifiedJson = JSON.stringify(newJson);
            assert(stringifiedJson.indexOf("xmlKeys") < 0);
        });

        it("should format simple paragraph with bold text", () => {
            const paragraph = new file.Paragraph();
            paragraph.addRun(new file.TextRun("test").bold());
            const newJson = formatter.format(paragraph);
            assert.isDefined(newJson["w:p"][1]["w:r"][0]["w:rPr"][0]["w:b"][0]._attr["w:val"]);
        });

        it("should format attributes (rsidSect)", () => {
            const attributes = new Attributes({
                rsidSect: "test2",
            });
            let newJson = formatter.format(attributes);
            newJson = Utility.jsonify(newJson);
            if (newJson._attr === undefined) {
                assert.fail();
                return;
            }
            assert.isDefined(newJson._attr["w:rsidSect"]);
        });

        it("should format attributes (val)", () => {
            const attributes = new Attributes({
                val: "test",
            });
            let newJson = formatter.format(attributes);
            newJson = Utility.jsonify(newJson);
            if (newJson._attr === undefined) {
                assert.fail();
                return;
            }
            assert.isDefined(newJson._attr["w:val"]);
        });

        it("should should change 'p' tag into 'w:p' tag", () => {
            const paragraph = new file.Paragraph();
            const newJson = formatter.format(paragraph);
            assert.isDefined(newJson["w:p"]);
        });

        it("should format Properties object correctly", () => {
            const properties = new CoreProperties({
                title: "test document",
                creator: "Dolan",
            });
            const newJson = formatter.format(properties);
            assert.isDefined(newJson["cp:coreProperties"]);
        });
    });
});
