import { expect } from "chai";
import { Formatter } from "export/formatter";
import * as components from "./components";

describe("Style components", () => {
    it("Name#constructor", () => {
        const style = new components.Name("Style Name");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({ "w:name": { _attr: { "w:val": "Style Name" } } });
    });

    it("BasedOn#constructor", () => {
        const style = new components.BasedOn("otherId");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({ "w:basedOn": { _attr: { "w:val": "otherId" } } });
    });

    it("Next#constructor", () => {
        const style = new components.Next("otherId");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({ "w:next": { _attr: { "w:val": "otherId" } } });
    });

    it("Link#constructor", () => {
        const style = new components.Link("otherId");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({ "w:link": { _attr: { "w:val": "otherId" } } });
    });

    it("UiPriority#constructor", () => {
        const style = new components.UiPriority("123");
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({ "w:uiPriority": { _attr: { "w:val": "123" } } });
    });

    it("UnhideWhenUsed#constructor", () => {
        const style = new components.UnhideWhenUsed();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({ "w:unhideWhenUsed": {} });
    });

    it("QuickFormat#constructor", () => {
        const style = new components.QuickFormat();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({ "w:qFormat": {} });
    });

    it("SemiHidden#constructor", () => {
        const style = new components.SemiHidden();
        const tree = new Formatter().format(style);
        expect(tree).to.deep.equal({ "w:semiHidden": {} });
    });
});
