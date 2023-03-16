import { expect } from "chai";

import { createTextElementContents, getFirstLevelElements, patchSpaceAttribute, toJson } from "./util";

describe("util", () => {
    describe("toJson", () => {
        it("should return an Element", () => {
            const output = toJson("<xml></xml>");
            expect(output).to.be.an("object");
        });
    });

    describe("createTextElementContents", () => {
        it("should return an array of elements", () => {
            const output = createTextElementContents("hello");
            expect(output).to.deep.equal([{ type: "text", text: "hello" }]);
        });
    });

    describe("patchSpaceAttribute", () => {
        it("should return an element with the xml:space attribute", () => {
            const output = patchSpaceAttribute({ type: "element", name: "xml" });
            expect(output).to.deep.equal({
                type: "element",
                name: "xml",
                attributes: {
                    "xml:space": "preserve",
                },
            });
        });
    });

    describe("getFirstLevelElements", () => {
        it("should return an empty array if no elements are found", () => {
            const elements = getFirstLevelElements(
                { elements: [{ type: "element", name: "Relationships", elements: [] }] },
                "Relationships",
            );
            expect(elements).to.deep.equal([]);
        });

        it("should return an array if elements are found", () => {
            const elements = getFirstLevelElements(
                { elements: [{ type: "element", name: "Relationships", elements: [{ type: "element", name: "Relationship" }] }] },
                "Relationships",
            );
            expect(elements).to.deep.equal([{ type: "element", name: "Relationship" }]);
        });
    });
});
