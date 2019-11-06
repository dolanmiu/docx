import { expect } from "chai";

import { Formatter } from "export/formatter";

import { LevelForOverride } from "./level";
import { ConcreteNumbering } from "./num";

describe("ConcreteNumbering", () => {
    describe("#overrideLevel", () => {
        let concreteNumbering: ConcreteNumbering;
        beforeEach(() => {
            concreteNumbering = new ConcreteNumbering(0, 1);
        });

        it("sets a new override level for the given level number", () => {
            concreteNumbering.overrideLevel(3);
            const tree = new Formatter().format(concreteNumbering);
            expect(tree["w:num"]).to.include({
                "w:lvlOverride": [
                    { _attr: { "w:ilvl": 3 } },
                    {
                        "w:lvl": [
                            { _attr: { "w:ilvl": 3, "w15:tentative": 1 } },
                            { "w:start": { _attr: { "w:val": 1 } } },
                            { "w:lvlJc": { _attr: { "w:val": "start" } } },
                        ],
                    },
                ],
            });
        });

        it("sets the startOverride element if start is given", () => {
            concreteNumbering.overrideLevel(1, 9);
            const tree = new Formatter().format(concreteNumbering);
            expect(tree["w:num"]).to.include({
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
                    {
                        "w:lvl": [
                            { _attr: { "w:ilvl": 1, "w15:tentative": 1 } },
                            { "w:start": { _attr: { "w:val": 1 } } },
                            { "w:lvlJc": { _attr: { "w:val": "start" } } },
                        ],
                    },
                ],
            });
        });

        it("sets the lvl element if overrideLevel.Level is accessed", () => {
            const ol = concreteNumbering.overrideLevel(1);
            expect(ol.Level).to.be.instanceof(LevelForOverride);
            const tree = new Formatter().format(concreteNumbering);

            expect(tree["w:num"]).to.include({
                "w:lvlOverride": [
                    { _attr: { "w:ilvl": 1 } },
                    {
                        "w:lvl": [
                            { _attr: { "w:ilvl": 1, "w15:tentative": 1 } },
                            { "w:start": { _attr: { "w:val": 1 } } },
                            { "w:lvlJc": { _attr: { "w:val": "start" } } },
                        ],
                    },
                ],
            });
        });
    });
});
