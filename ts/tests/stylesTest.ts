import { assert, expect } from "chai";
import { Formatter } from "../export/formatter";
import { Styles } from "../styles";
import { Style } from "../styles/style";
import * as components from "../styles/style/components";

describe("Styles", () => {
    let styles: Styles;

    beforeEach(() => {
        styles = new Styles();
    });

    describe("#constructor()", () => {
        it("should create styles with correct rootKey", () => {
            const newJson = JSON.parse(JSON.stringify(styles));
            assert.equal(newJson.rootKey, "w:styles");
        });
    });
});

describe("Style", () => {
    describe("#constructor()", () => {
        it("should set the given properties", () => {
            const style = new Style({
                type: "paragraph",
                styleId: "myStyleId",
                default: true,
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    {_attr: {"w:type": "paragraph", "w:styleId": "myStyleId", "w:default": true}},
                ],
            });
        });
    });
});

describe("Style components", () => {
    it("Name#constructor", () => {
        const style = new components.Name("Style Name");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({"w:name": [{_attr: {"w:val": "Style Name"}}]});
    });

    it("BasedOn#constructor", () => {
        const style = new components.BasedOn("otherId");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({"w:basedOn": [{_attr: {"w:val": "otherId"}}]});
    });

    it("Next#constructor", () => {
        const style = new components.Next("otherId");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({"w:next": [{_attr: {"w:val": "otherId"}}]});
    });

    it("Link#constructor", () => {
        const style = new components.Link("otherId");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({"w:link": [{_attr: {"w:val": "otherId"}}]});
    });

    it("UiPriority#constructor", () => {
        const style = new components.UiPriority("123");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({"w:uiPriority": [{_attr: {"w:val": "123"}}]});
    });
});
