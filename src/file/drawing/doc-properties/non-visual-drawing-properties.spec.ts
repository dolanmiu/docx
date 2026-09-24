import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import type { IViewWrapper } from "@file/document-wrapper";
import type { IContext } from "@file/xml-components";

import { NonVisualDrawingProperties, createDecorativeExtensionList } from "./non-visual-drawing-properties";

const createContext = (addRelationship = vi.fn()): IContext =>
    ({ stack: [], viewWrapper: { Relationships: { addRelationship } } as unknown as IViewWrapper }) as unknown as IContext;

const decorative = {
    "a:ext": [
        { _attr: { uri: "{C183D7F6-B498-43B3-948B-1728B52AA6E4}" } },
        { "adec:decorative": { _attr: { "xmlns:adec": "http://schemas.microsoft.com/office/drawing/2017/decorative", val: 1 } } },
    ],
};

describe("createDecorativeExtensionList", () => {
    it("should write Word's decorative extension", () => {
        expect(new Formatter().format(createDecorativeExtensionList(false))).to.deep.equal({ "a:extLst": [{ _attr: {} }, decorative] });
    });

    it("should declare the DrawingML namespace when asked", () => {
        expect(new Formatter().format(createDecorativeExtensionList(true))).to.deep.equal({
            "a:extLst": [{ _attr: { "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main" } }, decorative],
        });
    });
});

describe("NonVisualDrawingProperties", () => {
    it("should write the id, name and alternative text", () => {
        const tree = new Formatter().format(
            new NonVisualDrawingProperties("wps:cNvPr", { id: 3, name: "Box 3", description: "A box", title: "Box" }),
            createContext(),
        );
        expect(tree).to.deep.equal({ "wps:cNvPr": { _attr: { id: 3, name: "Box 3", descr: "A box", title: "Box" } } });
    });

    it("should link to a web address, adding the relationship once however often it is written", () => {
        const addRelationship = vi.fn();
        const properties = new NonVisualDrawingProperties("pic:cNvPr", { id: 1, name: "Logo", link: "https://example.com" });
        const context = createContext(addRelationship);

        const tree = new Formatter().format(properties, context);
        new Formatter().format(properties, context);

        expect(addRelationship).toHaveBeenCalledTimes(1);
        const [linkId, type, target, mode] = addRelationship.mock.calls[0];
        expect(type).to.equal("http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink");
        expect(target).to.equal("https://example.com");
        expect(mode).to.equal("External");
        expect(tree).to.deep.equal({
            "pic:cNvPr": [{ _attr: { id: 1, name: "Logo" } }, { "a:hlinkClick": { _attr: { "r:id": `rId${linkId}` } } }],
        });
    });

    it("should add the link's relationship to each part it is written in", () => {
        const properties = new NonVisualDrawingProperties("wps:cNvPr", { id: 1, name: "Shape", link: "https://example.com" });
        const header = vi.fn();
        const footer = vi.fn();
        new Formatter().format(properties, createContext(header));
        new Formatter().format(properties, createContext(footer));
        expect(header).toHaveBeenCalledTimes(1);
        expect(footer).toHaveBeenCalledTimes(1);
    });

    it("should write the link before the decorative extension", () => {
        const tree = new Formatter().format(
            new NonVisualDrawingProperties("wpg:cNvPr", { id: 1, name: "Group", link: "https://example.com", decorative: true }),
            createContext(),
        );
        expect(tree["wpg:cNvPr"].map((child: object) => Object.keys(child)[0])).to.deep.equal(["_attr", "a:hlinkClick", "a:extLst"]);
    });
});
