import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { ConcreteNumbering } from "./num";

describe("ConcreteNumbering", () => {
    describe("#overrideLevel", () => {
        it("sets a new override level for the given level number", () => {
            const concreteNumbering = new ConcreteNumbering({
                numId: 0,
                abstractNumId: 1,
                reference: "1",
                instance: 0,
                overrideLevel: {
                    num: 3,
                },
            });

            const tree = new Formatter().format(concreteNumbering);

            expect(tree).to.deep.equal({
                "w:num": [
                    {
                        _attr: {
                            "w:numId": 0,
                        },
                    },
                    {
                        "w:abstractNumId": {
                            _attr: {
                                "w:val": 1,
                            },
                        },
                    },
                    {
                        "w:lvlOverride": {
                            _attr: {
                                "w:ilvl": 3,
                            },
                        },
                    },
                ],
            });
        });

        it("sets the startOverride element if start is given", () => {
            const concreteNumbering = new ConcreteNumbering({
                numId: 0,
                abstractNumId: 1,
                reference: "1",
                instance: 0,
                overrideLevel: {
                    num: 1,
                    start: 9,
                },
            });
            const tree = new Formatter().format(concreteNumbering);
            expect(tree).to.deep.equal({
                "w:num": [
                    {
                        _attr: {
                            "w:numId": 0,
                        },
                    },
                    {
                        "w:abstractNumId": {
                            _attr: {
                                "w:val": 1,
                            },
                        },
                    },
                    {
                        "w:lvlOverride": [
                            {
                                _attr: {
                                    "w:ilvl": 1,
                                },
                            },
                            {
                                "w:startOverride": {
                                    _attr: {
                                        "w:val": 9,
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("sets the lvl element if overrideLevel.Level is accessed", () => {
            const concreteNumbering = new ConcreteNumbering({
                numId: 0,
                abstractNumId: 1,
                reference: "1",
                instance: 0,
                overrideLevel: {
                    num: 1,
                },
            });
            const tree = new Formatter().format(concreteNumbering);
            expect(tree).to.deep.equal({
                "w:num": [
                    {
                        _attr: {
                            "w:numId": 0,
                        },
                    },
                    {
                        "w:abstractNumId": {
                            _attr: {
                                "w:val": 1,
                            },
                        },
                    },
                    {
                        "w:lvlOverride": {
                            _attr: {
                                "w:ilvl": 1,
                            },
                        },
                    },
                ],
            });
        });
    });
});
