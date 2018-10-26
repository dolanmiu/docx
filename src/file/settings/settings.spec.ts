import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Settings } from "./settings";

describe("Settings", () => {
    describe("#constructor", () => {
        it("should create a empty Settings with correct rootKey", () => {
            const settings = new Settings();
            const tree = new Formatter().format(settings);
            let keys = Object.keys(tree);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:settings");
            expect(tree["w:settings"]).is.an.instanceof(Array);
            expect(tree["w:settings"]).has.length(1);
            keys = Object.keys(tree["w:settings"][0]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("_attr");
        });
    });
    describe("#addUpdateFields", () => {
        const assertSettingsWithUpdateFields = (settings: Settings) => {
            const tree = new Formatter().format(settings);
            let keys = Object.keys(tree);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:settings");
            const rootArray = tree["w:settings"];
            expect(rootArray).is.an.instanceof(Array);
            expect(rootArray).has.length(2);
            keys = Object.keys(rootArray[0]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("_attr");
            keys = Object.keys(rootArray[1]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:updateFields");
            const updateFieldsArray = rootArray[1]["w:updateFields"];
            keys = Object.keys(updateFieldsArray[0]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("_attr");
            const updateFieldsAttr = updateFieldsArray[0]._attr;
            expect(updateFieldsAttr["w:val"]).to.be.equal(true);
        };
        it("should add a UpdateFields with value true", () => {
            const settings = new Settings();
            settings.addUpdateFields();
            assertSettingsWithUpdateFields(settings);
        });
        it("should add a UpdateFields with value true only once", () => {
            const settings = new Settings();
            settings.addUpdateFields();
            assertSettingsWithUpdateFields(settings);
            settings.addUpdateFields();
            assertSettingsWithUpdateFields(settings);
        });
    });
});
