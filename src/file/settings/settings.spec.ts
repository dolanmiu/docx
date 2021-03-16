import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Settings } from "./settings";

describe("Settings", () => {
    describe("#constructor", () => {
        it("should create a empty Settings with correct rootKey", () => {
            const settings = new Settings({
                evenAndOddHeaders: false,
            });
            const tree = new Formatter().format(settings);
            let keys = Object.keys(tree);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:settings");
            keys = Object.keys(tree["w:settings"]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(3);
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
            expect(rootArray).has.length(4);
            keys = Object.keys(rootArray[0]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("_attr");
            keys = Object.keys(rootArray[3]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:updateFields");
            const updateFields = rootArray[3]["w:updateFields"];
            keys = Object.keys(updateFields);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("_attr");
            const updateFieldsAttr = updateFields._attr;
            expect(updateFieldsAttr["w:val"]).to.be.equal(true);
        };
        it("should add a UpdateFields with value true", () => {
            const settings = new Settings({
                evenAndOddHeaders: false,
            });
            settings.addUpdateFields();
            assertSettingsWithUpdateFields(settings);
        });
        it("should add a UpdateFields with value true only once", () => {
            const settings = new Settings({
                evenAndOddHeaders: false,
            });
            settings.addUpdateFields();
            assertSettingsWithUpdateFields(settings);
            settings.addUpdateFields();
            assertSettingsWithUpdateFields(settings);
        });
    });
    describe("#addCompatibility", () => {
        it("should add an empty Compatibility by default", () => {
            const settings = new Settings({
                evenAndOddHeaders: false,
            });

            const tree = new Formatter().format(settings);
            let keys: string[] = Object.keys(tree);
            expect(keys[0]).to.be.equal("w:settings");
            const rootArray = tree["w:settings"];
            expect(rootArray).is.an.instanceof(Array);
            expect(rootArray).has.length(3);
            keys = Object.keys(rootArray[0]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("_attr");
            keys = Object.keys(rootArray[1]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:compat");
            expect(rootArray[1]["w:compat"][0]).to.deep.equal({
                "w:compatSetting": {
                    _attr: {
                        "w:val": 15,
                        "w:uri": "http://schemas.microsoft.com/office/word",
                        "w:name": "compatibilityMode",
                    },
                },
            });
        });
    });
    describe("#addTrackRevisions", () => {
        it("should add an empty Track Revisions", () => {
            const settings = new Settings({
                evenAndOddHeaders: false,
            });
            settings.addTrackRevisions();

            const tree = new Formatter().format(settings);
            let keys: string[] = Object.keys(tree);
            expect(keys[0]).to.be.equal("w:settings");
            const rootArray = tree["w:settings"];
            expect(rootArray).is.an.instanceof(Array);
            expect(rootArray).has.length(4);
            keys = Object.keys(rootArray[0]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("_attr");
            keys = Object.keys(rootArray[3]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:trackRevisions");
        });
    });
    describe("#addTrackRevisionsTwice", () => {
        it("should add an empty Track Revisions if called twice", () => {
            const settings = new Settings({
                evenAndOddHeaders: false,
            });
            settings.addTrackRevisions();
            settings.addTrackRevisions();

            const tree = new Formatter().format(settings);
            let keys: string[] = Object.keys(tree);
            expect(keys[0]).to.be.equal("w:settings");
            const rootArray = tree["w:settings"];
            expect(rootArray).is.an.instanceof(Array);
            expect(rootArray).has.length(4);
            keys = Object.keys(rootArray[0]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("_attr");
            keys = Object.keys(rootArray[3]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:trackRevisions");
        });
    });

    describe("#addTrackRevisionsTwice", () => {
        it("should add an empty Track Revisions if called twice", () => {
            const settings = new Settings({
                evenAndOddHeaders: true,
            });
            settings.addTrackRevisions();
            settings.addTrackRevisions();

            const tree = new Formatter().format(settings);
            let keys: string[] = Object.keys(tree);
            expect(keys[0]).to.be.equal("w:settings");
            const rootArray = tree["w:settings"];
            expect(rootArray).is.an.instanceof(Array);
            expect(rootArray).has.length(5);
            keys = Object.keys(rootArray[0]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("_attr");
            keys = Object.keys(rootArray[4]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:trackRevisions");
            keys = Object.keys(rootArray[2]);
            expect(keys).is.an.instanceof(Array);
            expect(keys).has.length(1);
            expect(keys[0]).to.be.equal("w:evenAndOddHeaders");
        });
    });
});
