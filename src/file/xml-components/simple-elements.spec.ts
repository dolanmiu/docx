import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { BuilderElement, StringEnumValueElement } from "./simple-elements";

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

describe("StringEnumValueElement", () => {
    describe("#constructor()", () => {
        it("should create an element with an enum value", () => {
            type AlignmentType = "left" | "center" | "right";
            const element = new StringEnumValueElement<AlignmentType>("w:jc", "center");

            const tree = new Formatter().format(element);
            expect(tree).to.deep.equal({
                "w:jc": {
                    _attr: {
                        "w:val": "center",
                    },
                },
            });
        });
    });
});
