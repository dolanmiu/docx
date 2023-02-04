import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { BuilderElement } from "./simple-elements";

describe("BuilderElement", () => {
    describe("#constructor()", () => {
        it("should create a simple BuilderElement", () => {
            const element = new BuilderElement({
                name: "test",
            });

            const tree = new Formatter().format(element);
            expect(tree).to.deep.equal({
                test: {},
            });
        });

        it("should create a simple BuilderElement with attributes", () => {
            const element = new BuilderElement<{ readonly testAttr: string }>({
                name: "test",
                attributes: {
                    testAttr: {
                        key: "w:testAttr",
                        value: "test",
                    },
                },
            });

            const tree = new Formatter().format(element);
            expect(tree).to.deep.equal({
                test: {
                    _attr: {
                        "w:testAttr": "test",
                    },
                },
            });
        });
    });
});
