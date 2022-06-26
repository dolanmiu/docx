import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { Attributes, BaseXmlComponent, XmlComponent } from "./";

class TestComponent extends XmlComponent {
    public push(el: BaseXmlComponent): void {
        this.root.push(el);
    }
}

describe("XmlComponent", () => {
    describe("#constructor()", () => {
        it("should create an Xml Component which has the correct rootKey", () => {
            const xmlComponent = new TestComponent("w:test");
            const tree = new Formatter().format(xmlComponent);
            expect(tree).to.deep.equal({
                "w:test": {},
            });
        });
        it("should handle children elements", () => {
            const xmlComponent = new TestComponent("w:test");
            xmlComponent.push(
                new Attributes({
                    val: "test",
                }),
            );
            xmlComponent.push(new TestComponent("innerTest"));

            const tree = new Formatter().format(xmlComponent);
            expect(tree).to.deep.equal({
                "w:test": [
                    {
                        _attr: {
                            "w:val": "test",
                        },
                    },
                    {
                        innerTest: {},
                    },
                ],
            });
        });
        it("should hoist attrs if only attrs are present", () => {
            const xmlComponent = new TestComponent("w:test");
            xmlComponent.push(
                new Attributes({
                    val: "test",
                }),
            );

            const tree = new Formatter().format(xmlComponent);
            expect(tree).to.deep.equal({
                "w:test": {
                    _attr: {
                        "w:val": "test",
                    },
                },
            });
        });
    });
});
