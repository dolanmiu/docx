import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { Settings } from "./settings";

describe("Settings", () => {
    describe("#constructor", () => {
        it("should create a empty Settings with correct rootKey", () => {
            const settings = new Settings({});
            const tree = new Formatter().format(settings);

            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");
        });

        it("should add updateFields setting", () => {
            const settings = new Settings({
                updateFields: true,
            });

            const tree = new Formatter().format(settings);
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");

            expect(tree["w:settings"]).to.deep.include({
                "w:updateFields": {},
            });
        });

        it("should indicate modern word compatibility by default", () => {
            const settings = new Settings({});

            const tree = new Formatter().format(settings);
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");

            const compat = tree["w:settings"][2];
            expect(compat).to.be.an("object").with.keys("w:compat");
            expect(compat["w:compat"]).to.deep.include({
                "w:compatSetting": {
                    _attr: {
                        "w:val": 15,
                        "w:uri": "http://schemas.microsoft.com/office/word",
                        "w:name": "compatibilityMode",
                    },
                },
            });
        });

        it("should add trackRevisions setting", () => {
            const settings = new Settings({
                trackRevisions: true,
            });

            const tree = new Formatter().format(settings);
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");

            expect(tree["w:settings"]).to.deep.include({
                "w:trackRevisions": {},
            });
        });

        it("should add compatibility setting with default compatability version", () => {
            const settings = new Settings({
                compatibility: {},
            });

            const tree = new Formatter().format(settings);
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");

            expect(tree["w:settings"]).to.deep.include({
                "w:compat": [
                    {
                        "w:compatSetting": {
                            _attr: {
                                "w:name": "compatibilityMode",
                                "w:uri": "http://schemas.microsoft.com/office/word",
                                "w:val": 15,
                            },
                        },
                    },
                ],
            });
        });

        it("should add compatibility setting with version", () => {
            const settings = new Settings({
                compatibility: {
                    version: 99,
                },
            });

            const tree = new Formatter().format(settings);
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");

            expect(tree["w:settings"]).to.deep.include({
                "w:compat": [
                    {
                        "w:compatSetting": {
                            _attr: {
                                "w:name": "compatibilityMode",
                                "w:uri": "http://schemas.microsoft.com/office/word",
                                "w:val": 99,
                            },
                        },
                    },
                ],
            });
        });

        it("should add defaultTabStop setting with version", () => {
            const settings = new Settings({
                defaultTabStop: 100,
            });

            const tree = new Formatter().format(settings);
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");
            expect(tree["w:settings"]).to.deep.include({
                "w:defaultTabStop": {
                    _attr: {
                        "w:val": 100,
                    },
                },
            });
        });

        it("should add autoHyphenation setting", () => {
            const options = {
                hyphenation: {
                    autoHyphenation: true,
                },
            };

            const tree = new Formatter().format(new Settings(options));
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");
            expect(tree["w:settings"]).to.deep.include({
                "w:autoHyphenation": {},
            });
        });

        it("should add doNotHyphenateCaps setting", () => {
            const options = {
                hyphenation: {
                    doNotHyphenateCaps: true,
                },
            };

            const tree = new Formatter().format(new Settings(options));
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");
            expect(tree["w:settings"]).to.deep.include({
                "w:doNotHyphenateCaps": {},
            });
        });

        it("should add hyphenationZone setting", () => {
            const options = {
                hyphenation: {
                    hyphenationZone: 200,
                },
            };

            const tree = new Formatter().format(new Settings(options));
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");
            expect(tree["w:settings"]).to.deep.include({
                "w:hyphenationZone": {
                    _attr: {
                        "w:val": 200,
                    },
                },
            });
        });

        it("should add consecutiveHyphenLimit setting", () => {
            const options = {
                hyphenation: {
                    consecutiveHyphenLimit: 3,
                },
            };

            const tree = new Formatter().format(new Settings(options));
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");
            expect(tree["w:settings"]).to.deep.include({
                "w:consecutiveHyphenLimit": {
                    _attr: {
                        "w:val": 3,
                    },
                },
            });
        });

        // TODO: Remove when deprecating compatibilityModeVersion
        it("should add compatibility setting with legacy version", () => {
            const settings = new Settings({
                compatibilityModeVersion: 99,
            });

            const tree = new Formatter().format(settings);
            expect(Object.keys(tree)).has.length(1);
            expect(tree["w:settings"]).to.be.an("array");

            expect(tree["w:settings"]).to.deep.include({
                "w:compat": [
                    {
                        "w:compatSetting": {
                            _attr: {
                                "w:name": "compatibilityMode",
                                "w:uri": "http://schemas.microsoft.com/office/word",
                                "w:val": 99,
                            },
                        },
                    },
                ],
            });
        });
    });
});
