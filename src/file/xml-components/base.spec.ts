import { describe, expect, it } from "vitest";

import { elementOf, isXmlComponent } from "./base";
import { XmlComponent } from "./xml-component";

class TestComponent extends XmlComponent {}

describe("isXmlComponent", () => {
    it("should know a component from this copy of docx", () => {
        expect(isXmlComponent(new TestComponent("w:test"))).to.equal(true);
    });

    it("should know a component from another copy of docx by the method that writes it", () => {
        expect(isXmlComponent({ rootKey: "w:test", prepForXml: () => ({ "w:test": {} }) })).to.equal(true);
    });

    it.each([
        ["text", "w:test"],
        ["a number", 1],
        ["null", null],
        ["undefined", undefined],
        ["an object to write as XML", { "w:test": {} }],
        ["a component copied without its class", { ...new TestComponent("w:test") }],
    ])("should not take %s for a component", (_description, value) => {
        expect(isXmlComponent(value)).to.equal(false);
    });
});

describe("elementOf", () => {
    it("should give the element a component writes", () => {
        expect(elementOf(new TestComponent("w:test"))).to.equal("w:test");
    });

    it("should give the element a component from another copy of docx writes", () => {
        expect(elementOf({ rootKey: "w:test", prepForXml: () => ({ "w:test": {} }) })).to.equal("w:test");
    });

    it("should give undefined for what isn't a component", () => {
        expect(elementOf({ "w:test": {} })).to.equal(undefined);
    });
});
