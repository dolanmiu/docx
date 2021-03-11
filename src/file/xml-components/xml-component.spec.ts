import { expect } from "chai";

import { Formatter } from "export/formatter";
import { EMPTY_OBJECT, XmlComponent } from "./";
import { IContext } from "./base";

class TestComponent extends XmlComponent {}

describe("XmlComponent", () => {
    let xmlComponent: TestComponent;

    beforeEach(() => {
        xmlComponent = new TestComponent("w:test");
    });

    describe("#constructor()", () => {
        it("should create an Xml Component which has the correct rootKey", () => {
            const tree = new Formatter().format(xmlComponent);
            expect(tree).to.deep.equal({
                "w:test": {},
            });
        });
    });

    describe("#prepForXml()", () => {
        it("should skip deleted elements", () => {
            const child = new TestComponent("w:test1");
            child.delete();
            xmlComponent.addChildElement(child);

            // tslint:disable-next-line: no-object-literal-type-assertion
            const xml = xmlComponent.prepForXml({} as IContext);

            if (!xml) {
                return;
            }

            expect(xml["w:test"]).to.deep.equal(EMPTY_OBJECT);
        });
    });
});
